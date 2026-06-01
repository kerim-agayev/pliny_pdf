# PlinyPDF Phase 2 — Index

> Phase 2 memory. Read this first at session start, then drill into other files.
> Phase 1 docs (`docs/*.md` at root) are READ-ONLY — referenced by path only.

## Current Status
- Current phase: **Wave 2B** (starting)
- Current tool: **not started** (Wave 2B: remove-metadata first)
- Total tools: **8 / 15 done**
- Completed waves: **Wave 2A** (8 tools, gate-passed + committed 2026-06-01)
- Next action: **build Wave 2B's 6 no-design local tools** in order (CLAUDE_2.md §6),
  `bun run build` green after each, then Gate 2B.

## Waves
- **Wave 2A** — 8 high-priority local tools (in progress). Detail: `waves/wave_2a.md`.
- **Wave 2B** — 6 medium-priority local tools (pending). Detail: `waves/wave_2b.md`.
- **Wave 2C** — OCR PDF, one cloud tool (pending). Detail: `waves/wave_2c.md`.

## Phase 2 Tool Status (0 / 15)
### Wave 2A (8 / 8 — DONE, gate-passed 2026-06-01)
- [x] delete-pages
- [x] extract-pages
- [x] add-page-numbers
- [x] header-footer
- [x] crop-pdf
- [x] organize-pages
- [x] sign-pdf
- [x] redact-content
### Wave 2B (0 / 6 — in progress)
- [ ] remove-metadata (next)
- [ ] edit-metadata
- [ ] grayscale-pdf
- [ ] flatten-pdf
- [ ] text-to-pdf
- [ ] markdown-to-pdf
### Wave 2C (0 / 1)
- [ ] ocr-pdf (cloud, Tesseract on Hetzner)

## Key Phase 2 Files
- `CLAUDE_2.md` (root) — Phase 2 master plan.
- `docs/phase_2/decisions.md` — Phase 2 decisions only.
- `docs/phase_2/architecture.md` — new tool patterns, OCR pipeline, design tokens.
- `docs/phase_2/bugs.md` — bugs found this phase.
- `docs/phase_2/log.md` — one entry per wave gate-pass.

## Per-tool wiring (verified against the codebase)
Each new tool touches **7 places** (see `architecture.md`):
icons.tsx → lib/tools.ts → lib/seo.ts → lib/structured-data.ts →
messages/{en,tr,ru}.json → app/[locale]/<slug>/page.tsx → components/tools/<Tool>.tsx (+ lib/pdf/<op>.ts).
