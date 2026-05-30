import { PDFDocument } from "pdf-lib";

/** Merge multiple PDFs into one, preserving the given order. Runs in-browser. */
export async function mergePdfs(files: File[]): Promise<{ blob: Blob; pageCount: number }> {
  const out = await PDFDocument.create();
  for (const file of files) {
    const src = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
    const pages = await out.copyPages(src, src.getPageIndices());
    pages.forEach((p) => out.addPage(p));
  }
  const data = await out.save();
  return {
    blob: new Blob([data as BlobPart], { type: "application/pdf" }),
    pageCount: out.getPageCount(),
  };
}
