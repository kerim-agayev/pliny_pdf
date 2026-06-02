import { getPdfjs } from "./pdfjs";
import { grayscaleCore, domCanvasEnv } from "./raster-core";
import { grayscaleInWorker } from "@/lib/workers/pdfWorkerClient";

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
 *
 * Wave 3G-3: runs off the main thread in a Web Worker (OffscreenCanvas) when available,
 * falling back to the main thread on any failure.
 */
export async function grayscalePdf(
  file: File,
  onProgress?: (page: number, total: number) => void,
): Promise<GrayscaleResult> {
  const buf = await file.arrayBuffer();
  const opts = { scale: SCALE, quality: JPEG_QUALITY };

  try {
    const { buf: out, inflated } = await grayscaleInWorker(buf.slice(0), opts, onProgress);
    return { blob: new Blob([out], { type: "application/pdf" }), inflated };
  } catch {
    // Worker unavailable / failed — render on the main thread instead.
    const pdfjs = await getPdfjs();
    const { bytes, inflated } = await grayscaleCore(pdfjs, domCanvasEnv(), buf, opts, onProgress);
    return { blob: new Blob([bytes as BlobPart], { type: "application/pdf" }), inflated };
  }
}
