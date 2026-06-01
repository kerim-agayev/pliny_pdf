import { PDFDocument } from "pdf-lib";

export type SignScope = { mode: "current"; index: number } | { mode: "all" };

/** Placement of the signature, as percentages of the page (top-left origin). */
export interface SignPlacement {
  xPct: number;
  yPct: number;
  wPct: number;
}

/** Embed a PNG signature (data URL) at the placement on the target page(s). */
export async function signPdf(
  file: File,
  pngDataUrl: string,
  placement: SignPlacement,
  scope: SignScope,
): Promise<Blob> {
  const bytes = await (await fetch(pngDataUrl)).arrayBuffer();
  const doc = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
  const png = await doc.embedPng(bytes);
  const aspect = png.height / png.width;
  const pages = doc.getPages();
  const targets = scope.mode === "all" ? pages.map((_, i) => i) : [scope.index];

  for (const i of targets) {
    const page = pages[i];
    if (!page) continue;
    const { width, height } = page.getSize();
    const w = (placement.wPct / 100) * width;
    const h = w * aspect;
    const x = (placement.xPct / 100) * width;
    const yTop = (placement.yPct / 100) * height;
    page.drawImage(png, { x, y: height - yTop - h, width: w, height: h });
  }

  const data = await doc.save();
  return new Blob([data as BlobPart], { type: "application/pdf" });
}

/** Render typed text in a chosen font to a transparent PNG data URL + its aspect (h/w). */
export function typedSignatureToPng(
  text: string,
  fontFamily: string,
  color: string,
): { url: string; aspect: number } {
  const fontPx = 96;
  const measure = document.createElement("canvas");
  const mctx = measure.getContext("2d")!;
  mctx.font = `${fontPx}px ${fontFamily}`;
  const metrics = mctx.measureText(text || " ");
  const w = Math.ceil(metrics.width) + 40;
  const h = Math.ceil(fontPx * 1.6);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.font = `${fontPx}px ${fontFamily}`;
  ctx.fillStyle = color;
  ctx.textBaseline = "middle";
  ctx.fillText(text, 20, h / 2);
  return { url: canvas.toDataURL("image/png"), aspect: h / w };
}
