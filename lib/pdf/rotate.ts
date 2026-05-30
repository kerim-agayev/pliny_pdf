import { PDFDocument, degrees } from "pdf-lib";

/** Rotate every page by `delta` degrees (added to existing rotation). */
export async function rotatePdf(file: File, delta: number) {
  const doc = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
  for (const page of doc.getPages()) {
    const current = page.getRotation().angle;
    page.setRotation(degrees((((current + delta) % 360) + 360) % 360));
  }
  const data = await doc.save();
  return new Blob([data as BlobPart], { type: "application/pdf" });
}
