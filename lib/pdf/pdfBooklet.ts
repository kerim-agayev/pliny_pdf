import { PDFDocument, type PDFEmbeddedPage } from "pdf-lib";
import { baseName } from "@/lib/format";

/**
 * Saddle-stitch booklet imposition. Pages are reordered so that when the
 * output is printed double-sided and folded in half, pages read in order.
 *
 * Algorithm (N = padded page count, multiple of 4):
 *   Sheet i (0-indexed, i = 0..N/4-1):
 *     Front side: left=N-1-2i, right=2i
 *     Back side:  left=2i+1,   right=N-2-2i
 *   Each "side" is one landscape output page with two source pages side-by-side.
 */

const PAPER: Record<"a4" | "letter" | "legal", [number, number]> = {
  a4: [595, 842],
  letter: [612, 792],
  legal: [612, 1008],
};

export interface BookletOptions {
  paper: "a4" | "letter" | "legal";
}

export interface BookletResult {
  blob: Blob;
  filename: string;
  inputPages: number;
  outputPages: number; // landscape sheet-sides = sheets * 2
  sheets: number;
  blankAdded: number;
}

export async function pdfBooklet(file: File, opts: BookletOptions): Promise<BookletResult> {
  const src = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
  const inputPages = src.getPageCount();
  const padded = Math.ceil(inputPages / 4) * 4;
  const blankAdded = padded - inputPages;
  const sheets = padded / 4;

  const out = await PDFDocument.create();
  const embedded = await out.embedPages(src.getPages());

  const [pw, ph] = PAPER[opts.paper];
  const sheetW = ph; // landscape: longer side as width
  const sheetH = pw;
  const halfW = sheetW / 2;
  const MARGIN = 20; // points

  for (let i = 0; i < sheets; i++) {
    addSide(out, embedded, padded - 1 - 2 * i, 2 * i, sheetW, sheetH, halfW, MARGIN);
    addSide(out, embedded, 2 * i + 1, padded - 2 - 2 * i, sheetW, sheetH, halfW, MARGIN);
  }

  const data = await out.save();
  return {
    blob: new Blob([data as BlobPart], { type: "application/pdf" }),
    filename: `${baseName(file.name)}-booklet.pdf`,
    inputPages,
    outputPages: sheets * 2,
    sheets,
    blankAdded,
  };
}

function addSide(
  out: PDFDocument,
  embedded: PDFEmbeddedPage[],
  leftIdx: number,
  rightIdx: number,
  sheetW: number,
  sheetH: number,
  halfW: number,
  margin: number,
) {
  const page = out.addPage([sheetW, sheetH]);
  const cellW = halfW - 2 * margin;
  const cellH = sheetH - 2 * margin;

  function draw(emb: PDFEmbeddedPage, originX: number) {
    const s = Math.min(cellW / emb.width, cellH / emb.height);
    const dw = emb.width * s;
    const dh = emb.height * s;
    page.drawPage(emb, {
      x: originX + margin + (cellW - dw) / 2,
      y: margin + (cellH - dh) / 2,
      xScale: s,
      yScale: s,
    });
  }

  if (leftIdx < embedded.length) draw(embedded[leftIdx], 0);
  if (rightIdx < embedded.length) draw(embedded[rightIdx], halfW);
}
