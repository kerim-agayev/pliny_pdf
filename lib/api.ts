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
    let message = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      message = data.message ?? data.error ?? message;
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(message, res.status);
  }
  return res.blob();
}
