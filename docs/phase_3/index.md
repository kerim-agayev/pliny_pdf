# Phase 3 — Index

## Current Status
- Current phase: **Wave 3G — Performance (chunked; 3G-1 lazy-load built, awaiting gate)**
- Current task: 3G-1 lazy-load done; 3G-2 streaming + 3G-3 raster worker pending
- Total waves: 6 / 8 done (3A–3F done); 3G in progress
- Next action: user verifies 3G-1 → 3G-2 streaming download → 3G-3 raster web worker

## Waves
- [x] 3A — Foundations (toast, error UX, validation, PasswordModal, ToolStatus) — committed `d667578`
- [x] 3B — Limits & security (file-size tiers, split cap, magic-byte, password prompts) — `34220f7`, gate passed
- [x] 3C — Compress presets + grayscale never-inflate (+ tool caps) — gate passed, fixes `64e974e`/`c3f6912`
- [x] 3D — Email verification off, request-a-tool (on /tools), refund/support page — `bc39006`/`6017cdc`
- [x] 3E — Blog swap (privacy deep-dive) — `fcbd595`+`019e10e`, gate passed
- [x] 3F — UX polish (augment + chunked): recent files `00359f2`, shortcuts `131c4d4`, toasts `de07c7d` — gates passed
- [ ] 3G — Performance (web workers, streaming download, lazy tool components)
- [ ] 3H — PDF→Word patience UI

## Reading order at session start
1. `pliny_pdf/CLAUDE_3.md` (master plan)
2. This file
3. Drill into `decisions.md` / `waves/wave_3X.md` only as needed

Phase 1 (`docs/*.md`) and Phase 2 (`docs/phase_2/*`) docs are READ-ONLY.
