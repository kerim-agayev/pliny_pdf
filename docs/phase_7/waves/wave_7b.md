# Wave 7B — PDF to Text + Reverse Pages

## Status: ✅ COMPLETE — GATE 7B PASSED (2026-06-12, user-confirmed)

Committed `336013c`, pushed to origin/main. Local-only tools — no Hetzner redeploy.

## Tasks
- [x] Fetch Claude Design handoff link → `.design-handoff/wave-7b/` (38 files)
- [x] AI Summary fully hidden — ToolsCatalog filters `available`, sitemap drops hidden, /summarize → /tools redirect
- [x] PDF to Text — component, lib (pdf.js text layer + preserve-layout/encoding/range), route, i18n, SEO
- [x] Reverse Pages — component, lib (pdf-lib copyPages), route, i18n, SEO
- [x] Add to lib/tools.ts, lib/seo.ts, lib/structured-data.ts, ToolMount
- [x] Add ToolPages.* to messages/en+tr+ru.json
- [x] bun run build green (exit 0, no MISSING_MESSAGE)

## Gate 7B — PASSED
- [x] /en/pdf-to-text works (extract, range, preserve-layout, UTF-8/ASCII, 500-char preview, .txt download)
- [x] /en/reverse-pages works (before/after preview, reversed PDF download)
- [x] /en/tools — AI Summary gone, live count = 30
- [x] EN/TR/RU render, both LOCAL limits enforced, build green

## Key Decisions
- PDF to Text: design added Preserve-layout + Encoding (UTF-8/ASCII) + page-range beyond the original plan → implemented for real (lib extended) per "match design exactly". UTF-8 output gets a BOM.
- Reverse Pages done-state uses the standard green SuccessPanel (app convention); PDF to Text uses the design's inline preview-panel download (no SuccessPanel).
- `.design-handoff/wave-7b/` left untracked (reference bundle, not shipped).

## Catalog: 30 live tools → Phase 7 target 33 (7C/7D add the remaining 3)
