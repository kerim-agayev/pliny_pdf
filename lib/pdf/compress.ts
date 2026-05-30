import { PDFDocument } from "pdf-lib";
import { getPdfjs } from "./pdfjs";

export type CompressPreset = "screen" | "balanced" | "maximum";

const RASTER: Record<CompressPreset, { scale: number; quality: number }> = {
  screen: { scale: 1.0, quality: 0.5 },
  balanced: { scale: 1.35, quality: 0.72 },
  maximum: { scale: 1.7, quality: 0.88 },
};

export interface CompressResult {
  blob: Blob;
  originalSize: number;
  newSize: number;
  /** false when the original was already smaller and was kept as-is */
  changed: boolean;
}

/** Lossless re-save: rebuild the object table with object streams. No rasterization. */
async function losslessBytes(input: ArrayBuffer): Promise<Uint8Array> {
  const doc = await PDFDocument.load(input, { ignoreEncryption: true });
  return doc.save({ useObjectStreams: true });
}

/** Rasterize each page to a JPEG and rebuild (only helps image-heavy/scanned PDFs). */
async function rasterBytes(input: ArrayBuffer, preset: CompressPreset): Promise<Uint8Array> {
  const pdfjs = await getPdfjs();
  const { scale, quality } = RASTER[preset];
  const doc = await pdfjs.getDocument({ data: input.slice(0) }).promise;
  const out = await PDFDocument.create();
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas unavailable");
    await page.render({ canvasContext: ctx, viewport, canvas }).promise;
    const jpeg: Blob = await new Promise((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("encode failed"))), "image/jpeg", quality),
    );
    const img = await out.embedJpg(new Uint8Array(await jpeg.arrayBuffer()));
    const p = out.addPage([viewport.width, viewport.height]);
    p.drawImage(img, { x: 0, y: 0, width: viewport.width, height: viewport.height });
  }
  return out.save();
}

/**
 * Compress without ever inflating the file:
 * 1. always try a lossless object-stream re-save (best for text/vector PDFs),
 * 2. for screen/balanced, also try rasterization (helps image-heavy PDFs),
 * 3. keep whichever is smallest; if nothing beats the original, return the original.
 */
export async function compressPdf(file: File, preset: CompressPreset): Promise<CompressResult> {
  const input = await file.arrayBuffer();
  const originalSize = file.size;

  let bestBytes: Uint8Array | null = null;
  try {
    bestBytes = await losslessBytes(input);
  } catch {
    /* fall through to raster / original */
  }

  if (preset !== "maximum") {
    try {
      const raster = await rasterBytes(input, preset);
      if (!bestBytes || raster.byteLength < bestBytes.byteLength) bestBytes = raster;
    } catch {
      /* keep lossless / original */
    }
  }

  if (!bestBytes || bestBytes.byteLength >= originalSize) {
    return {
      blob: new Blob([input], { type: "application/pdf" }),
      originalSize,
      newSize: originalSize,
      changed: false,
    };
  }

  return {
    blob: new Blob([bestBytes as BlobPart], { type: "application/pdf" }),
    originalSize,
    newSize: bestBytes.byteLength,
    changed: true,
  };
}
