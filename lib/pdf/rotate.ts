import { PDFDocument, degrees } from "pdf-lib";
import type { ProgressFn } from "@/lib/workers/pdfOpsClient";

function norm(angle: number) {
  return (((angle % 360) + 360) % 360);
}

/**
 * Core rotation (Phase 5C): operates on raw bytes and returns bytes, so it can run
 * in the pdf-lib Web Worker or as the main-thread fallback. `rotations` maps a
 * 0-based page index to extra degrees; missing pages are left as-is.
 */
export async function rotatePagesCore(
  bytes: ArrayBuffer | Uint8Array,
  rotations: Record<number, number>,
  onProgress?: ProgressFn,
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const pages = doc.getPages();
  const total = pages.length;
  const step = Math.max(1, Math.floor(total / 100));
  pages.forEach((page, i) => {
    const delta = rotations[i] ?? 0;
    if (delta % 360 !== 0) page.setRotation(degrees(norm(page.getRotation().angle + delta)));
    if (onProgress && (i % step === 0 || i === total - 1)) onProgress(i + 1, total);
  });
  return doc.save();
}

/** Rotate every page by `delta` degrees (added to existing rotation). */
export async function rotatePdf(file: File, delta: number) {
  const doc = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
  for (const page of doc.getPages()) {
    page.setRotation(degrees(norm(page.getRotation().angle + delta)));
  }
  const data = await doc.save();
  return new Blob([data as BlobPart], { type: "application/pdf" });
}

/**
 * Apply per-page rotation deltas. `rotations` maps a 0-based page index to the
 * extra degrees to add to that page's existing rotation; missing pages are left as-is.
 */
export async function rotatePages(file: File, rotations: Record<number, number>) {
  const data = await rotatePagesCore(await file.arrayBuffer(), rotations);
  return new Blob([data as BlobPart], { type: "application/pdf" });
}
