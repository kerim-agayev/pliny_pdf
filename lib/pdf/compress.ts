import { PDFDocument } from "pdf-lib";
import { getPdfjs } from "./pdfjs";
import { compressRasterCore, domCanvasEnv } from "./raster-core";
import { compressRasterInWorker } from "@/lib/workers/pdfWorkerClient";

export type CompressPreset = "max" | "balanced" | "high";

/**
 * Three genuinely different presets (Phase 3, Wave 3C; recalibrated after gate-3C
 * testing — see docs/phase_3/decisions.md). pdfjs renders at a scale where
 * 1.0 === 72 DPI, so `scale = dpi / 72`. Values are kept at/below typical screen
 * resolution so every preset actually reduces a normal image PDF (the spec's
 * 300 DPI "high" never compressed screen-res PDFs and made large files crawl),
 * while staying ordered: max (smallest) < balanced < high (best quality).
 *  - max:      72 DPI,  JPEG quality 0.35 (smallest)
 *  - balanced: 96 DPI,  JPEG quality 0.55
 *  - high:     120 DPI, JPEG quality 0.72 (best quality)
 */
const RASTER: Record<CompressPreset, { dpi: number; quality: number }> = {
  max: { dpi: 72, quality: 0.35 },
  balanced: { dpi: 96, quality: 0.55 },
  high: { dpi: 120, quality: 0.72 },
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

/** Rasterize each page to a JPEG and rebuild (only helps image-heavy/scanned PDFs).
 * Wave 3G-3: runs in the Web Worker (OffscreenCanvas) when available, else main thread. */
async function rasterBytes(input: ArrayBuffer, preset: CompressPreset): Promise<Uint8Array> {
  const { dpi, quality } = RASTER[preset];
  const opts = { scale: dpi / BASE_DPI, quality };
  try {
    const { buf } = await compressRasterInWorker(input.slice(0), opts);
    return new Uint8Array(buf);
  } catch {
    const pdfjs = await getPdfjs();
    return compressRasterCore(pdfjs, domCanvasEnv(), input, opts);
  }
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
