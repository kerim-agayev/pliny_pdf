# Wave 2B — 6 medium-priority local tools

Status: **DONE — GATE 2B PASSED — committed + pushed 2026-06-01**. No design handoffs; all
use the existing `ToolShell` pattern. One new dep added at gate (`@pdf-lib/fontkit`, for the
Unicode-font fix on the two text tools — see Notes + bugs.md).

## Order (CLAUDE_2.md §6) + status
1. `remove-metadata` ✅ built — single button; reads + clears Info dict (`lib/pdf/metadata.ts`)
2. `edit-metadata` ✅ built — form prefilled from current metadata (shares `metadata.ts`)
3. `grayscale-pdf` ✅ built — re-rasterizes each page to grayscale (`lib/pdf/grayscale.ts`), page progress
4. `flatten-pdf` ✅ built — `getForm().flatten()` (`lib/pdf/flatten.ts`), safe no-op if no form
5. `text-to-pdf` ✅ built — textarea + A4/Letter + font size, wrap & paginate (`lib/pdf/textToPdf.ts`)
6. `markdown-to-pdf` ✅ built — split editor + live preview (markdown-to-jsx); lightweight MD→pdf-lib
   renderer for headings/lists/code (`lib/pdf/markdownToPdf.ts`); `ToolShell fullWidth`

Catalog now 21 → 27 tools. `bun run build` green (all routes × en/tr/ru, no MISSING_MESSAGE).

## Notes
- Icons added: IconTagOff, IconInfo, IconGrayscale, IconLayers, IconText, IconMarkdown.
- grayscale rasterizes (text → image), same trade-off as Compress's raster pass — noted in UI.
- markdown-to-pdf strips inline markers for the PDF text; preview uses markdown-to-jsx.
- **text-to-pdf / markdown-to-pdf embed Noto Sans** (Regular/Bold + Mono) via `@cantoo/pdf-lib`
  + `@pdf-lib/fontkit`, fonts in `public/fonts`, loader `lib/pdf/fonts.ts`. Required because
  pdf-lib StandardFonts are WinAnsi-only (no Cyrillic, partial Turkish) → crashed on real input.
  Embed the **full** font (not `subset:true` — old fontkit subsetter drops glyphs). See decisions.md + bugs.md.

## Completion notes (Gate 2B passed 2026-06-01)
Catalog 21 → 27. Two gate bugs fixed (bugs.md): Text/Markdown→PDF non-WinAnsi crash (Noto Sans
embed; subset:false), and Flatten (not a code bug — needed a fillable PDF). Build green
(27 routes × en/tr/ru). User confirmed all 6 incl. TR + RU output. 
Commit: `feat(tools): Wave 2B — metadata, grayscale, flatten, text/markdown to PDF`.
