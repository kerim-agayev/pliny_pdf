import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export type PageNumPosition =
  | "TL" | "TC" | "TR"
  | "ML" | "MC" | "MR"
  | "BL" | "BC" | "BR";
export type PageNumFormat = "plain" | "of" | "short" | "roman" | "alpha";

export interface PageNumberOptions {
  position: PageNumPosition;
  format: PageNumFormat;
  /** 1-based page that receives the first number. Earlier pages are left blank. */
  startPage: number;
  /** the number printed on `startPage`. */
  startNum: number;
  skipFirst: boolean;
  /** font size in points. */
  size: number;
  /** hex colour, e.g. "#0F0F0F". */
  color: string;
  /** distance from the page edge, in points. */
  margin: number;
}

function toRoman(n: number): string {
  if (n <= 0) return `${n}`;
  const map: [number, string][] = [
    [1000, "m"], [900, "cm"], [500, "d"], [400, "cd"], [100, "c"], [90, "xc"],
    [50, "l"], [40, "xl"], [10, "x"], [9, "ix"], [5, "v"], [4, "iv"], [1, "i"],
  ];
  let out = "";
  for (const [v, s] of map) {
    while (n >= v) {
      out += s;
      n -= v;
    }
  }
  return out;
}

function toAlpha(n: number): string {
  if (n <= 0) return `${n}`;
  let out = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    out = String.fromCharCode(65 + rem) + out;
    n = Math.floor((n - 1) / 26);
  }
  return out;
}

/** Render the visible label for a given number / total under the chosen format. */
export function formatPageNumber(format: PageNumFormat, num: number, total: number): string {
  switch (format) {
    case "of": return `Page ${num} of ${total}`;
    case "short": return `${num} of ${total}`;
    case "roman": return toRoman(num);
    case "alpha": return toAlpha(num);
    default: return `${num}`;
  }
}

function hexToRgb(hex: string) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  return rgb(r, g, b);
}

/** Stamp a page number on every (eligible) page, returning a new PDF. */
export async function addPageNumbers(file: File, opts: PageNumberOptions): Promise<Blob> {
  const doc = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const color = hexToRgb(opts.color);
  const pages = doc.getPages();
  const total = pages.length;
  const vert = opts.position[0]; // T | M | B
  const horiz = opts.position[1]; // L | C | R

  pages.forEach((page, i) => {
    const human = i + 1;
    if (opts.skipFirst && i === 0) return;
    if (human < opts.startPage) return;
    const num = opts.startNum + (human - opts.startPage);
    const label = formatPageNumber(opts.format, num, total);
    const { width, height } = page.getSize();
    const textWidth = font.widthOfTextAtSize(label, opts.size);
    const textHeight = font.heightAtSize(opts.size);

    let x: number;
    if (horiz === "L") x = opts.margin;
    else if (horiz === "R") x = width - opts.margin - textWidth;
    else x = (width - textWidth) / 2;

    let y: number;
    if (vert === "T") y = height - opts.margin - textHeight;
    else if (vert === "B") y = opts.margin;
    else y = (height - textHeight) / 2;

    page.drawText(label, { x, y, size: opts.size, font, color });
  });

  const data = await doc.save();
  return new Blob([data as BlobPart], { type: "application/pdf" });
}
