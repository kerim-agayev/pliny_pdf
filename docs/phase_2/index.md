# PlinyPDF Phase 2 — Index

> Phase 2 memory. Read this first at session start, then drill into other files.
> Phase 1 docs (`docs/*.md` at root) are READ-ONLY — referenced by path only.

## Current Status
- Current phase: **Wave 2C**
- Current tool: **OCR PDF — starting (the one cloud tool of Phase 2)**
- Total tools: **14 / 15 confirmed** (Wave 2A + Wave 2B); Wave 2C's 1 cloud tool pending
- Completed waves: **Wave 2A** (8 tools) + **Wave 2B** (6 tools), both gate-passed + committed 2026-06-01
- Next action: **build Wave 2C OCR PDF** (cloud, Tesseract on Hetzner) → Gate 2C.

## Waves
- **Wave 2A** — 8 high-priority local tools (DONE, gate-passed). Detail: `waves/wave_2a.md`.
- **Wave 2B** — 6 medium-priority local tools (DONE, gate-passed). Detail: `waves/wave_2b.md`.
- **Wave 2C** — OCR PDF, one cloud tool (in progress). Detail: `waves/wave_2c.md`.

## Phase 2 Tool Status (14 / 15)
### Wave 2A (8 / 8 — DONE, gate-passed 2026-06-01)
- [x] delete-pages
- [x] extract-pages
- [x] add-page-numbers
- [x] header-footer
- [x] crop-pdf
- [x] organize-pages
- [x] sign-pdf
- [x] redact-content
### Wave 2B (6 / 6 — DONE, gate-passed 2026-06-01)
- [x] remove-metadata
- [x] edit-metadata
- [x] grayscale-pdf
- [x] flatten-pdf
- [x] text-to-pdf
- [x] markdown-to-pdf
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
