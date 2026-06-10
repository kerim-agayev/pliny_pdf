# Wave 6D — Annotation & Shape Fixes

Status: implemented 2026-06-10, awaiting GATE 6D.

## Features & outcomes
15. Shape drag preview (Bug A) — already fixed in Wave 6A; re-verified, no code change.
16. Highlight color picker — dedicated 6-color palette + `highlightColor` state;
    existing highlights selectable + recolorable. Backend already color-aware.
17. Sticky note — color (4) + drag-reposition + hover-✕ + Del + color burn.
    **Bubble resize skipped** (user decision).
18. Shapes fill — `shapeFill` toggle for rect/circle; fill @ 20% FE + backend
    (draw_rect/draw_oval fill_opacity=0.2).
19. Marks — new `mark` type + tool; ✓/✗/○ click-to-place, drag/resize/Del;
    backend `_apply_mark` (polyline / diagonals / oval).

## Decisions
- D6-10: marks = single `"mark"` annotation type with `markType` field (not 3 types).
- D6-11: mark colors fixed per type (✓ #16A34A, ✗ #DC2626, ○ #2563EB); recolor out of scope.
- D6-12: sticky-note bubble resize skipped (textarea keeps vertical resize).

## Backend deploy
CLAUDE_6 §7 incorrectly listed 6D as "frontend only". `pdf-editor.py` changed
(#17/#18/#19) → Hetzner backend deploy required at gate-pass.

## Files touched
- lib/stores/editorStore.ts, lib/api/editor.ts
- components/tools/EditPdf/{EditorToolbar,EditorCanvas,CommentTool,HighlightTool,DrawingTool}.tsx, index.tsx
- server/services/{editor.ts,pdf-editor.py}
- messages/{en,tr,ru}.json
