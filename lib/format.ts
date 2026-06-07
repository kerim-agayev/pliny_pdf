import { saveRecentFile } from "./recentFiles";

/** Human-readable byte size, e.g. 1.2 MB. */
export function formatBytes(bytes: number): string {
  if (bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, i);
  return `${value >= 100 || i === 0 ? Math.round(value) : value.toFixed(1)} ${units[i]}`;
}

// Above this size, prefer the File System Access API so large output is written
// straight to a user-chosen file instead of going through a blob: URL download.
const STREAM_THRESHOLD = 10 * 1024 * 1024; // 10 MB

// `showSaveFilePicker` isn't in lib.dom; describe just what we use.
interface FsWritable {
  write(data: Blob): Promise<void>;
  close(): Promise<void>;
}
interface FsFileHandle {
  createWritable(): Promise<FsWritable>;
}
interface FsAcceptType {
  description: string;
  accept: Record<string, string[]>;
}
type ShowSaveFilePicker = (opts?: {
  suggestedName?: string;
  types?: FsAcceptType[];
}) => Promise<FsFileHandle>;

// The four output types the app produces. Passing the matching entry as the
// picker's `types` makes the browser keep/re-append the extension and tag the
// correct MIME type even when the user renames the file in the Save dialog.
const SAVE_TYPES: Record<string, FsAcceptType> = {
  ".pdf": { description: "PDF document", accept: { "application/pdf": [".pdf"] } },
  ".jpg": { description: "JPEG image", accept: { "image/jpeg": [".jpg", ".jpeg"] } },
  ".zip": { description: "ZIP archive", accept: { "application/zip": [".zip"] } },
  ".docx": {
    description: "Word document",
    accept: {
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    },
  },
};

/** Lowercased trailing extension (incl. dot), or "" if none. */
function extOf(name: string): string {
  return name.toLowerCase().match(/\.[a-z0-9]+$/)?.[0] ?? "";
}

function pickerSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    window.isSecureContext &&
    "showSaveFilePicker" in window
  );
}

/** Classic anchor + blob: URL download (universal fallback). */
function anchorDownload(blob: Blob, filename: string) {
  // Safety net: the `download` attribute should always carry an extension so the
  // saved file keeps its type. Callers pass one today; default to .pdf otherwise.
  const name = extOf(filename) ? filename : `${filename}.pdf`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Stream the blob to a user-chosen file via the File System Access API. */
async function streamSave(blob: Blob, filename: string) {
  const picker = (window as unknown as { showSaveFilePicker: ShowSaveFilePicker })
    .showSaveFilePicker;
  // Called synchronously at the start of this async fn so the click's user
  // activation is still valid; suggestedName carries the extension/type, and
  // `types` keeps the extension even if the user renames the file in the dialog.
  const type = SAVE_TYPES[extOf(filename)];
  const handle = await picker({
    suggestedName: filename,
    ...(type ? { types: [type] } : {}),
  });
  const writable = await handle.createWritable();
  await writable.write(blob);
  await writable.close();
}

/** Trigger a download for a Blob. Large files (≥10 MB) use the File System Access
 * API when available — written directly to a chosen location, falling back to the
 * anchor method on unsupported browsers. Records the file in the local recent-files
 * list (metadata only) when triggered from a known tool page; a cancelled save
 * picker records nothing (no file was written). */
export function downloadBlob(blob: Blob, filename: string) {
  if (blob.size >= STREAM_THRESHOLD && pickerSupported()) {
    streamSave(blob, filename)
      .then(() => recordRecent(filename, blob.size))
      .catch((err: unknown) => {
        if ((err as DOMException)?.name === "AbortError") return; // user cancelled
        anchorDownload(blob, filename); // any other failure → fall back
        recordRecent(filename, blob.size);
      });
    return;
  }
  anchorDownload(blob, filename);
  recordRecent(filename, blob.size);
}

// Locale prefixes to ignore when deriving the tool slug from the path.
const LOCALES = new Set(["en", "tr", "ru"]);

/** Derive the tool slug from the current path's last segment and store a recent-file
 * entry. downloadBlob only fires on tool pages, so the last segment is the slug.
 * (No import of the tools catalog here — this file is also used by the Bun server.) */
function recordRecent(filename: string, bytes: number) {
  try {
    const seg = window.location.pathname.split("/").filter(Boolean).pop() ?? "";
    if (!seg || LOCALES.has(seg)) return; // not a tool page
    saveRecentFile({ filename, toolSlug: seg, sizeMB: Math.round((bytes / 1048576) * 100) / 100 });
  } catch {
    /* non-browser context — skip */
  }
}

/** Strip extension from a filename. */
export function baseName(name: string): string {
  return name.replace(/\.[^/.]+$/, "");
}

export const MAX_FILE_BYTES = 100 * 1024 * 1024; // 100 MB
