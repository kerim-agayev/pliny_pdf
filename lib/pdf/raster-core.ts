import { PDFDocument } from "pdf-lib";
import type { PDFPageProxy } from "pdfjs-dist";

/**
 * Shared, environment-agnostic rasterization core for the heavy canvas tools
 * (Wave 3G-3). The exact same algorithms run either on the main thread (real
 * `<canvas>`) or inside a Web Worker (`OffscreenCanvas`) — the only difference is
 * the {@link CanvasEnv}, so there is one copy of each algorithm, not two.
 *
 * pdfjs and pdf-lib are both pure enough to run in a worker; `CanvasEnv` abstracts
 * the one DOM-specific bit (creating a canvas + encoding it to JPEG).
 */
type Pdfjs = typeof import("pdfjs-dist");

export interface CanvasEnv {
  /** Create a canvas of the given size and return its 2D context. */
  create(width: number, height: number): {
    canvas: HTMLCanvasElement | OffscreenCanvas;
    ctx: CanvasRenderingContext2D;
  };
  /** Encode the canvas as a JPEG and return its bytes. */
  toJpeg(canvas: HTMLCanvasElement | OffscreenCanvas, quality: number): Promise<Uint8Array>;
}

export interface RasterOpts {
  /** pdfjs render scale (1.0 === 72 DPI). */
  scale: number;
  /** JPEG quality 0..1. */
  quality: number;
}

export type ProgressFn = (page: number, total: number) => void;

/** Main-thread canvas env (`document.createElement`). Never called inside the worker. */
export function domCanvasEnv(): CanvasEnv {
  return {
    create(width, height) {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("canvas unavailable");
      return { canvas, ctx };
    },
    async toJpeg(canvas, quality) {
      const c = canvas as HTMLCanvasElement;
      const blob: Blob = await new Promise((resolve, reject) =>
        c.toBlob((b) => (b ? resolve(b) : reject(new Error("encode failed"))), "image/jpeg", quality),
      );
      return new Uint8Array(await blob.arrayBuffer());
    },
  };
}

// pdfjs accepts an OffscreenCanvas/its 2D context at runtime; the cast keeps the
// shared signature working for both the DOM and worker envs.
function render(
  page: PDFPageProxy,
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement | OffscreenCanvas,
  viewport: ReturnType<PDFPageProxy["getViewport"]>,
) {
  return page.render({ canvasContext: ctx, viewport, canvas } as unknown as Parameters<PDFPageProxy["render"]>[0]).promise;
}

/** Convert every page to grayscale by re-rasterizing it. Returns the new PDF bytes
 * and whether the output grew (the conversion is always the deliverable). */
export async function grayscaleCore(
  pdfjs: Pdfjs,
  env: CanvasEnv,
  buf: ArrayBuffer,
  opts: RasterOpts,
  onProgress?: ProgressFn,
): Promise<{ bytes: Uint8Array; inflated: boolean }> {
  const src = await PDFDocument.load(buf, { ignoreEncryption: true });
  const jsDoc = await pdfjs.getDocument({ data: buf.slice(0) }).promise;
  const out = await PDFDocument.create();
  const total = src.getPageCount();
  try {
    for (let i = 0; i < total; i++) {
      const page = await jsDoc.getPage(i + 1);
      const viewport = page.getViewport({ scale: opts.scale });
      const w = Math.ceil(viewport.width);
      const h = Math.ceil(viewport.height);
      const { canvas, ctx } = env.create(w, h);
      await render(page, ctx, canvas, viewport);
      const img = ctx.getImageData(0, 0, w, h);
      const d = img.data;
      for (let p = 0; p < d.length; p += 4) {
        const lum = 0.299 * d[p] + 0.587 * d[p + 1] + 0.114 * d[p + 2];
        d[p] = d[p + 1] = d[p + 2] = lum;
      }
      ctx.putImageData(img, 0, 0);
      const jpeg = await env.toJpeg(canvas, opts.quality);
      const embedded = await out.embedJpg(jpeg);
      const { width, height } = src.getPage(i).getSize();
      const np = out.addPage([width, height]);
      np.drawImage(embedded, { x: 0, y: 0, width, height });
      onProgress?.(i + 1, total);
    }
  } finally {
    jsDoc.destroy();
  }
  const bytes = await out.save();
  return { bytes, inflated: bytes.byteLength > buf.byteLength };
}

/** Rasterize each page to a JPEG and rebuild the PDF (Compress's raster path). */
export async function compressRasterCore(
  pdfjs: Pdfjs,
  env: CanvasEnv,
  buf: ArrayBuffer,
  opts: RasterOpts,
): Promise<Uint8Array> {
  const doc = await pdfjs.getDocument({ data: buf.slice(0) }).promise;
  const out = await PDFDocument.create();
  try {
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const viewport = page.getViewport({ scale: opts.scale });
      const w = Math.ceil(viewport.width);
      const h = Math.ceil(viewport.height);
      const { canvas, ctx } = env.create(w, h);
      await render(page, ctx, canvas, viewport);
      const jpeg = await env.toJpeg(canvas, opts.quality);
      const img = await out.embedJpg(jpeg);
      const p = out.addPage([viewport.width, viewport.height]);
      p.drawImage(img, { x: 0, y: 0, width: viewport.width, height: viewport.height });
    }
  } finally {
    doc.destroy();
  }
  return out.save();
}

/** Render each page to a JPEG and return the raw image bytes (one per page). */
export async function pdfToJpgsCore(
  pdfjs: Pdfjs,
  env: CanvasEnv,
  buf: ArrayBuffer,
  opts: RasterOpts,
  onProgress?: ProgressFn,
): Promise<Uint8Array[]> {
  const doc = await pdfjs.getDocument({ data: buf.slice(0) }).promise;
  const images: Uint8Array[] = [];
  try {
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const viewport = page.getViewport({ scale: opts.scale });
      const w = Math.ceil(viewport.width);
      const h = Math.ceil(viewport.height);
      const { canvas, ctx } = env.create(w, h);
      await render(page, ctx, canvas, viewport);
      images.push(await env.toJpeg(canvas, opts.quality));
      onProgress?.(i, doc.numPages);
    }
  } finally {
    doc.destroy();
  }
  return images;
}
