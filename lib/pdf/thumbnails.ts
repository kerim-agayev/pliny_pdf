import { getPdfjs } from "./pdfjs";

export interface Thumb {
  url: string;
  w: number;
  h: number;
}

/** Render low-resolution thumbnails for every page of a PDF (browser-only). */
export async function renderThumbnails(file: File, scale = 0.4): Promise<Thumb[]> {
  const pdfjs = await getPdfjs();
  const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const thumbs: Thumb[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas unavailable");
    await page.render({ canvasContext: ctx, viewport, canvas }).promise;
    thumbs.push({ url: canvas.toDataURL("image/jpeg", 0.7), w: canvas.width, h: canvas.height });
  }
  return thumbs;
}
