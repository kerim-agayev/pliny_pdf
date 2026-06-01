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

## [2026-06-01] Wave 2C OCR PDF — code committed + pushed (Gate 2C pending)
`ocr-pdf` (the one Phase 2 cloud tool) built and pushed, catalog 27 → 28. Engine =
**ocrmypdf** (user-approved over the raw-Tesseract pipeline the wave doc sketched — see
decisions.md). Frontend: `OcrPdf.tsx` (dropzone + eng/tur/rus language picker defaulting to
locale + progress + download), `app/[locale]/ocr-pdf/page.tsx`, new `postFileForm` in
`lib/api.ts`, full 7-touch-point wiring × en/tr/ru. Backend: `server/services/ocr.ts`
(`ocrmypdf -l <lang> --skip-text --optimize 1`, temp files), `server/routes/ocr.ts`
(POST `/api/ocr`, auth-optional, shared `checkServerTool` rate limit), wired in
`server/index.ts`; `OCRMYPDF_BIN` in `.env.example`. `bun run build` green (28 routes ×
en/tr/ru); `tsc --noEmit` 0 errors. Committed `feat(tools): Wave 2C — OCR PDF (ocrmypdf on
Hetzner)` + pushed to origin/main. **Gate 2C still pending** — needs manual Hetzner
provisioning (`apt install ocrmypdf tesseract-ocr-{eng,tur,rus}`) + backend restart, then the
gate test (scanned→searchable, text passthrough, TR/RU scans, anon rate-limit). Cannot be done
from the dev box (cloud tool; requires SSH to 49.13.119.27).
