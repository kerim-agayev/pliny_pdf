import { PDFDocument } from "pdf-lib";
import { getPdfjs } from "./pdfjs";

// Cap raster resolution at 150 DPI (pdfjs scale 1.0 === 72 DPI) and embed JPEG
// (much smaller than PNG) so grayscaling shrinks rather than inflates the file.
const DPI = 150;
const SCALE = DPI / 72;
const JPEG_QUALITY = 0.8;

export interface GrayscaleResult {
  blob: Blob;
  /** false when the grayscale output wasn't smaller, so the original was returned unchanged */
  changed: boolean;
}

/**
 * Convert every page to grayscale by re-rasterizing it (pdfjs render → grayscale the
 * pixels → embed as a JPEG image page). Text becomes part of the image, like Compress's
 * raster pass. Never inflates: if the result isn't smaller than the input, the original
 * is returned with `changed: false`. `onProgress` reports page-by-page progress.
 */
export async function grayscalePdf(
  file: File,
  onProgress?: (page: number, total: number) => void,
): Promise<GrayscaleResult> {
  const buf = await file.arrayBuffer();
  const src = await PDFDocument.load(buf, { ignoreEncryption: true });
  const pdfjs = await getPdfjs();
  const jsDoc = await pdfjs.getDocument({ data: buf.slice(0) }).promise;
  const out = await PDFDocument.create();
  const total = src.getPageCount();

  try {
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
      const jpeg: Blob = await new Promise((resolve, reject) =>
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("encode failed"))), "image/jpeg", JPEG_QUALITY),
      );
      const embedded = await out.embedJpg(new Uint8Array(await jpeg.arrayBuffer()));
      const { width, height } = src.getPage(i).getSize();
      const np = out.addPage([width, height]);
      np.drawImage(embedded, { x: 0, y: 0, width, height });
      onProgress?.(i + 1, total);
    }
  } finally {
    jsDoc.destroy();
  }

  const data = await out.save();
  if (data.byteLength >= buf.byteLength) {
    // Couldn't reduce further — return the original rather than a larger file.
    return { blob: new Blob([buf], { type: "application/pdf" }), changed: false };
  }
  return { blob: new Blob([data as BlobPart], { type: "application/pdf" }), changed: true };
}
