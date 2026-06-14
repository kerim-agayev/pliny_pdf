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

## 2026-06-14
- Wave 8C implementation complete: smart auto-resize text blocks +
  alignment-as-position. Frontend-only (no Hetzner deploy) — block w/h is a
  client-side concern; backend re-extracts bboxes on reopen.
- New lib/editor/textMeasure.ts (cssFont); editorStore blockSizes + setBlockSize
  (no undo push, captured in snapshots); EditorToolbar alignment buttons reposition
  via moveBlock with position-derived active-state.
- Heavy bug-fix journey: initial canvas-measureText approach was broken; rewrote to
  DOM measurement, then a hidden measurement mirror div, decoupled white mask
  (original bbox), stripped phantom trailing newline, white-space:pre (grow right not
  down), height from font metrics (fontSize*1.15*lineCount), and zeroed vertical box
  padding/margin so the box no longer covers the block below.
- GATE 8C PASSED ✅ — all tests green. Commits e62efc9, 62fbd0b, b0950db, 68a3adc,
  fd0ffb7, a3eb244, pushed to main. Next: Wave 8D (mobile responsive + bottom
  toolbar) — ask user for Claude Design handoff link before planning.
- Wave 8D implementation complete: mobile responsive + bottom toolbar. Fetched the
  Phase 8 design handoff (`.design-handoff/phase-8/`, `edit-redesign-mobile.jsx`) — the
  real mobile spec the earlier bundles lacked. New `useMediaQuery` hook, `BottomSheet`
  (spring/drag-handle/swipe-dismiss/backdrop/Esc), `MobileToolbar` (bottom-fixed
  scroll row + per-tool sheets bound to existing constants). Mobile chrome swap in
  index.tsx (controls row + Pages FAB + pinch hint); swipe page-nav, long-press context
  menu (+Duplicate), `isPinching` snap guard (lib/touch onPinchChange), bigger touch
  targets, safe-area, breakpoint 700→767. i18n EN/TR/RU. Frontend-only.
- Mid-wave: Find & Replace removed from UI entirely (desktop button + mobile pill +
  Ctrl/Cmd+H) per user decision — recurring removal (prev D6-2/D6-10). Modal + store
  actions kept. See decisions.md.
- GATE 8D PASSED ✅ — all tests green on real mobile device. Commits 5f50b73 (feature),
  2bbf3e6 (F&R removal), pushed to main. Next: Wave 8E (performance + toolbar UX audit)
  — next session, do not start yet.
- Wave 8E implementation complete (GATE pending user verification). Cleanup wave — a
  code audit found the editor already in good shape: tooltips (every `TBtn` has `title`),
  disabled states, and error toasts all already present; **no real memory leaks** (all
  15 event listeners, both object URLs, all rAF, all timers have proper cleanup). Two
  genuine gaps fixed:
  1. **Single-active dropdown** — replaced the 3 independent booleans
     (`shapesOpen`/`stampOpen`/`marksOpen`) in EditorToolbar with one
     `openMenu: "shapes"|"stamp"|"marks"|null` state + a click-outside/Esc effect
     (`menuWrapRef` on Row 1). Opening one popover now closes the others; clicking
     the canvas or pressing Esc closes the open one. Mobile already used a single
     `sheet` value — unchanged.
  2. **Save in-flight state** — `handleSave` now guards re-entry via `savingRef`
     (synchronous) and drives a `saving` state: Save/Download buttons disable and the
     primary button shows a `Spinner` + "Saving…" label while a save is in flight.
     i18n `saving` added EN/TR/RU. Fixes possible double-fire on rapid clicks.
  - **Z-index**: light touch (no renumber) — existing 13-layer scheme verified with no
    overlaps; snap guides at `z=1` confirmed correct (above PNG + static blocks, below
    the `z=100` dragged block). Documented the hierarchy as a legend comment in index.tsx.
  - Frontend-only (no `pdf-editor.py` change, no Hetzner deploy). `bun run build` green.
