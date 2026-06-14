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

## Memory-leak audit (Wave 8E) — no leaks found
- All 15 window/document event listeners, both `URL.createObjectURL` (image upload),
  all `requestAnimationFrame` (snap), and all timers (focus/long-press/session tick)
  have proper cleanup. Two negligible fire-and-forget timeouts (BottomSheet close-anim,
  LinkDialog focus) are not leaks. Manual heap check (open → 20 edits → save → close ×5)
  to confirm flat profile during GATE.
