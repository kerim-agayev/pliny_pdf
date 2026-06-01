import { PDFDocument } from "pdf-lib";

/**
 * Remove the given 0-based page indices, returning a new PDF with the rest.
 * The source document is never mutated.
 */
export async function deletePages(file: File, toDelete: Set<number>): Promise<Blob> {
  const src = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
  const keep = src.getPageIndices().filter((i) => !toDelete.has(i));
  const out = await PDFDocument.create();
  const pages = await out.copyPages(src, keep);
  pages.forEach((p) => out.addPage(p));
  const data = await out.save();
  return new Blob([data as BlobPart], { type: "application/pdf" });
}
