import { PDFDocument } from "pdf-lib";
import { getPdfjs } from "./pdfjs";

// Cap raster resolution at 150 DPI (pdfjs scale 1.0 === 72 DPI) and embed JPEG
// (much smaller than PNG) to keep the grayscale output as small as possible.
const DPI = 150;
const SCALE = DPI / 72;
const JPEG_QUALITY = 0.72;

export interface GrayscaleResult {
  blob: Blob;
  /** true when the grayscale output ended up larger than the original (still returned — converting is the point) */
  inflated: boolean;
}

/**
 * Convert every page to grayscale by re-rasterizing it (pdfjs render → grayscale the
 * pixels → embed as a JPEG image page). Text becomes part of the image, like Compress's
 * raster pass. The grayscale result is ALWAYS returned (the conversion is the deliverable);
 * if it happens to be larger than the original, `inflated` is set so the UI can warn —
 * we never silently hand back the still-colored original. `onProgress` reports progress.
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
  return {
    blob: new Blob([data as BlobPart], { type: "application/pdf" }),
    inflated: data.byteLength > buf.byteLength,
  };
}
