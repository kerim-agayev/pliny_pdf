import { PDFDocument } from "pdf-lib";
import { baseName } from "@/lib/format";

/**
 * Reverse the page order of a PDF (last page first), entirely in the browser
 * via pdf-lib. The source document is never mutated.
 */
export async function reversePages(file: File): Promise<{
  blob: Blob;
  filename: string;
  pageCount: number;
}> {
  const src = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
  const total = src.getPageCount();
  const indices = src.getPageIndices().reverse();
  const out = await PDFDocument.create();
  const pages = await out.copyPages(src, indices);
  pages.forEach((p) => out.addPage(p));
  const data = await out.save();
  return {
    blob: new Blob([data as BlobPart], { type: "application/pdf" }),
    filename: `${baseName(file.name)}-reversed.pdf`,
    pageCount: total,
  };
}
