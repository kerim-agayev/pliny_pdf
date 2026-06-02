# Phase 3 — Index

## Current Status
- Current phase: **PHASE 3 COMPLETE ✅ (all 8 waves 3A–3H gate-passed & pushed)**
- Total waves: 8 / 8 done. Final closeout build green (exit 0, 138 pages, no MISSING_MESSAGE).
- Next action: none — Phase 3 (hardening) done. Catalog still 28 tools (lib/tools.ts unchanged).

## Waves
- [x] 3A — Foundations (toast, error UX, validation, PasswordModal, ToolStatus) — committed `d667578`
- [x] 3B — Limits & security (file-size tiers, split cap, magic-byte, password prompts) — `34220f7`, gate passed
- [x] 3C — Compress presets + grayscale never-inflate (+ tool caps) — gate passed, fixes `64e974e`/`c3f6912`
- [x] 3D — Email verification off, request-a-tool (on /tools), refund/support page — `bc39006`/`6017cdc`
- [x] 3E — Blog swap (privacy deep-dive) — `fcbd595`+`019e10e`, gate passed
- [x] 3F — UX polish (augment + chunked): recent files `00359f2`, shortcuts `131c4d4`, toasts `de07c7d` — gates passed
- [x] 3G — Performance: lazy-load `dd086a8`, streaming download `dcdb06c`, raster worker `090c02b` — gates passed
- [x] 3H — PDF→Word patience UI (Option B) — gate passed

## Reading order at session start
1. `pliny_pdf/CLAUDE_3.md` (master plan)
2. This file
3. Drill into `decisions.md` / `waves/wave_3X.md` only as needed

Phase 1 (`docs/*.md`) and Phase 2 (`docs/phase_2/*`) docs are READ-ONLY.
