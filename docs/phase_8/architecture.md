# Phase 8 — Architecture Notes

No new tools added. Phase 8 polishes Edit PDF only.

## Wave 8A — Draft commit pattern
- `commitDraft()` — commits draft, switches tool to "select" (used for Enter/blur-outside)
- `commitDraftKeepTool(at, text)` — commits draft, keeps tool as "text" (used for canvas click)
- `addLocalBlock` in editorStore — adds block + switches to select
- `addLocalBlockKeepTool` in editorStore — adds block, no tool/selection state change
- `skipNextBlurRef` — flag to skip the blur that fires after onPointerDown to prevent double-commit

## Wave 8B — Snap guides
TBD (design handoff required first)

## Wave 8C — Auto-resize
TBD — may require backend changes to store block size in changes.json

## Wave 8D — Mobile
TBD (reuse design handoff from 8B)

## Wave 8E — Performance/UX
TBD
