# Wave 2A — 8 high-priority local tools

Status: **DONE** — GATE 2A PASSED, committed + pushed (2026-06-01). Catalog 13 → 21.

## Execution order (CLAUDE_2.md §6 — simplest → most complex)
| # | Tool slug | Design | Status | Library |
|---|-----------|--------|--------|---------|
| 1 | `delete-pages`    | no  | ✅ DONE | pdf-lib + pdfjs-dist (thumbnails) |
| 2 | `extract-pages`   | no  | ✅ DONE | pdf-lib + pdfjs-dist (thumbnails) |
| 3 | `add-page-numbers`| YES | ✅ DONE | pdf-lib + pdfjs (live preview) |
| 4 | `header-footer`   | YES | ✅ DONE | pdf-lib + pdfjs (token preview) |
| 5 | `crop-pdf`        | YES | ✅ DONE | pdf-lib (MediaBox/CropBox) + pdfjs (canvas, auto-margin) |
| 6 | `organize-pages`  | YES | ✅ DONE | pdf-lib + dnd-kit + pdfjs (centerpiece) |
| 7 | `sign-pdf`        | YES | ✅ DONE | pdf-lib + fabric.js (draw pad) |
| 8 | `redact-content`  | YES | ✅ DONE | pdf-lib + pdfjs (permanent rasterize) + DOM overlay |

## Design handoff status
**Fetched** — all 6 screens pulled from the Claude Design bundle into
`.design-handoff/<slug>/` (1 screen each), shared assets in `.design-handoff/_shared/`.

## Notes
- All 6 design tools use `<ToolShell ... fullWidth>` (settings + live-preview/canvas
  two-column), matching the handoff (no how-it-works sidebar on these screens).
- No new dependencies: dnd-kit + fabric were already in package.json.
- redact = DOM-overlay boxes (page-%) + permanent re-rasterize of affected pages.
  See `../decisions.md`.
- `bun run build` green after every tool; final build green with all 8 routes × en/tr/ru.

## Completion notes (2026-06-01)
- All 8 tools confirmed by the user: real PDF in → correct PDF out, no upload in
  DevTools Network, mobile 375px, dark mode, /en /tr /ru render.
- Commit: `feat(tools): Wave 2A — delete/extract pages, add-page-numbers, header-footer,
  crop-pdf, organize-pages, sign-pdf, redact-content` → pushed to origin/main.
- **Bugs found at gate & fixed** (see `../bugs.md`):
  1. Header & Footer — placeholder i18n `FORMATTING_ERROR`: the literal `{filename}`/
     `{page}`/`{total}` example tokens were read by next-intl as variables. Fixed by
     ICU single-quote escaping in all 3 locales.
  2. Sign PDF — Type-tab `removeChild` crash: fabric-wrapped canvas was conditionally
     rendered, so React removed a node fabric had re-parented. Fixed by keeping the
     canvas permanently mounted (visibility toggle), init fabric once on ready, guarded
     `dispose()`.
- Verification helpers added/used: `lib/pdf/thumbnails.renderThumbnails(scale)` reused for
  previews; permanent redaction proven by Ctrl+F over redacted area returning nothing.
