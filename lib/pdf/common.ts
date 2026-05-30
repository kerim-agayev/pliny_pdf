import { PDFDocument } from "pdf-lib";

/** Read the page count of a PDF file (tolerant of encrypted docs). */
export async function readPageCount(file: File): Promise<number> {
  const doc = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
  return doc.getPageCount();
}

export const PDF_MIME = "application/pdf";

export function isPdf(file: File): boolean {
  return file.type === PDF_MIME || file.name.toLowerCase().endsWith(".pdf");
}

export function isImage(file: File): boolean {
  return /image\/(jpe?g|png)/.test(file.type) || /\.(jpe?g|png)$/i.test(file.name);
}
