import { PDFDocument } from "pdf-lib";
import { getPdfjs } from "./pdfjs";

/** A redaction rectangle as a percentage of the page (top-left origin). */
export interface RedactBox {
  xPct: number;
  yPct: number;
  wPct: number;
  hPct: number;
  color: string;
}

/** A located piece of page text, in page-percent coordinates (for search / auto-detect). */
export interface TextHit {
  str: string;
  xPct: number;
  yPct: number;
  wPct: number;
  hPct: number;
}

const RASTER_SCALE = 2;

/**
 * Apply redactions permanently. Pages that have boxes are re-rasterized to an image
 * with the boxes painted on — the underlying text/vector content is gone, not hidden.
 * Pages without boxes are copied through untouched (text stays selectable).
 */
export async function redactPdf(file: File, boxesByPage: Record<number, RedactBox[]>): Promise<Blob> {
  const buf = await file.arrayBuffer();
  const src = await PDFDocument.load(buf, { ignoreEncryption: true });
  const pdfjs = await getPdfjs();
  const jsDoc = await pdfjs.getDocument({ data: buf.slice(0) }).promise;
  const out = await PDFDocument.create();
  const total = src.getPageCount();

  for (let i = 0; i < total; i++) {
    const boxes = boxesByPage[i];
    if (!boxes || boxes.length === 0) {
      const [copied] = await out.copyPages(src, [i]);
      out.addPage(copied);
      continue;
    }
    const page = await jsDoc.getPage(i + 1);
    const viewport = page.getViewport({ scale: RASTER_SCALE });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) continue;
    await page.render({ canvasContext: ctx, viewport, canvas }).promise;
    for (const b of boxes) {
      ctx.fillStyle = b.color;
      ctx.fillRect(
        (b.xPct / 100) * canvas.width,
        (b.yPct / 100) * canvas.height,
        (b.wPct / 100) * canvas.width,
        (b.hPct / 100) * canvas.height,
      );
    }
    const png = await out.embedPng(canvas.toDataURL("image/png"));
    const { width, height } = src.getPage(i).getSize();
    const newPage = out.addPage([width, height]);
    newPage.drawImage(png, { x: 0, y: 0, width, height });
  }

  const data = await out.save();
  return new Blob([data as BlobPart], { type: "application/pdf" });
}

/** Locate every text run on a page, in page-percent coords (for search & auto-detect). */
export async function pageTextHits(file: File, pageIndex: number): Promise<TextHit[]> {
  const pdfjs = await getPdfjs();
  const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const page = await doc.getPage(pageIndex + 1);
  const vp = page.getViewport({ scale: 1 });
  const tc = await page.getTextContent();
  const hits: TextHit[] = [];
  for (const raw of tc.items) {
    const it = raw as { str?: string; transform?: number[]; width?: number; height?: number };
    if (!it.str || !it.str.trim() || !it.transform) continue;
    const [, b, , d, e, f] = it.transform;
    const fontH = Math.hypot(b, d) || it.height || 10;
    const w = it.width || 0;
    hits.push({
      str: it.str,
      xPct: (e / vp.width) * 100,
      yPct: ((vp.height - f - fontH) / vp.height) * 100,
      wPct: (w / vp.width) * 100,
      hPct: ((fontH * 1.3) / vp.height) * 100,
    });
  }
  return hits;
}

export const REDACT_PATTERNS: Record<string, RegExp> = {
  email: /[^\s@]+@[^\s@]+\.[^\s@]+/,
  phone: /\+?\d[\d\s().-]{7,}\d/,
  card: /\b(?:\d[ -]?){13,16}\b/,
  ssn: /\b\d{3}-\d{2}-\d{4}\b/,
};
