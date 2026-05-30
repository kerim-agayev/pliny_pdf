import { PDFDocument } from "pdf-lib";
import { isImage } from "./common";

/** Combine JPG/PNG images into a single PDF, one image per page. */
export async function jpgToPdf(files: File[]) {
  const out = await PDFDocument.create();
  for (const file of files) {
    if (!isImage(file)) continue;
    const bytes = new Uint8Array(await file.arrayBuffer());
    const isPng = /png/i.test(file.type) || /\.png$/i.test(file.name);
    const img = isPng ? await out.embedPng(bytes) : await out.embedJpg(bytes);
    const page = out.addPage([img.width, img.height]);
    page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
  }
  const data = await out.save();
  return new Blob([data as BlobPart], { type: "application/pdf" });
}
