import { PDFDocument } from "pdf-lib";
import JSZip from "jszip";
import { baseName } from "@/lib/format";

/** Extract a 1-based, inclusive page range into a single PDF. */
export async function splitRange(file: File, from: number, to: number) {
  const src = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
  const total = src.getPageCount();
  const start = Math.max(1, Math.min(from, total));
  const end = Math.max(start, Math.min(to, total));
  const out = await PDFDocument.create();
  const indices: number[] = [];
  for (let i = start - 1; i <= end - 1; i++) indices.push(i);
  const pages = await out.copyPages(src, indices);
  pages.forEach((p) => out.addPage(p));
  const data = await out.save();
  return {
    blob: new Blob([data as BlobPart], { type: "application/pdf" }),
    pageCount: out.getPageCount(),
    filename: `${baseName(file.name)}-pages-${start}-${end}.pdf`,
  };
}

/** Split every page into its own PDF, bundled as a .zip. */
export async function splitEach(file: File) {
  const src = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
  const total = src.getPageCount();
  const zip = new JSZip();
  const name = baseName(file.name);
  for (let i = 0; i < total; i++) {
    const out = await PDFDocument.create();
    const [p] = await out.copyPages(src, [i]);
    out.addPage(p);
    const data = await out.save();
    zip.file(`${name}-${String(i + 1).padStart(3, "0")}.pdf`, data);
  }
  const blob = await zip.generateAsync({ type: "blob" });
  return { blob, count: total, filename: `${name}-pages.zip` };
}
