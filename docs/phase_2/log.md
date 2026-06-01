# PlinyPDF Phase 2 — Log

> Append-only. One entry per wave gate-pass (and notable milestones). Dated, factual, short.

## [2026-06-01] Phase 2 session start
Read CLAUDE_2.md + Phase 1 docs. Created `docs/phase_2/` tree. Began Wave 2A:
building the 2 no-design tools (`delete-pages`, `extract-pages`) while awaiting
the 6 design handoff links.

## [2026-06-01] Wave 2A complete — GATE 2A PASSED (8 tools)
All 8 high-priority local tools shipped, catalog 13 → 21. Tools: `delete-pages`,
`extract-pages` (no design); `add-page-numbers`, `header-footer`, `crop-pdf`,
`organize-pages`, `sign-pdf`, `redact-content` (built from the Claude Design handoff,
fetched to `.design-handoff/<slug>/`). Each tool wired across the 7 touch-points
(icon → `lib/tools.ts` → `lib/seo.ts` TOOL_SEO → `lib/structured-data.ts` TOOL_FAQ →
`messages/{en,tr,ru}.json` Tools+ToolPages → `app/[locale]/<slug>/page.tsx` →
`components/tools/<Tool>.tsx` + `lib/pdf/<op>.ts`). Design tools use `ToolShell fullWidth`
(settings + live-preview/canvas). No new deps (dnd-kit + fabric already present).
Notables: organize-pages drag-grid via dnd-kit; sign-pdf draw pad via fabric; redact
permanently re-rasterizes pages with boxes (text truly removed) — DOM-overlay boxes in
page-% (see decisions.md). Two bugs found at gate and fixed (see bugs.md): Header & Footer
placeholder i18n FORMATTING_ERROR (ICU-escaped the literal `{token}` examples);
Sign PDF Type-tab `removeChild` crash (keep fabric canvas permanently mounted, toggle
visibility, init once, guarded dispose). `bun run build` green (all routes × en/tr/ru,
no MISSING_MESSAGE). User confirmed every tool: real PDF → correct output, no upload in
DevTools, mobile 375px, dark mode, /en /tr /ru. Committed + pushed to origin/main.
Next: Wave 2B (6 no-design local tools).

## [2026-06-01] Wave 2B complete — GATE 2B PASSED (6 tools)
6 medium-priority local tools shipped, catalog 21 → 27. Tools (simplest → complex):
`remove-metadata`, `edit-metadata` (share `lib/pdf/metadata.ts`), `grayscale-pdf`
(re-rasterize pages, page-progress), `flatten-pdf` (`getForm().flatten()`, no-op if no
form), `text-to-pdf`, `markdown-to-pdf` (split editor + live preview via markdown-to-jsx).
All no-design; standard `ToolShell` pattern; full 7-touch-point wiring across en/tr/ru.
Two bugs found at gate and fixed (see bugs.md): (1) Header&Footer-style i18n — n/a here;
the real gate bugs were **Text→PDF / Markdown→PDF crashing on non-WinAnsi text** (smart
quotes, Turkish, Cyrillic) — pdf-lib `StandardFonts` use WinAnsi and throw. Fixed by
embedding **Noto Sans** (Regular/Bold + Mono) via `@cantoo/pdf-lib` + `@pdf-lib/fontkit`
(new dep), fonts in `public/fonts`, loader `lib/pdf/fonts.ts`. First attempt used
`{ subset: true }` → glyphs dropped (old fontkit subsetter); fixed by embedding the full
font. Verified offline (pdfjs text-extraction round-trips TR + RU + smart quotes/em dash).
(2) Flatten — not a code bug (needed a sample fillable PDF). `bun run build` green (27
routes × en/tr/ru, no MISSING_MESSAGE). User confirmed all 6. Committed + pushed to
origin/main. Next: Wave 2C (OCR PDF — the one cloud tool, Tesseract on Hetzner).
