# Phase 8 — Known Bugs

## B8-1 — Add Text: clicking PDF while draft active discards old draft
- **Status:** FIXED in Wave 8A
- **Root cause:** `onPointerDown` in EditorCanvas.tsx line 481-484 had no guard for existing
  active draft. `setDraft(newPos)` + `setDraftText("")` overwrote old draft before blur could commit.
- **Fix:** `commitDraftKeepTool` + `skipNextBlurRef` + `addLocalBlockKeepTool` store action.

## B8-2 — Toolbar popovers could all be open at once + never closed on outside-click
- **Status:** FIXED in Wave 8E
- **Root cause:** shapes/stamp/marks each had an independent `useState` boolean in
  EditorToolbar.tsx; opening one didn't close the others, and none had a click-outside
  handler (only the Link modal did).
- **Fix:** single `openMenu` value + a `pointerdown`/Esc effect guarded by `menuWrapRef`.

## B8-3 — Ghost white masks stack and cover other blocks after multiple moves
- **Status:** FIXED in Wave 8E (regression of D6-11/D6-12 ghost-mask layering)
- **Repro:** move several text blocks into the same region; a moved block's leftover
  white mask (at its OLD position) covers another block's text.
- **Root cause:** every block whose `masked` is true (which includes `!!pos` — i.e. any
  MOVED block) renders a persistent white mask at its ORIGINAL bbox to hide the baked PNG
  text (the PNG is never re-rendered on move — `moveBlock` only writes `blockPositions`,
  editorStore.ts:356). Those masks rendered at `z-index: auto`, interleaved per-block in
  array order, so a later block's mask painted OVER an earlier block's (moved) content.
  Masks accumulated and covered text.
- **Why NOT "remove the mask after drop":** the PNG still carries the original text until
  save, so removing the mask makes the text appear at BOTH the old and new positions.
  The mask must persist — the fix is layering, not removal.
- **Fix (TextBlock.tsx + EditorCanvas.tsx):** page container is now an isolated stacking
  context (`isolation: isolate`); the page PNG sits at `zIndex -2`; every ghost mask sits
  at `zIndex -1`. Result: masks are just above the PNG (still hide stale text) but below
  ALL block contents (`auto`) and annotations — so no ghost can ever cover another block's
  text. Dragged block keeps `zIndex 100` (D6-12); annotations stay above ghosts (D6-11).
  TextBlock's mask *condition* (`masked`) is unchanged, so drag behavior is untouched.

## Memory-leak audit (Wave 8E) — no leaks found
- All 15 window/document event listeners, both `URL.createObjectURL` (image upload),
  all `requestAnimationFrame` (snap), and all timers (focus/long-press/session tick)
  have proper cleanup. Two negligible fire-and-forget timeouts (BottomSheet close-anim,
  LinkDialog focus) are not leaks. Manual heap check (open → 20 edits → save → close ×5)
  to confirm flat profile during GATE.
