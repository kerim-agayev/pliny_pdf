# Phase 11 — Log

## [2026-06-23] Phase 11 start + Wave 11A investigation
- Created `docs/phase_11/` tree.
- Investigated Edit PDF architecture (see architecture.md): editor shows
  server-rendered PNGs + DOM overlays; text edit = PyMuPDF redact-then-redraw;
  mask hardcoded white at `pdf-editor.py:217`; no sampling exists.
- Decision: Wave 11A = backend PyMuPDF background sampling (Option B), flat
  median fill with white fallback. Backend-only (user-confirmed).
- Implemented `_sample_bg_color` + `_redact_rect(fill)` + pristine sample doc in
  `cmd_apply`/`_apply_edit`. Self-check `test_sample_bg.py` green; `bun run
  build` green.
- GATE 11A engine check on real REKVIZIT.pdf: 15 gray-row blocks sample uniform
  0.92 gray (not white), 26 white blocks stay white, 0 false fallbacks, page
  unrotated. End-to-end edit of "Valyuta" gray row → rendered patch 0.918 gray.
  PASS. Pending: Hetzner deploy + visual confirm in editor UI.
