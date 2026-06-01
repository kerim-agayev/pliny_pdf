import { PDFDocument } from "pdf-lib";
import { getPdfjs } from "./pdfjs";

const SCALE = 2;

/**
 * Convert every page to grayscale by re-rasterizing it (pdfjs render → grayscale the
 * pixels → embed as an image page). Text becomes part of the image, like Compress's
 * raster pass. `onProgress` reports page-by-page progress for the UI.
 */
export async function grayscalePdf(
  file: File,
  onProgress?: (page: number, total: number) => void,
): Promise<Blob> {
  const buf = await file.arrayBuffer();
  const src = await PDFDocument.load(buf, { ignoreEncryption: true });
  const pdfjs = await getPdfjs();
  const jsDoc = await pdfjs.getDocument({ data: buf.slice(0) }).promise;
  const out = await PDFDocument.create();
  const total = src.getPageCount();

  for (let i = 0; i < total; i++) {
    const page = await jsDoc.getPage(i + 1);
    const viewport = page.getViewport({ scale: SCALE });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) continue;
    await page.render({ canvasContext: ctx, viewport, canvas }).promise;
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = img.data;
    for (let p = 0; p < d.length; p += 4) {
      const lum = 0.299 * d[p] + 0.587 * d[p + 1] + 0.114 * d[p + 2];
      d[p] = d[p + 1] = d[p + 2] = lum;
    }
    ctx.putImageData(img, 0, 0);
    const png = await out.embedPng(canvas.toDataURL("image/png"));
    const { width, height } = src.getPage(i).getSize();
    const np = out.addPage([width, height]);
    np.drawImage(png, { x: 0, y: 0, width, height });
    onProgress?.(i + 1, total);
  }

  const data = await out.save();
  return new Blob([data as BlobPart], { type: "application/pdf" });
}
