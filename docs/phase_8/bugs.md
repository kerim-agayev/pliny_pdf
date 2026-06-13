# Phase 8 — Known Bugs

## B8-1 — Add Text: clicking PDF while draft active discards old draft
- **Status:** FIXED in Wave 8A
- **Root cause:** `onPointerDown` in EditorCanvas.tsx line 481-484 had no guard for existing
  active draft. `setDraft(newPos)` + `setDraftText("")` overwrote old draft before blur could commit.
- **Fix:** `commitDraftKeepTool` + `skipNextBlurRef` + `addLocalBlockKeepTool` store action.
