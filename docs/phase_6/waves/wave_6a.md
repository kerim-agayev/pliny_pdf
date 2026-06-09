# Wave 6A — Text & Movement Improvements

**Status: ✅ COMPLETE — GATE passed 2026-06-09**

---

## What Shipped

### Bug Fixes (pre-existing)
- **Bug A** — Shape drag preview: replaced generic dashed-rect preview with per-shape
  rendering (arrow, circle, line, rectangle, strikethrough). EditorCanvas.tsx.
- **Bug B** — Text overflow: added `overflow: hidden` to the content div in TextBlock.
  Text now clips within the block border when resized.
- **Bug C** — Resize min dimensions: already correct (`Math.max(50, w)`,
  `Math.max(20, h)`) — confirmed, no change needed.

### Resize Removed
- Removed corner-handle resize entirely (blockSizes store, resizeBlock action, 4
  handle spans in TextBlock). The visual didn't clip text reliably and the PDF output
  never used width/height — the server ignored them. Decision D6-4.

### Text Move (drag-and-drop)
- Drag any text block to a new position while in Select mode.
- `blockPositions` store + `moveBlock` action (Zustand).
- Ghost mask pattern: a white `<div>` stays pinned at the original PDF coordinates to
  cover the stale PNG text (PNG isn't re-rendered until Save). The block overlay paints
  text at the new spot above the ghost (z-index 100 vs 99). Decision D6-5.
- Position merges into `BlockChange` on save (`changeList()` in index.tsx); backend
  converts top-y to baseline using geometry map's `baseline_offset`.
- Known limitation: move does not push to undo stack (deferred to Wave 6E).

### Text Duplicate (Ctrl+D)
- Ctrl+D duplicates the selected block at +20pt offset with matching font/color/bold/italic.
- Duplicate button added to toolbar Row 2.

### 6 Fonts (was 3)
- Added: Noto Sans, Noto Serif, Noto Sans Mono.
- NotoSerif-Regular.ttf + NotoSerif-Bold.ttf downloaded to Hetzner `public/fonts/`
  (not in git — too large).
- Python `_insert_text` routes explicit Noto font names to the correct TTF; non-Latin-1
  text auto-routes to Noto Sans as a Unicode fallback.

### Bold/Italic on Existing Text
- Toggling bold or italic on an existing PDF block now persists in the saved PDF.
- Root fix: `_apply_edit` previously used `change.get("text", "")` as fallback, erasing
  the original text. Fixed by adding `text` field to the geometry map (`_build_geometry_map`)
  and using `change.get("text") or g.get("text", "")`.
- Bold/italic also persist in the UI after deselecting the block (fixed: `modified` flag
  now includes `change.bold` / `change.italic`).

### Italic for Noto/Unicode Text
- The Noto/unicode branch of `_insert_text` previously dropped italic (no italic TTF on
  disk). Now synthesizes oblique via shear: `pymupdf.Matrix(1, 0, 0.25, 1, 0, 0)` applied
  as `morph` around the insertion point. Visually matches base-14 oblique slant. Decision D6-1.

### Underline Burns into PDF
- Underline is stored client-side in `blockStyles[blockId].underline` (drives the
  on-screen `text-decoration`), but `changeList()` now merges it into the `BlockChange`
  payload on save. `_draw_underline()` draws a line just below the baseline on the PDF
  page. Decision D6-3.
- `textAlign` remains visual-only — no server support.

### Find & Replace Removed from UI
- The Find & Replace button and ⌘H shortcut removed from EditorToolbar and keyboard
  handler. `FindReplaceModal.tsx` retained but not rendered. Needs UX rework before
  re-enabling (Wave 6E). Decision D6-2.

---

## Gate Verification Checklist (all ✅)

1. ✅ `bun run build` — zero errors, zero MISSING_MESSAGE
2. ✅ Bug A: arrow/circle/line drag previews are correct shapes
3. ✅ Bug B: text clips within border
4. ✅ Bug C: min-width 50, min-height 20 (already correct)
5. ✅ Text Move: existing PDF block dragged → new position in saved PDF
6. ✅ Text Duplicate: Ctrl+D → offset copy, auto-selected, correct font/bold
7. ✅ Fonts: Noto Sans/Serif/Mono render in downloaded PDF
8. ✅ Bold/Italic: toggle on existing block → persists in saved PDF and UI
9. ✅ Duplicate bold: duplicated bold block stays bold in PDF
10. ✅ No regressions on whiteout, highlight, undo/redo

---

## Commits

| Commit | Description |
|--------|-------------|
| `3f7ebbb` | Wave 6A main implementation |
| `b2472d4` | Bug fix round 1 (move feedback, resize clip, strike width, whiteout z-index, F&R removal) |
| `49043be` | Bug fix round 2 (ghost mask for move, resize removed, underline persists) |
| `47a63c1` | Bug fix round 3 (moved block visible after drop, bold/italic UI persist, underline in PDF) |
| `e1d1ab2` | Italic fix (Noto oblique via shear matrix) |
| `19eb2d9` | Small move z-index fix (ghost no longer covers new position for tiny moves) |
