import { PDFDocument } from "pdf-lib";
import JSZip from "jszip";
import { isImage } from "./common";
import { baseName } from "@/lib/format";

async function embedImage(doc: PDFDocument, file: File) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const isPng = /png/i.test(file.type) || /\.png$/i.test(file.name);
  return isPng ? doc.embedPng(bytes) : doc.embedJpg(bytes);
}

/** Combine JPG/PNG images into a single PDF, one image per page. */
export async function jpgToPdf(files: File[]) {
  const out = await PDFDocument.create();
  for (const file of files) {
    if (!isImage(file)) continue;
    const img = await embedImage(out, file);
    const page = out.addPage([img.width, img.height]);
    page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
  }
  const data = await out.save();
  return new Blob([data as BlobPart], { type: "application/pdf" });
}

/** Create one PDF per image, bundled into a single .zip. */
export async function jpgToPdfSeparate(files: File[]) {
  const zip = new JSZip();
  let count = 0;
  for (const file of files) {
    if (!isImage(file)) continue;
    const out = await PDFDocument.create();
    const img = await embedImage(out, file);
    const page = out.addPage([img.width, img.height]);
    page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
    const data = await out.save();
    zip.file(`${baseName(file.name)}.pdf`, data);
    count++;
  }
  const blob = await zip.generateAsync({ type: "blob" });
  return { blob, count, filename: "images-pdfs.zip" };
}
