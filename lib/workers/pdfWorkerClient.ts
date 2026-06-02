import type { RasterOpts, ProgressFn } from "@/lib/pdf/raster-core";

/**
 * Client for the shared PDF raster worker (Wave 3G-3). Lazily spins up ONE module
 * worker and correlates request/response by id. Every public helper rejects with a
 * plain Error on any failure (unsupported browser, init failure, worker error, or a
 * task error) so callers can `catch` and fall back to the main-thread path. The
 * heavy lib functions (grayscale/compress/pdfToJpg) try the worker first and fall
 * back transparently — correctness never depends on the worker.
 */
interface Pending {
  resolve: (value: unknown) => void;
  reject: (err: unknown) => void;
  onProgress?: ProgressFn;
}

let worker: Worker | null = null;
let nextId = 1;
const pending = new Map<number, Pending>();

/** Worker + OffscreenCanvas-to-JPEG support (Chromium today; Safari/FF 16.4+). */
export function workerSupported(): boolean {
  return (
    typeof Worker !== "undefined" &&
    typeof OffscreenCanvas !== "undefined" &&
    typeof OffscreenCanvas.prototype.convertToBlob === "function"
  );
}

function rejectAll(err: unknown) {
  for (const job of pending.values()) job.reject(err);
  pending.clear();
}

function ensureWorker(): Worker {
  if (worker) return worker;
  const w = new Worker(new URL("./pdf.worker.ts", import.meta.url), { type: "module" });
  w.onmessage = (e: MessageEvent<{ id: number; type: string; page?: number; total?: number; result?: unknown; message?: string }>) => {
    const { id, type } = e.data;
    const job = pending.get(id);
    if (!job) return;
    if (type === "progress") {
      job.onProgress?.(e.data.page ?? 0, e.data.total ?? 0);
    } else if (type === "done") {
      pending.delete(id);
      job.resolve(e.data.result);
    } else if (type === "error") {
      pending.delete(id);
      job.reject(new Error(e.data.message ?? "worker task failed"));
    }
  };
  w.onerror = () => {
    // Worker-level failure (e.g. failed to load). Reject in-flight jobs and drop
    // the worker so callers fall back; a later call may re-create it.
    rejectAll(new Error("pdf worker error"));
    worker = null;
  };
  worker = w;
  return w;
}

function run<T>(op: string, buf: ArrayBuffer, opts: RasterOpts, onProgress?: ProgressFn): Promise<T> {
  if (!workerSupported()) return Promise.reject(new Error("worker unsupported"));
  let w: Worker;
  try {
    w = ensureWorker();
  } catch {
    return Promise.reject(new Error("worker init failed"));
  }
  const id = nextId++;
  return new Promise<T>((resolve, reject) => {
    pending.set(id, { resolve: resolve as (v: unknown) => void, reject, onProgress });
    // Transfer the input buffer (the caller passes a copy it doesn't keep).
    w.postMessage({ id, op, payload: { buf, opts } }, [buf]);
  });
}

export function grayscaleInWorker(buf: ArrayBuffer, opts: RasterOpts, onProgress?: ProgressFn) {
  return run<{ buf: ArrayBuffer; inflated: boolean }>("grayscale", buf, opts, onProgress);
}

export function compressRasterInWorker(buf: ArrayBuffer, opts: RasterOpts) {
  return run<{ buf: ArrayBuffer }>("compressRaster", buf, opts);
}

export function pdfToJpgsInWorker(buf: ArrayBuffer, opts: RasterOpts, onProgress?: ProgressFn) {
  return run<{ images: ArrayBuffer[] }>("pdfToJpgs", buf, opts, onProgress);
}
