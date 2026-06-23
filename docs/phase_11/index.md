# Phase 11 — Edit PDF Fidelity & Robustness

## Current Status
- Phase: 11
- Active wave: **11A — Smart Background Sampling (whiteout fix)**
- Next step: implement backend sampling in `pdf-editor.py`, then GATE 11A.

## Waves
- 11A — Smart background sampling (mask matches page bg, not white). ← current
- 11B — Manual color fallback + font/AZ-TR-RU character support.
- 11C — Color & alignment fidelity.
- 11D — Uneditable detection + perf + final QA.

## Key Files
- `server/services/pdf-editor.py` — PyMuPDF edit engine (mask, text insert).
- `server/routes/editor.ts` — `/api/editor/*` routes.
- `components/tools/EditPdf/` — frontend editor (PNG + DOM overlays).
- `docs/phase_11/architecture.md` — investigation findings (read first).

## Completed
- (none yet)
