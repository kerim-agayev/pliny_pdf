# Phase 5 — Log

(Append one entry per wave gate-pass.)

## [2026-06-07] GATE 5A passed — global fixes + limit enforcement
- Download filename fix (`lib/format.ts`): `showSaveFilePicker` now gets a `types`
  array (keeps extension on rename); anchor fallback appends `.pdf` if missing.
  Covers .pdf/.jpg/.zip/.docx.
- Plan-aware limits (`lib/limits.ts`): `LOCAL_MAX_MB` {10,25,50} + `LOCAL_MAX_PAGES`
  {50,150,300}; `CLOUD_MAX_MB` {25,100,250} + `CLOUD_MAX_PAGES` {50,300,1000}; new
  `localMaxMB/localMaxBytes/localMaxPages` + `cloudMaxPages`.
- `lib/ratelimit.ts`: free daily server-tool limit 10→15 (anon stays 3).
- `FileDropzone`: plan-aware size badge/validation; opt-in `checkPages` page gate
  (rejects over-limit PDFs before processing). `checkPages` added to 17 local PDF tools.
- i18n: `Errors.tooManyPagesLocal` in en/tr/ru.
- `bun run build`: green (Compiled successfully, 141/141 static pages, no MISSING_MESSAGE).
- Edit PDF limits unchanged; existing cloud route logic untouched (inherits new size constants).

