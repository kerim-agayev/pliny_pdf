import { PDFDocument, rgb, type PDFFont } from "@cantoo/pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { loadRegularFont, loadBoldFont, loadMonoFont } from "./fonts";

type BlockType = "h1" | "h2" | "h3" | "p" | "li" | "code";
interface Block {
  type: BlockType;
  text: string;
}

/** Strip the common inline markdown markers so they don't show literally in the PDF. */
function inline(s: string): string {
  return s
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/`(.*?)`/g, "$1")
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1");
}

/** Minimal block-level markdown parser: headings, bullets, fenced code, paragraphs. */
function parse(md: string): Block[] {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let inCode = false;
  for (const line of lines) {
    if (line.trim().startsWith("```")) {
      inCode = !inCode;
      continue;
    }
    if (inCode) {
      blocks.push({ type: "code", text: line });
      continue;
    }
    const h = line.match(/^(#{1,3})\s+(.*)/);
    if (h) {
      blocks.push({ type: (["h1", "h2", "h3"][h[1].length - 1] as BlockType), text: inline(h[2]) });
      continue;
    }
    const li = line.match(/^\s*[-*+]\s+(.*)/);
    if (li) {
      blocks.push({ type: "li", text: inline(li[1]) });
      continue;
    }
    blocks.push({ type: "p", text: line.trim() ? inline(line) : "" });
  }
  return blocks;
}

const STYLE: Record<BlockType, { size: number; bold: boolean; mono: boolean; before: number }> = {
  h1: { size: 24, bold: true, mono: false, before: 14 },
  h2: { size: 18, bold: true, mono: false, before: 12 },
  h3: { size: 14, bold: true, mono: false, before: 10 },
  p: { size: 11, bold: false, mono: false, before: 6 },
  li: { size: 11, bold: false, mono: false, before: 3 },
  code: { size: 10, bold: false, mono: true, before: 1 },
};

function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  if (!text) return [""];
  const words = text.split(/\s+/);
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

export async function markdownToPdf(md: string): Promise<Blob> {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const reg = await doc.embedFont(await loadRegularFont());
  const bold = await doc.embedFont(await loadBoldFont());
  const mono = await doc.embedFont(await loadMonoFont());
  const [pw, ph] = [595.28, 841.89]; // A4
  const margin = 56;
  const maxWidth = pw - margin * 2;
  const color = rgb(0.06, 0.06, 0.06);

  let page = doc.addPage([pw, ph]);
  let y = ph - margin;

  for (const block of parse(md)) {
    const st = STYLE[block.type];
    const font = st.mono ? mono : st.bold ? bold : reg;
    const lineHeight = st.size * 1.4;
    y -= st.before;
    const indent = block.type === "li" ? 16 : 0;
    const text = block.type === "li" ? `•  ${block.text}` : block.text;
    for (const ln of wrap(text, font, st.size, maxWidth - indent)) {
      if (y - lineHeight < margin) {
        page = doc.addPage([pw, ph]);
        y = ph - margin;
      }
      if (ln) page.drawText(ln, { x: margin + indent, y: y - st.size, size: st.size, font, color });
      y -= lineHeight;
    }
  }

  const data = await doc.save();
  return new Blob([data as BlobPart], { type: "application/pdf" });
}
