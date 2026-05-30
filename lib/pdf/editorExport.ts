import { PDFDocument } from "pdf-lib";

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(",")[1] ?? "";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/**
 * Stamp per-page annotation overlays (transparent PNG data URLs, keyed by 0-based
 * page index) onto the original PDF. Original page content/text is preserved;
 * only the annotation layer is rasterized.
 */
export async function exportAnnotatedPdf(file: File, overlays: Record<number, string>): Promise<Blob> {
  const doc = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
  const pages = doc.getPages();
  for (const [key, dataUrl] of Object.entries(overlays)) {
    const idx = Number(key);
    const page = pages[idx];
    if (!page || !dataUrl) continue;
    const png = await doc.embedPng(dataUrlToBytes(dataUrl));
    const { width, height } = page.getSize();
    page.drawImage(png, { x: 0, y: 0, width, height });
  }
  const data = await doc.save();
  return new Blob([data as BlobPart], { type: "application/pdf" });
}
