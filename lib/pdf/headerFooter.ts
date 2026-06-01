import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export type BandAlign = "left" | "center" | "right";

export interface Band {
  /** raw text, may contain {page} {total} {date} {filename} tokens. */
  text: string;
  align: BandAlign;
  size: number;
  color: string;
}

export interface HeaderFooterOptions {
  header: Band;
  footer: Band;
  skipFirst: boolean;
}

const HMARGIN = 40; // points from left/right edge
const VMARGIN = 30; // points from top/bottom edge to the text baseline

/** "Jun 1, 2026" — stable, locale-independent token value. */
export function formatTokenDate(d: Date): string {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export interface TokenContext {
  page: number;
  total: number;
  date: string;
  filename: string;
}

export function resolveTokens(text: string, ctx: TokenContext): string {
  return text
    .replaceAll("{page}", String(ctx.page))
    .replaceAll("{total}", String(ctx.total))
    .replaceAll("{date}", ctx.date)
    .replaceAll("{filename}", ctx.filename);
}

function hexToRgb(hex: string) {
  const h = hex.replace("#", "");
  return rgb(
    parseInt(h.slice(0, 2), 16) / 255,
    parseInt(h.slice(2, 4), 16) / 255,
    parseInt(h.slice(4, 6), 16) / 255,
  );
}

/** Stamp header and/or footer running text on every (eligible) page. */
export async function applyHeaderFooter(file: File, opts: HeaderFooterOptions): Promise<Blob> {
  const doc = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const pages = doc.getPages();
  const total = pages.length;
  const date = formatTokenDate(new Date());
  const filename = file.name;

  pages.forEach((page, i) => {
    if (opts.skipFirst && i === 0) return;
    const { width, height } = page.getSize();
    const ctx: TokenContext = { page: i + 1, total, date, filename };

    for (const band of [opts.header, opts.footer] as const) {
      const text = resolveTokens(band.text, ctx).trim();
      if (!text) continue;
      const isHeader = band === opts.header;
      const color = hexToRgb(band.color);
      const textWidth = font.widthOfTextAtSize(text, band.size);
      let x: number;
      if (band.align === "left") x = HMARGIN;
      else if (band.align === "right") x = width - HMARGIN - textWidth;
      else x = (width - textWidth) / 2;
      const y = isHeader ? height - VMARGIN : VMARGIN;
      page.drawText(text, { x, y, size: band.size, font, color });
    }
  });

  const data = await doc.save();
  return new Blob([data as BlobPart], { type: "application/pdf" });
}
