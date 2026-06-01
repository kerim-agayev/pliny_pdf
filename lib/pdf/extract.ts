import { PDFDocument } from "pdf-lib";

/**
 * Parse a page-range string like "1-5, 8, 11-13" into unique 0-based indices,
 * in the order given, validated against `pageCount` (input is 1-based).
 * Returns [] if the input is empty or any token is invalid / out of range.
 */
export function parsePageRanges(input: string, pageCount: number): number[] {
  const out: number[] = [];
  const seen = new Set<number>();
  for (const partRaw of input.split(",")) {
    const part = partRaw.trim();
    if (!part) continue;
    const m = part.match(/^(\d+)(?:\s*-\s*(\d+))?$/);
    if (!m) return [];
    const start = parseInt(m[1], 10);
    const end = m[2] ? parseInt(m[2], 10) : start;
    if (start < 1 || end < 1 || start > pageCount || end > pageCount) return [];
    const [lo, hi] = start <= end ? [start, end] : [end, start];
    for (let n = lo; n <= hi; n++) {
      const idx = n - 1;
      if (!seen.has(idx)) {
        seen.add(idx);
        out.push(idx);
      }
    }
  }
  return out;
}

/** Copy the given 0-based indices (in order) into a new PDF. */
export async function extractPages(file: File, indices: number[]): Promise<Blob> {
  const src = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
  const out = await PDFDocument.create();
  const pages = await out.copyPages(src, indices);
  pages.forEach((p) => out.addPage(p));
  const data = await out.save();
  return new Blob([data as BlobPart], { type: "application/pdf" });
}
