import { PDFDocument } from "pdf-lib";
import { getPdfjs } from "./pdfjs";

export type CompressPreset = "max" | "balanced" | "high";

/**
 * Three genuinely different presets (Phase 3, Wave 3C). pdfjs renders at a scale
 * where 1.0 === 72 DPI, so `scale = dpi / 72`.
 *  - max:      96 DPI,  JPEG quality 0.30 (smallest)
 *  - balanced: 150 DPI, JPEG quality 0.60
 *  - high:     300 DPI, JPEG quality 0.85 (best quality)
 */
const RASTER: Record<CompressPreset, { dpi: number; quality: number }> = {
  max: { dpi: 96, quality: 0.3 },
  balanced: { dpi: 150, quality: 0.6 },
  high: { dpi: 300, quality: 0.85 },
};

const BASE_DPI = 72;

export interface CompressResult {
  blob: Blob;
  originalSize: number;
  newSize: number;
  /** false when the original was already smaller and was kept as-is */
  changed: boolean;
  /** true when the PDF has no images, so image processing was skipped */
  textOnly: boolean;
}

/** Lossless re-save: rebuild the object table with object streams. No rasterization. */
async function losslessBytes(input: ArrayBuffer): Promise<Uint8Array> {
  const doc = await PDFDocument.load(input, { ignoreEncryption: true });
  return doc.save({ useObjectStreams: true });
}

/** Whether any page paints a raster image — if not, rasterizing only inflates a text PDF. */
async function hasImages(input: ArrayBuffer): Promise<boolean> {
  const pdfjs = await getPdfjs();
  const OPS = pdfjs.OPS as Record<string, number>;
  const imageOps = new Set<number>(
    Object.keys(OPS)
      .filter((k) => k.startsWith("paintImage") || k.startsWith("paintInlineImage"))
      .map((k) => OPS[k]),
  );
  const doc = await pdfjs.getDocument({ data: input.slice(0) }).promise;
  try {
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const ops = await page.getOperatorList();
      if (ops.fnArray.some((fn) => imageOps.has(fn))) return true;
    }
    return false;
  } finally {
    doc.destroy();
  }
}

/** Rasterize each page to a JPEG and rebuild (only helps image-heavy/scanned PDFs). */
async function rasterBytes(input: ArrayBuffer, preset: CompressPreset): Promise<Uint8Array> {
  const pdfjs = await getPdfjs();
  const { dpi, quality } = RASTER[preset];
  const scale = dpi / BASE_DPI;
  const doc = await pdfjs.getDocument({ data: input.slice(0) }).promise;
  const out = await PDFDocument.create();
  try {
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
  } finally {
    doc.destroy();
  }
  return out.save();
}

/**
 * Compress without ever inflating the file:
 * 1. always try a lossless object-stream re-save (best for text/vector PDFs),
 * 2. for PDFs that actually contain images, also try rasterization at the preset
 *    DPI/quality (helps image-heavy/scanned PDFs); pure-text PDFs skip this,
 * 3. keep whichever is smallest; if nothing beats the original, return the original.
 */
export async function compressPdf(file: File, preset: CompressPreset): Promise<CompressResult> {
  const input = await file.arrayBuffer();
  const originalSize = file.size;

  let textOnly = false;
  try {
    textOnly = !(await hasImages(input));
  } catch {
    /* detection failed — fall back to attempting raster */
  }

  let bestBytes: Uint8Array | null = null;
  try {
    bestBytes = await losslessBytes(input);
  } catch {
    /* fall through to raster / original */
  }

  if (!textOnly) {
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
      textOnly,
    };
  }

  return {
    blob: new Blob([bestBytes as BlobPart], { type: "application/pdf" }),
    originalSize,
    newSize: bestBytes.byteLength,
    changed: true,
    textOnly,
  };
}
