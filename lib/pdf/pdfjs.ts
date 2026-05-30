// Centralized pdfjs-dist loader + worker wiring.
// The worker is bundled locally (no external CDN) to preserve the privacy claim.
// Client-only: import this from "use client" components.
import * as pdfjsLib from "pdfjs-dist";

let configured = false;

export function getPdfjs() {
  if (!configured && typeof window !== "undefined") {
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.min.mjs",
      import.meta.url,
    ).toString();
    configured = true;
  }
  return pdfjsLib;
}

/** Load a PDF document from an ArrayBuffer/Uint8Array. */
export async function loadPdfDocument(data: ArrayBuffer | Uint8Array, password?: string) {
  const pdfjs = getPdfjs();
  return pdfjs.getDocument({ data, password }).promise;
}
