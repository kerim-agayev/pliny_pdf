import { PDFDocument } from "pdf-lib";

/** Crop insets as a percentage (0–100) of the page, measured from each edge. */
export interface CropInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface PageSize {
  w: number;
  h: number;
}

export type CropScope =
  | { mode: "all" }
  | { mode: "current"; index: number }
  | { mode: "range"; indices: number[] };

/** First-pass page sizes in PDF points, used for unit conversion + aspect presets. */
export async function getPageSizes(file: File): Promise<PageSize[]> {
  const doc = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
  return doc.getPages().map((p) => {
    const { width, height } = p.getSize();
    return { w: width, h: height };
  });
}

/** Centered insets (percent) that fit `targetAspect` (w/h) inside a page of `pageW`×`pageH`. */
export function aspectInsets(pageW: number, pageH: number, targetAspect: number): CropInsets {
  const pageAspect = pageW / pageH;
  if (pageAspect > targetAspect) {
    // page is too wide → trim left/right
    const regionW = pageH * targetAspect;
    const pct = ((pageW - regionW) / pageW) * 100 / 2;
    return { top: 0, bottom: 0, left: pct, right: pct };
  }
  // page is too tall → trim top/bottom
  const regionH = pageW / targetAspect;
  const pct = ((pageH - regionH) / pageH) * 100 / 2;
  return { top: pct, bottom: pct, left: 0, right: 0 };
}

/**
 * Detect the content bounding box of a rasterized page (a data-URL image) and
 * return insets that trim the surrounding white margins. Runs on a canvas — local.
 */
export async function detectMargins(imageUrl: string): Promise<CropInsets> {
  const img = new Image();
  img.src = imageUrl;
  await img.decode();
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) return { top: 0, right: 0, bottom: 0, left: 0 };
  ctx.drawImage(img, 0, 0);
  const { width, height } = canvas;
  const { data } = ctx.getImageData(0, 0, width, height);
  let minX = width, minY = height, maxX = 0, maxY = 0;
  let found = false;
  const THRESH = 245;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      if (lum < THRESH) {
        found = true;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (!found) return { top: 0, right: 0, bottom: 0, left: 0 };
  const pad = 0.01; // 1% breathing room
  return {
    top: Math.max(0, (minY / height) - pad) * 100,
    bottom: Math.max(0, ((height - maxY) / height) - pad) * 100,
    left: Math.max(0, (minX / width) - pad) * 100,
    right: Math.max(0, ((width - maxX) / width) - pad) * 100,
  };
}

function targetIndices(scope: CropScope, total: number): Set<number> {
  if (scope.mode === "all") return new Set(Array.from({ length: total }, (_, i) => i));
  if (scope.mode === "current") return new Set([scope.index]);
  return new Set(scope.indices);
}

/** Apply the crop (as a new MediaBox + CropBox) to the targeted pages. */
export async function cropPdf(file: File, insets: CropInsets, scope: CropScope): Promise<Blob> {
  const doc = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
  const pages = doc.getPages();
  const targets = targetIndices(scope, pages.length);

  pages.forEach((page, i) => {
    if (!targets.has(i)) return;
    const box = page.getMediaBox();
    const lp = (insets.left / 100) * box.width;
    const rp = (insets.right / 100) * box.width;
    const tp = (insets.top / 100) * box.height;
    const bp = (insets.bottom / 100) * box.height;
    const newW = Math.max(1, box.width - lp - rp);
    const newH = Math.max(1, box.height - tp - bp);
    const newX = box.x + lp;
    const newY = box.y + bp;
    page.setMediaBox(newX, newY, newW, newH);
    page.setCropBox(newX, newY, newW, newH);
  });

  const data = await doc.save();
  return new Blob([data as BlobPart], { type: "application/pdf" });
}
