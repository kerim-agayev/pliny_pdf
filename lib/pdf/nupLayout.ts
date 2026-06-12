import { PDFDocument } from "pdf-lib";
import { baseName } from "@/lib/format";

/**
 * N-up Layout (imposition) — place several source pages onto one larger sheet,
 * entirely in the browser via pdf-lib. Saves paper when printing. The source
 * document is never mutated; a brand-new PDF is returned.
 */

export type NupLayoutId = "2h" | "2v" | "4" | "6" | "9";

/** Grid (cols × rows) for each layout. Shared with the live preview. */
export const NUP_GRID: Record<NupLayoutId, { cols: number; rows: number }> = {
  "2h": { cols: 2, rows: 1 }, // 2-up, side by side
  "2v": { cols: 1, rows: 2 }, // 2-up, top / bottom
  "4": { cols: 2, rows: 2 },
  "6": { cols: 2, rows: 3 },
  "9": { cols: 3, rows: 3 },
};

/** Pages placed on one sheet for a layout. */
export function nupPerSheet(layout: NupLayoutId): number {
  const g = NUP_GRID[layout];
  return g.cols * g.rows;
}

/** Paper sizes in PDF points (1 pt = 1/72"), portrait orientation. */
const PAPER: Record<"a4" | "letter" | "legal", [number, number]> = {
  a4: [595, 842],
  letter: [612, 792],
  legal: [612, 1008],
};

const MM_TO_PT = 72 / 25.4;

export interface NupOptions {
  layout: NupLayoutId;
  paper: "a4" | "letter" | "legal";
  orientation: "portrait" | "landscape";
  /** Outer margin and inter-cell gutter, in millimetres (0–20). */
  marginMm: number;
}

export interface NupResult {
  blob: Blob;
  filename: string;
  inputPages: number;
  outputPages: number;
}

export async function nupLayout(file: File, opts: NupOptions): Promise<NupResult> {
  const src = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
  const inputPages = src.getPageCount();

  const out = await PDFDocument.create();
  const embedded = await out.embedPages(src.getPages());

  const { cols, rows } = NUP_GRID[opts.layout];
  const per = cols * rows;

  const [pw, ph] = PAPER[opts.paper];
  const sheetW = opts.orientation === "landscape" ? ph : pw;
  const sheetH = opts.orientation === "landscape" ? pw : ph;

  const margin = opts.marginMm * MM_TO_PT;
  const innerW = sheetW - 2 * margin;
  const innerH = sheetH - 2 * margin;
  const cellW = (innerW - (cols - 1) * margin) / cols;
  const cellH = (innerH - (rows - 1) * margin) / rows;

  let page = out.addPage([sheetW, sheetH]);

  embedded.forEach((emb, i) => {
    const slot = i % per;
    if (slot === 0 && i !== 0) page = out.addPage([sheetW, sheetH]);

    const col = slot % cols;
    const row = Math.floor(slot / cols);

    const cellX = margin + col * (cellW + margin);
    const cellTop = sheetH - margin - row * (cellH + margin); // y of cell's top edge

    const ew = emb.width;
    const eh = emb.height;
    const s = Math.min(cellW / ew, cellH / eh); // contain — preserve aspect ratio
    const drawW = ew * s;
    const drawH = eh * s;

    const x = cellX + (cellW - drawW) / 2;
    const y = cellTop - cellH + (cellH - drawH) / 2; // bottom-left origin

    page.drawPage(emb, { x, y, xScale: s, yScale: s });
  });

  const data = await out.save();
  return {
    blob: new Blob([data as BlobPart], { type: "application/pdf" }),
    filename: `${baseName(file.name)}-${per}up.pdf`,
    inputPages,
    outputPages: Math.ceil(inputPages / per),
  };
}
