/**
 * Canvas-based text measurement for the Edit PDF tool (Wave 8C — smart auto-resize).
 *
 * A text block's box is *derived from its content*: as the user types or restyles a
 * block, the overlay box grows/shrinks to fit. This is a client-only visual concern —
 * the server renders text point-based (insert_text) and re-extracts fresh bboxes on
 * reopen, so measured sizes never need to be persisted.
 *
 * `cssFont` lives here (the single source of truth) so both the overlay renderer
 * (TextBlock) and the measurer use the exact same family mapping. TextBlock re-exports
 * it for existing consumers.
 */

/** Map a PyMuPDF font name to a CSS family for the overlay approximation. */
export function cssFont(name: string): string {
  const n = (name || "").toLowerCase();
  if (n === "noto serif") return "'Noto Serif', Georgia, 'Times New Roman', serif";
  if (n === "noto sans mono") return "'Noto Sans Mono', var(--font-mono), monospace";
  if (n === "noto sans") return "'Noto Sans', 'Helvetica Neue', Arial, sans-serif";
  if (n.includes("times") || n.includes("serif") || n.includes("georgia")) return "Georgia, 'Times New Roman', serif";
  if (n.includes("cour") || n.includes("mono")) return "var(--font-mono), monospace";
  return "'Helvetica Neue', Arial, sans-serif";
}

export type TextMetrics = { width: number; height: number };

// Match the overlay's lineHeight and the snap engine's TEXT_LINE_RATIO so the measured
// box, the rendered text, and snap targets all agree.
const LINE_HEIGHT = 1.2;
const PAD_X = 12; // horizontal padding (PDF points) — longest line + this
const PAD_Y = 8;  // vertical padding (PDF points) — total line height + this
const MIN_WIDTH = 50;
const PAGE_MARGIN = 36; // left/right margin reserved when clamping max width

// Module-level cached canvas (same pattern as the legacy measureTextWidth helper).
let measureCanvas: HTMLCanvasElement | null = null;

/**
 * Measure a block's content size in PDF points. Width = longest line + padding
 * (clamped to [MIN_WIDTH, pageWidth - 2*margin]); height = line count * lineHeight
 * + padding. Multi-line text is split on "\n".
 */
export function measureTextContent(
  text: string,
  fontFamily: string,
  fontSize: number,
  bold: boolean,
  italic: boolean,
  pageWidth: number,
): TextMetrics {
  const lines = (text.length ? text : " ").split("\n");
  const lineCount = lines.length;

  if (!measureCanvas) measureCanvas = document.createElement("canvas");
  const ctx = measureCanvas.getContext("2d");

  let maxLine = 0;
  if (ctx) {
    ctx.font = `${italic ? "italic " : ""}${bold ? "700 " : ""}${fontSize}px ${cssFont(fontFamily)}`;
    for (const line of lines) maxLine = Math.max(maxLine, ctx.measureText(line || " ").width);
  } else {
    // Fallback approximation when 2D context is unavailable.
    for (const line of lines) maxLine = Math.max(maxLine, (line.length || 1) * fontSize * 0.5);
  }

  const maxWidth = Math.max(MIN_WIDTH, pageWidth - PAGE_MARGIN * 2);
  const width = Math.min(maxWidth, Math.max(MIN_WIDTH, maxLine + PAD_X));
  const height = lineCount * fontSize * LINE_HEIGHT + PAD_Y;
  return { width, height };
}
