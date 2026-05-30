import { PDFDocument } from "pdf-lib";
import { getPdfjs } from "./pdfjs";

export type CompressPreset = "screen" | "balanced" | "maximum";

const CONFIG: Record<CompressPreset, { scale: number; quality: number }> = {
  screen: { scale: 1.0, quality: 0.5 },
  balanced: { scale: 1.35, quality: 0.72 },
  maximum: { scale: 1.7, quality: 0.88 },
};

/**
 * Compress by rasterizing each page to a JPEG at the preset's scale/quality,
 * then rebuilding the PDF. Note: text becomes part of the image (not selectable).
 */
export async function compressPdf(file: File, preset: CompressPreset) {
  const pdfjs = await getPdfjs();
  const { scale, quality } = CONFIG[preset];
  const original = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: original }).promise;
  const out = await PDFDocument.create();

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas unavailable");
    await page.render({ canvasContext: ctx, viewport, canvas }).promise;
    const jpegBlob: Blob = await new Promise((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("encode failed"))), "image/jpeg", quality),
    );
    const jpegBytes = new Uint8Array(await jpegBlob.arrayBuffer());
    const img = await out.embedJpg(jpegBytes);
    const p = out.addPage([viewport.width, viewport.height]);
    p.drawImage(img, { x: 0, y: 0, width: viewport.width, height: viewport.height });
  }

  const data = await out.save();
  return {
    blob: new Blob([data as BlobPart], { type: "application/pdf" }),
    originalSize: file.size,
    newSize: data.byteLength,
  };
}
