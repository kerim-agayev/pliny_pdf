import { PDFDocument, degrees } from "pdf-lib";

function norm(angle: number) {
  return (((angle % 360) + 360) % 360);
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
  const doc = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
  const pages = doc.getPages();
  pages.forEach((page, i) => {
    const delta = rotations[i] ?? 0;
    if (delta % 360 !== 0) page.setRotation(degrees(norm(page.getRotation().angle + delta)));
  });
  const data = await doc.save();
  return new Blob([data as BlobPart], { type: "application/pdf" });
}
