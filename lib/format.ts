import { saveRecentFile } from "./recentFiles";

/** Human-readable byte size, e.g. 1.2 MB. */
export function formatBytes(bytes: number): string {
  if (bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, i);
  return `${value >= 100 || i === 0 ? Math.round(value) : value.toFixed(1)} ${units[i]}`;
}

/** Trigger a browser download for a Blob. Also records the file in the local
 * recent-files list (metadata only) when triggered from a known tool page. */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
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
