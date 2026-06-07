/// <reference lib="webworker" />
import { rotatePagesCore } from "@/lib/pdf/rotate";
import { cropPdfCore } from "@/lib/pdf/crop";
import { addPageNumbersCore } from "@/lib/pdf/addPageNumbers";
import type { PdfOp, PdfOpParams } from "./pdfOpsClient";

/**
 * pdf-lib operations worker (Phase 5C). Runs Rotate / Crop / Page Numbers off the
 * main thread so the UI stays responsive on large PDFs. Receives the input bytes
 * (transferred), posts per-page progress, and transfers the result bytes back.
 */
type InMessage = { id: number; op: PdfOp; buf: ArrayBuffer; params: PdfOpParams[PdfOp] };

self.onmessage = async (e: MessageEvent<InMessage>) => {
  const { id, op, buf, params } = e.data;
  const onProgress = (page: number, total: number) =>
    (self as unknown as Worker).postMessage({ id, type: "progress", page, total });
  try {
    let out: Uint8Array;
    if (op === "rotate") {
      out = await rotatePagesCore(buf, (params as PdfOpParams["rotate"]).rotations, onProgress);
    } else if (op === "crop") {
      const p = params as PdfOpParams["crop"];
      out = await cropPdfCore(buf, p.insets, p.scope, onProgress);
    } else {
      out = await addPageNumbersCore(buf, (params as PdfOpParams["pageNumbers"]).opts, onProgress);
    }
    const ab = out.buffer.slice(out.byteOffset, out.byteOffset + out.byteLength) as ArrayBuffer;
    (self as unknown as Worker).postMessage({ id, type: "done", buf: ab }, [ab]);
  } catch (err) {
    (self as unknown as Worker).postMessage({ id, type: "error", message: String(err) });
  }
};
