import { PDFDocument } from "pdf-lib";

/** Flatten interactive form fields into static page content. No-op if there's no form. */
export async function flattenPdf(file: File): Promise<Blob> {
  const doc = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
  try {
    doc.getForm().flatten();
  } catch {
    // some PDFs have a malformed AcroForm; saving without flatten is still valid
  }
  const data = await doc.save();
  return new Blob([data as BlobPart], { type: "application/pdf" });
}
