/** Base URL of the Bun/Elysia backend. */
export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/**
 * POST a single file (multipart) to a backend endpoint and return the response
 * body as a Blob. Always sends credentials so the Better Auth session cookie
 * reaches the cross-origin backend (for plan-based rate limits + history).
 */
export async function postFile(path: string, file: File): Promise<Blob> {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    body: form,
    credentials: "include",
  });

  if (!res.ok) {
    throw await toApiError(res);
  }
  return res.blob();
}

/**
 * Like postFile, but also appends extra string form fields (e.g. an OCR
 * language). Returns the response body as a Blob.
 */
export async function postFileForm(
  path: string,
  file: File,
  fields: Record<string, string>,
): Promise<Blob> {
  const form = new FormData();
  form.append("file", file);
  for (const [k, v] of Object.entries(fields)) form.append(k, v);

  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    body: form,
    credentials: "include",
  });

  if (!res.ok) {
    throw await toApiError(res);
  }
  return res.blob();
}

/** Like postFile, but parses a JSON response (used by AI Summarize). */
export async function postFileJson<T>(path: string, file: File): Promise<T> {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    body: form,
    credentials: "include",
  });

  if (!res.ok) {
    throw await toApiError(res);
  }
  return (await res.json()) as T;
}

/**
 * POST one or more files (multipart) and return the binary response together
 * with the server-chosen download name (parsed from Content-Disposition). Used
 * by the Wave 5B cloud tools where the output name/type is decided server-side
 * (e.g. PDF→JPG returns a `.jpg` or a `.zip`). A single file is sent as `file`;
 * multiple files as repeated `files` parts (e.g. Merge).
 */
export async function postBinary(
  path: string,
  files: File[],
  fallbackName: string,
  fields?: Record<string, string>,
): Promise<{ blob: Blob; filename: string }> {
  const form = new FormData();
  if (files.length === 1) {
    form.append("file", files[0]);
  } else {
    for (const f of files) form.append("files", f);
  }
  if (fields) for (const [k, v] of Object.entries(fields)) form.append(k, v);

  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    body: form,
    credentials: "include",
  });

  if (!res.ok) {
    throw await toApiError(res);
  }
  return { blob: await res.blob(), filename: filenameFromDisposition(res) ?? fallbackName };
}

/** Pull `filename="…"` out of a Content-Disposition header, if present. */
function filenameFromDisposition(res: Response): string | null {
  const cd = res.headers.get("content-disposition");
  const m = cd?.match(/filename="?([^"]+)"?/i);
  return m?.[1] ?? null;
}

/** POST a JSON body and parse a JSON response (used by billing checkout). */
export async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    credentials: "include",
  });

  if (!res.ok) {
    throw await toApiError(res);
  }
  return (await res.json()) as T;
}

async function toApiError(res: Response): Promise<ApiError> {
  let message = `Request failed (${res.status})`;
  try {
    const data = await res.json();
    message = data.message ?? data.error ?? message;
  } catch {
    /* non-JSON error body */
  }
  return new ApiError(message, res.status);
}
