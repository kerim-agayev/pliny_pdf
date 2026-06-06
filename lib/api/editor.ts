import { API_BASE } from "@/lib/api";

/**
 * Typed client for the Wave 4A cloud editor backend (`/api/editor/*`). All calls
 * send credentials so the Better Auth session cookie reaches the cross-origin
 * backend (plan-based limits + session ownership). Coordinates in text blocks are
 * PDF points; the canvas scales them to the rendered PNG.
 */

export type TextBlock = {
  blockId: string;
  x: number;
  y: number;
  w: number;
  h: number;
  text: string;
  fontSize: number;
  fontName: string;
  color: string;
  bold: boolean;
  italic: boolean;
};
export type PageData = {
  pageNum: number;
  width: number;
  height: number;
  textBlocks: TextBlock[];
};
export type OpenResult = {
  sessionId: string;
  pageCount: number;
  pages: PageData[];
  scanned: boolean;
};
export type BlockChange = {
  blockId: string;
  newText?: string;
  fontSize?: number;
  fontName?: string;
  color?: string;
  deleted?: boolean;
  bold?: boolean;
  italic?: boolean;
};

/** A client overlay annotation serialized for the server to burn into the PDF (Wave 4C). */
export type AnnotationChange = {
  type: "highlight" | "strike" | "draw" | "shape" | "comment";
  pageNum: number;
  x: number;
  y: number;
  w: number;
  h: number;
  color?: string;
  strokeWidth?: number;
  shapeType?: "rectangle" | "circle" | "arrow" | "line";
  path?: string;
  x2?: number;
  y2?: number;
  text?: string;
};

/** Error from an editor endpoint, carrying the HTTP status + backend error code. */
export class EditorError extends Error {
  status: number;
  code?: string;
  data?: Record<string, unknown>;
  constructor(message: string, status: number, code?: string, data?: Record<string, unknown>) {
    super(message);
    this.name = "EditorError";
    this.status = status;
    this.code = code;
    this.data = data;
  }
}

async function asError(res: Response): Promise<EditorError> {
  let code: string | undefined;
  let message = `Request failed (${res.status})`;
  let data: Record<string, unknown> | undefined;
  try {
    data = (await res.json()) as Record<string, unknown>;
    code = typeof data.error === "string" ? data.error : undefined;
    if (typeof data.message === "string") message = data.message;
    else if (code) message = code;
  } catch {
    /* non-JSON body */
  }
  return new EditorError(message, res.status, code, data);
}

const base = `${API_BASE}/api/editor`;

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${base}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    credentials: "include",
  });
  if (!res.ok) throw await asError(res);
  return (await res.json()) as T;
}

/** Open a session: upload the PDF, parse + render server-side. */
export async function openEditor(file: File): Promise<OpenResult> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${base}/open`, { method: "POST", body: form, credentials: "include" });
  if (!res.ok) throw await asError(res);
  return (await res.json()) as OpenResult;
}

/** URL of a rendered page PNG (0-based pageNum), for an <img> background. */
export function pagePngUrl(sessionId: string, pageNum: number): string {
  return `${base}/page/${sessionId}/${pageNum}`;
}

/** Persist inline text edits + overlay annotations and return the rebuilt PDF as a Blob. */
export async function saveEditor(
  sessionId: string,
  changes: BlockChange[],
  annotations: AnnotationChange[] = [],
): Promise<Blob> {
  if (process.env.NODE_ENV !== "production") {
    console.debug(`[EditPdf] saveEditor → ${changes.length} edit(s), ${annotations.length} annotation(s)`, annotations);
  }
  const res = await fetch(`${base}/save`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ sessionId, changes, annotations }),
    credentials: "include",
  });
  if (!res.ok) throw await asError(res);
  return res.blob();
}

export function addText(
  sessionId: string,
  params: { pageNum: number; x: number; y: number; text: string; fontSize?: number; fontName?: string; color?: string },
): Promise<{ blockId: string }> {
  return postJson("/add-text", { sessionId, ...params });
}

export function whiteout(
  sessionId: string,
  params: { pageNum: number; x: number; y: number; w: number; h: number },
): Promise<{ ok: true }> {
  return postJson("/whiteout", { sessionId, ...params });
}

export function findReplace(
  sessionId: string,
  params: { find: string; replace: string; caseSensitive?: boolean; wholeWord?: boolean },
): Promise<{ replacements: number; pages: PageData[] }> {
  return postJson("/find-replace", { sessionId, ...params });
}

/** Best-effort session teardown (fire-and-forget on unmount). */
export async function closeEditor(sessionId: string): Promise<void> {
  try {
    await fetch(`${base}/close/${sessionId}`, { method: "DELETE", credentials: "include" });
  } catch {
    /* ignore — server sweeps expired sessions anyway */
  }
}
