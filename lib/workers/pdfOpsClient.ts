import type { CropInsets, CropScope } from "@/lib/pdf/crop";
import type { PageNumberOptions } from "@/lib/pdf/addPageNumbers";

/** Per-page progress callback used by the pdf-lib op cores + this client. */
export type ProgressFn = (page: number, total: number) => void;

/** Parameters for each worker op (discriminated by op name). */
export interface PdfOpParams {
  rotate: { rotations: Record<number, number> };
  crop: { insets: CropInsets; scope: CropScope };
  pageNumbers: { opts: PageNumberOptions };
}
export type PdfOp = keyof PdfOpParams;

type WorkerMessage =
  | { id: number; type: "progress"; page: number; total: number }
  | { id: number; type: "done"; buf: ArrayBuffer }
  | { id: number; type: "error"; message: string };

interface Pending {
  resolve: (buf: ArrayBuffer) => void;
  reject: (err: unknown) => void;
  onProgress?: ProgressFn;
}

let worker: Worker | null = null;
let nextId = 1;
const pending = new Map<number, Pending>();

function workerSupported(): boolean {
  return typeof Worker !== "undefined";
}

function rejectAll(err: unknown) {
  for (const job of pending.values()) job.reject(err);
  pending.clear();
}

function ensureWorker(): Worker {
  if (worker) return worker;
  const w = new Worker(new URL("./pdfops.worker.ts", import.meta.url), { type: "module" });
  w.onmessage = (e: MessageEvent<WorkerMessage>) => {
    const msg = e.data;
    const job = pending.get(msg.id);
    if (!job) return;
    if (msg.type === "progress") {
      job.onProgress?.(msg.page, msg.total);
    } else if (msg.type === "done") {
      pending.delete(msg.id);
      job.resolve(msg.buf);
    } else {
      pending.delete(msg.id);
      job.reject(new Error(msg.message || "worker task failed"));
    }
  };
  w.onerror = () => {
    // Worker-level failure (e.g. failed to load). Reject in-flight jobs and drop
    // the worker so callers fall back to the main thread; a later call recreates it.
    rejectAll(new Error("pdf worker error"));
    worker = null;
  };
  worker = w;
  return w;
}

function runInWorker<O extends PdfOp>(
  op: O,
  buf: ArrayBuffer,
  params: PdfOpParams[O],
  onProgress?: ProgressFn,
): Promise<ArrayBuffer> {
  const w = ensureWorker();
  const id = nextId++;
  return new Promise<ArrayBuffer>((resolve, reject) => {
    pending.set(id, { resolve, reject, onProgress });
    w.postMessage({ id, op, buf, params }, [buf]); // transfer the input buffer
  });
}

/** Run a pdf-lib op (rotate/crop/pageNumbers) in cores so both the worker and the
 *  main-thread fallback share one implementation. */
async function runCore<O extends PdfOp>(
  op: O,
  buf: ArrayBuffer,
  params: PdfOpParams[O],
  onProgress?: ProgressFn,
): Promise<Uint8Array> {
  if (op === "rotate") {
    const { rotatePagesCore } = await import("@/lib/pdf/rotate");
    return rotatePagesCore(buf, (params as PdfOpParams["rotate"]).rotations, onProgress);
  }
  if (op === "crop") {
    const { cropPdfCore } = await import("@/lib/pdf/crop");
    const p = params as PdfOpParams["crop"];
    return cropPdfCore(buf, p.insets, p.scope, onProgress);
  }
  const { addPageNumbersCore } = await import("@/lib/pdf/addPageNumbers");
  return addPageNumbersCore(buf, (params as PdfOpParams["pageNumbers"]).opts, onProgress);
}

/**
 * Run a pdf-lib operation off the main thread (Phase 5C). Tries the Web Worker
 * first so the UI stays responsive; transparently falls back to the main-thread
 * core if workers are unsupported or the worker fails — correctness never depends
 * on the worker. `onProgress(page, total)` drives the progress bar.
 */
export async function runPdfOp<O extends PdfOp>(
  op: O,
  file: File,
  params: PdfOpParams[O],
  onProgress?: ProgressFn,
): Promise<Blob> {
  if (workerSupported()) {
    try {
      const out = await runInWorker(op, await file.arrayBuffer(), params, onProgress);
      return new Blob([out], { type: "application/pdf" });
    } catch {
      /* fall through to main-thread core (re-reads the file below) */
    }
  }
  const out = await runCore(op, await file.arrayBuffer(), params, onProgress);
  return new Blob([out as BlobPart], { type: "application/pdf" });
}
