# Wave 5D — Mobile touch support ✅ (GATE 5D passed 2026-06-07)

Touch support for Annotate PDF and Edit PDF. See CLAUDE_5.md §4 Wave 5D.

**Approach decision:** Used **Pointer Events** (the existing
RedactContent/SignPdf/CropPdf pattern: `onPointerDown` + window
`pointermove`/`pointerup` + `touch-action:none`) instead of the spec's
`useTouchDraw` touch→mouse translation layer. One code path covers mouse, touch,
and pen — far less code, consistent with the codebase. `lib/touch.ts` therefore
holds only the genuinely-shared piece: a `usePinchZoom` hook.

- **5D-1** `lib/touch.ts` — `usePinchZoom(ref, {getScale,setScale,panTarget})`:
  two-finger pinch→zoom + midpoint pan, non-passive listeners, callbacks in a ref
  (no stale zoom). Generic over zoom units.
- **5D-2** Annotate PDF (`EditorTool.tsx`) — `touch-action:none` on the fabric
  canvas; `usePinchZoom(wrapRef)` → existing `applyZoom`. fabric v6 already feeds
  its draw handlers from touch, so no handler changes.
- **5D-3** Edit PDF — `EditorCanvas.tsx` mouse→pointer + `touch-action:none` +
  `usePinchZoom` on the scroll container; `TextBlock.tsx` pointer events +
  double-tap-to-edit + pointer resize; `HighlightTool`/`DrawingTool`
  `onMouseDown`→`onPointerDown`; `globals.css` `.pp-edtool` mobile min-height
  40→44px.

GATE 5D: both editors usable with touch (draw/select/whiteout/resize);
pinch-to-zoom works in both, in sync with the +/− buttons. `bun run build` green.
Verified via DevTools 375px touch simulation.
