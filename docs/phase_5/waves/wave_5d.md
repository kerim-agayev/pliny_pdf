# Wave 5D — Mobile touch support (stub)

Add touch event support to Annotate PDF and Edit PDF. See CLAUDE_5.md §4 Wave 5D.

- 5D-1: `lib/touch.ts` — `useTouchDraw(canvasRef)`; touch→mouse mapping; pinch-to-zoom
- 5D-2: Annotate PDF (`EditorTool.tsx`) — touch listeners alongside mouse; fabric.js touch
- 5D-3: Edit PDF (`components/tools/EditPdf/`) — touch handlers, ≥44px targets, 375px viewport

GATE 5D: both editors usable with touch; pinch-to-zoom works.
