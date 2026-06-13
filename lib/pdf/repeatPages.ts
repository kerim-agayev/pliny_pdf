import { PDFDocument } from "pdf-lib";
import { baseName } from "@/lib/format";

export type Arrangement = "sequential" | "interleaved";

export interface RepeatOptions {
  srcIndices: number[]; // 0-based page indices to repeat
  count: number;
  arrangement: Arrangement;
}

export interface RepeatResult {
  blob: Blob;
  filename: string;
  inputPages: number;
  outputPages: number;
}

/** Parse "1-3, 5, 7-9" → sorted unique 0-based indices clamped to [0, maxPage-1]. */
export function parsePageRanges(rangeStr: string, maxPage: number): number[] {
  const out = new Set<number>();
  for (const part of rangeStr.split(",").map((s) => s.trim()).filter(Boolean)) {
    const dash = part.indexOf("-");
    if (dash > 0) {
      const lo = parseInt(part.slice(0, dash).trim(), 10);
      const hi = parseInt(part.slice(dash + 1).trim(), 10);
      if (!isNaN(lo) && !isNaN(hi))
        for (let p = Math.max(1, lo); p <= Math.min(maxPage, hi); p++) out.add(p - 1);
    } else {
      const n = parseInt(part, 10);
      if (!isNaN(n) && n >= 1 && n <= maxPage) out.add(n - 1);
    }
  }
  return [...out].sort((a, b) => a - b);
}

export async function repeatPages(file: File, opts: RepeatOptions): Promise<RepeatResult> {
  const src = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
  const inputPages = src.getPageCount();
  const { srcIndices, count, arrangement } = opts;

  const outputIndices: number[] =
    arrangement === "sequential"
      ? srcIndices.flatMap((i) => Array<number>(count).fill(i))   // 1,1,1,2,2,2
      : Array.from({ length: count }, () => srcIndices).flat();    // 1,2,3,1,2,3

  const out = await PDFDocument.create();
  const copied = await out.copyPages(src, outputIndices);
  copied.forEach((p) => out.addPage(p));
  const data = await out.save();

  return {
    blob: new Blob([data as BlobPart], { type: "application/pdf" }),
    filename: `${baseName(file.name)}-repeated.pdf`,
    inputPages,
    outputPages: outputIndices.length,
  };
}
