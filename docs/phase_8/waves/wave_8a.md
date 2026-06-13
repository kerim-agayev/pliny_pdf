# Wave 8A — Add Text Bug Fix

## Status: DONE ✅ — GATE 8A passed 2026-06-13

## Goal
Fix the Add Text tool so clicking outside commits the draft automatically
(no Enter required, no new draft created while one is active).

## Bug
When draft is active and user clicks elsewhere on PDF:
- `onPointerDown` overwrites `draft` + `draftText` before blur can commit
- Old draft text is silently lost

## Fix (2026-06-13)
- Added `addLocalBlockKeepTool` to editorStore (adds block, no tool switch)
- Added `skipNextBlurRef` to prevent double-commit when blur fires after canvas click
- Added `commitDraftKeepTool(at, text)` — commits old draft while keeping text tool active
- Updated `onPointerDown` to commit existing draft before starting new one
- Updated `onBlur` to check `skipNextBlurRef` before committing

## Gate 8A — PASSED ✅ 2026-06-13
- [x] Type text → click elsewhere on PDF → old text committed, new draft opens
- [x] Type text → click outside PDF → text committed, no new draft
- [x] Enter still commits
- [x] Escape still discards
- [x] Empty draft → click away → no empty block
- [x] Double-click existing block → edit mode unchanged
- [x] bun run build green
