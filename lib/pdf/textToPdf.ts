import { PDFDocument, rgb, type PDFFont } from "@cantoo/pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { loadRegularFont } from "./fonts";

export type PageSizeId = "a4" | "letter";

const SIZES: Record<PageSizeId, [number, number]> = {
  a4: [595.28, 841.89],
  letter: [612, 792],
};

export interface TextToPdfOptions {
  pageSize: PageSizeId;
  fontSize: number;
}

/** Greedy word-wrap of one logical line to a max width. */
function wrapLine(line: string, font: PDFFont, size: number, maxWidth: number): string[] {
  if (!line) return [""];
  const words = line.split(/\s+/);
  const out: string[] = [];
  let cur = "";
  for (const w of words) {
    const test = cur ? `${cur} ${w}` : w;
    if (cur && font.widthOfTextAtSize(test, size) > maxWidth) {
      out.push(cur);
      cur = w;
    } else {
      cur = test;
    }
  }
  out.push(cur);
  return out;
}

export async function textToPdf(text: string, opts: TextToPdfOptions): Promise<Blob> {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const font = await doc.embedFont(await loadRegularFont());
  const [pw, ph] = SIZES[opts.pageSize];
  const margin = 56;
  const size = opts.fontSize;
  const lineHeight = size * 1.45;
  const maxWidth = pw - margin * 2;
  const color = rgb(0.06, 0.06, 0.06);

  let page = doc.addPage([pw, ph]);
  let y = ph - margin;

  const logical = text.replace(/\r\n/g, "\n").split("\n");
  for (const raw of logical) {
    for (const ln of wrapLine(raw, font, size, maxWidth)) {
      if (y - lineHeight < margin) {
        page = doc.addPage([pw, ph]);
        y = ph - margin;
      }
      if (ln) page.drawText(ln, { x: margin, y: y - size, size, font, color });
      y -= lineHeight;
    }
  }

  const data = await doc.save();
  return new Blob([data as BlobPart], { type: "application/pdf" });
}
