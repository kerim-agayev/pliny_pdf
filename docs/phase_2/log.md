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
