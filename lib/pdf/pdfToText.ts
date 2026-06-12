import { loadPdfDocument } from "./pdfjs";

export interface PdfToTextOptions {
  /** 0-based page indices in order; omit/empty = every page. */
  indices?: number[];
  /** Keep the document's original line breaks instead of reflowing into paragraphs. */
  preserveLayout?: boolean;
  /** UTF-8 keeps accents & symbols; ASCII strips non-Latin characters. */
  encoding?: "utf8" | "ascii";
}

export interface PdfToTextResult {
  text: string;
  pages: number;
  chars: number;
  words: number;
}

/**
 * Extract the text layer of a PDF, entirely in the browser via pdf.js.
 * Mirrors the server-side algorithm in services/pdftext.ts, adding the
 * layout/encoding/range options from the Wave 7B design.
 */
export async function pdfToText(
  file: File,
  opts: PdfToTextOptions = {},
): Promise<PdfToTextResult> {
  const preserve = opts.preserveLayout ?? true;
  const doc = await loadPdfDocument(await file.arrayBuffer());
  const total = doc.numPages;
  const order =
    opts.indices && opts.indices.length
      ? opts.indices.filter((i) => i >= 0 && i < total)
      : Array.from({ length: total }, (_, i) => i);

  const blocks: string[] = [];
  for (const idx of order) {
    const page = await doc.getPage(idx + 1);
    const content = await page.getTextContent();
    let pageText = "";
    for (const item of content.items) {
      if (!("str" in item)) continue; // skip TextMarkedContent markers
      pageText += item.str;
      if (item.hasEOL) pageText += preserve ? "\n" : " ";
    }
    pageText = preserve
      ? pageText.replace(/[ \t]+$/gm, "").trimEnd()
      : pageText.replace(/[ \t]+/g, " ").trim();
    blocks.push(pageText);
  }
  await doc.destroy();

  let text = blocks.join("\n\n").trimEnd();
  if (opts.encoding === "ascii") {
    // Strip any character outside the 7-bit ASCII range (keeps newlines/tabs).
    text = Array.from(text)
      .filter((c) => c.charCodeAt(0) <= 0x7f)
      .join("");
  }

  const trimmed = text.trim();
  const words = trimmed ? trimmed.split(/\s+/).length : 0;
  return { text, pages: order.length, chars: text.length, words };
}
