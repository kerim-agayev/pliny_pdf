# Phase 8 — Log

## 2026-06-13
- Phase 8 started. Created docs/phase_8/ directory tree.
- Wave 8A implementation complete: Add Text auto-commit on canvas click.
- GATE 8A passed — all 7 tests green. Committed 8414caa, pushed to main.
- Wave 8B implementation complete: Figma-style snap/alignment guides (page
  center, block-to-block, margins) for text/images/stamps/marks/comments +
  shape rect/circle creation. New snapGuides.ts engine + SnapGuideOverlay.
- GATE 8B: 3 bugs found & fixed during review — (1) text top/bottom snap
  inconsistency → uniform font-derived line box (TEXT_LINE_RATIO=1.2);
  (2) Add Text horizontal overflow → measureTextWidth+20; (3) Add Text
  excess bottom padding → height fontSize*1.2.
- GATE 8B PASSED ✅ — all tests green. Commits 6cd9445, cdffb17, d5314f3,
  pushed to main. Next: Wave 8C (smart auto-resize text blocks).
