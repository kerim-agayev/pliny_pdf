const GOTENBERG_URL = process.env.GOTENBERG_URL ?? "http://localhost:3001";

/**
 * Word (.docx/.doc) → PDF via Gotenberg's LibreOffice HTTP route.
 * Gotenberg's libreoffice route only outputs PDF, which is exactly this direction.
 */
export async function wordToPdf(input: Uint8Array, filename: string): Promise<Uint8Array> {
  const form = new FormData();
  form.append("files", new Blob([input as BlobPart]), filename);

  const res = await fetch(`${GOTENBERG_URL}/forms/libreoffice/convert`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Gotenberg ${res.status}: ${detail.slice(0, 200)}`);
  }
  return new Uint8Array(await res.arrayBuffer());
}
