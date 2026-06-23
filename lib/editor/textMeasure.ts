/**
 * Font-family mapping for the Edit PDF overlay (single source of truth so the overlay
 * renderer and any text measurement use the exact same families).
 *
 * NB (Wave 8C): auto-resize is measured directly from the rendered DOM element
 * (getBoundingClientRect on a no-wrap contentEditable), NOT via canvas measureText —
 * canvas systematically under-estimates real layout width, which caused edit-mode text
 * to wrap onto a second line. The DOM is the exact source of truth.
 */

/**
 * Wave 11B: map a raw PyMuPDF font name (e.g. "ABCDEE+Arial", "Arial-BoldMT",
 * "TimesNewRomanPSMT") to one of the 6 picker families so the editor's font
 * dropdown pre-fills a real match instead of a blank. Mirrors the backend
 * `_family` routing, plus Noto detection. Unmatched → "Helvetica" (the backend
 * still auto-promotes non-Latin-1 text to Noto, so this never causes tofu).
 */
export function matchFont(name: string): string {
  const n = (name || "").toLowerCase();
  if (n.includes("noto")) {
    if (n.includes("serif")) return "Noto Serif";
    if (n.includes("mono")) return "Noto Sans Mono";
    return "Noto Sans";
  }
  if (n.includes("times") || n.includes("serif") || n.includes("roman") || n.includes("georgia")) return "Times";
  if (n.includes("cour") || n.includes("mono") || n.includes("consol")) return "Courier";
  return "Helvetica";
}

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
