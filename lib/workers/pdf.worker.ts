// Shared PDF raster worker (Wave 3G-3). Runs the heavy canvas tools off the main
// thread using OffscreenCanvas so the UI never freezes:
//   - grayscale       → grayscale every page, return new PDF bytes
//   - compressRaster  → rasterize every page at a preset DPI, return new PDF bytes
//   - pdfToJpgs       → render every page to a JPEG, return image bytes
// pdfjs + pdf-lib run inside this worker (pdfjs parses on its own nested worker).
// The client (pdfWorkerClient) transparently falls back to the main thread if this
// worker, OffscreenCanvas, or any task fails — so correctness never depends on it.
import { getPdfjs } from "../pdf/pdfjs";
import {
  grayscaleCore,
  compressRasterCore,
  pdfToJpgsCore,
  type CanvasEnv,
  type RasterOpts,
} from "../pdf/raster-core";

// `self` is a DedicatedWorkerGlobalScope; the Worker type exposes the
// onmessage/postMessage surface we need without pulling in the webworker lib.
const ctx = self as unknown as Worker;

function offscreenEnv(): CanvasEnv {
  return {
    create(width, height) {
      const canvas = new OffscreenCanvas(width, height);
      const o = canvas.getContext("2d");
      if (!o) throw new Error("offscreen 2d context unavailable");
      return { canvas, ctx: o as unknown as CanvasRenderingContext2D };
    },
    async toJpeg(canvas, quality) {
      const c = canvas as OffscreenCanvas;
      const blob = await c.convertToBlob({ type: "image/jpeg", quality });
      return new Uint8Array(await blob.arrayBuffer());
    },
  };
}

/** Exact-size ArrayBuffer slice for transfer back to the main thread. */
function toBuffer(u: Uint8Array): ArrayBuffer {
  return u.buffer.slice(u.byteOffset, u.byteOffset + u.byteLength) as ArrayBuffer;
}

interface TaskMessage {
  id: number;
  op: "grayscale" | "compressRaster" | "pdfToJpgs";
  payload: { buf: ArrayBuffer; opts: RasterOpts };
}

ctx.onmessage = async (e: MessageEvent<TaskMessage>) => {
  const { id, op, payload } = e.data;
  const post = (msg: Record<string, unknown>, transfer: Transferable[] = []) =>
    ctx.postMessage({ id, ...msg }, transfer);

  try {
    const pdfjs = await getPdfjs();
    const env = offscreenEnv();
    const onProgress = (page: number, total: number) => post({ type: "progress", page, total });

    if (op === "grayscale") {
      const { bytes, inflated } = await grayscaleCore(pdfjs, env, payload.buf, payload.opts, onProgress);
      const buf = toBuffer(bytes);
      post({ type: "done", result: { buf, inflated } }, [buf]);
    } else if (op === "compressRaster") {
      const bytes = await compressRasterCore(pdfjs, env, payload.buf, payload.opts);
      const buf = toBuffer(bytes);
      post({ type: "done", result: { buf } }, [buf]);
    } else if (op === "pdfToJpgs") {
      const imgs = await pdfToJpgsCore(pdfjs, env, payload.buf, payload.opts, onProgress);
      const buffers = imgs.map(toBuffer);
      post({ type: "done", result: { images: buffers } }, buffers);
    } else {
      post({ type: "error", message: `unknown op: ${op}` });
    }
  } catch (err) {
    post({ type: "error", message: err instanceof Error ? err.message : String(err) });
  }
};
