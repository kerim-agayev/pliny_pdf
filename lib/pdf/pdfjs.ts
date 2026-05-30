// Centralized pdfjs-dist loader + worker wiring.
// pdfjs is imported dynamically (browser-only) so its top-level DOMMatrix usage
// never evaluates during server prerender. The worker is bundled locally (no CDN)
// to preserve the privacy claim.
type Pdfjs = typeof import("pdfjs-dist");

let pdfjsPromise: Promise<Pdfjs> | null = null;

export async function getPdfjs(): Promise<Pdfjs> {
  if (!pdfjsPromise) {
    pdfjsPromise = import("pdfjs-dist").then((pdfjs) => {
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.min.mjs",
        import.meta.url,
      ).toString();
      return pdfjs;
    });
  }
  return pdfjsPromise;
}

/** Load a PDF document from an ArrayBuffer/Uint8Array. */
export async function loadPdfDocument(data: ArrayBuffer | Uint8Array, password?: string) {
  const pdfjs = await getPdfjs();
  return pdfjs.getDocument({ data, password }).promise;
}
