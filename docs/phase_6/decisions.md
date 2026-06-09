# Phase 6 — Technical Decisions

## D6-1 — Italic for Noto/Unicode: synthesize oblique via shear matrix

**Decision**: Italic for Noto fonts (and any text auto-routed to the Noto path
because it contains non-Latin-1 characters) is synthesized in `_insert_text` by
shearing the glyphs with `pymupdf.Matrix(1, 0, 0.25, 1, 0, 0)` applied as `morph`
around the insertion point.

**Why**: No NotoSans-Italic.ttf or NotoSerif-Italic.ttf on disk. Wave 6A added Noto
fonts to the toolbar, so selecting a Noto font + italic (or italicizing text with
smart quotes / non-Latin-1 chars) hit the Noto branch and lost italic in the PDF —
while base-14 italic (`heit`/`tiit`/`coit`) already worked. That asymmetry is why
"bold worked but italic didn't". The shear value `c=0.25` was verified by rendering
to PNG: it matches the right-leaning slant of the base-14 oblique faces.

**How to apply**: No TTF downloads required. If a proper italic TTF is ever added,
replace the `morph` branch with a direct `fontfile` lookup.

---

## D6-2 — Find & Replace removed from UI (rework in Wave 6E)

**Decision**: The Find & Replace button and ⌘H shortcut are removed from
EditorToolbar (Row 3) and the keyboard handler in index.tsx. `FindReplaceModal.tsx`
is retained but not rendered anywhere.

**Why**: The current implementation has interaction issues that require a design
pass before it can be re-enabled. Deferred to Wave 6E.

**How to apply**: Re-enable by importing and rendering `FindReplaceModal` from
`index.tsx` and restoring the toolbar button + keyboard shortcut.

---

## D6-3 — Underline burns into the saved PDF

**Decision**: Underline is stored client-side in `blockStyles[blockId].underline`
(drives the on-screen `text-decoration`), but `changeList()` in `index.tsx` merges
it into the `BlockChange` payload on save. `BlockChange.underline` flows through the
save route → `saveSession` → `_apply_edit` / `_apply_add_text`, where
`_draw_underline()` draws a line just below the baseline (`baseline + 0.12·size`)
spanning the text width.

**Why**: Chosen over keeping it display-only so underline is preserved in the
downloaded PDF. Width is measured for re-typed text (`pymupdf.get_text_length`),
falling back to the original bbox width for format-only changes.

**Note**: `textAlign` remains visual-only — no server support planned.

**Implementation detail — y-coordinate**: `BlockChange.y` stores the TOP of the
text block (PDF points). The server computes the insertion baseline as
`top_y + baseline_offset` where `baseline_offset = g["origin"][1] - g["bbox"][1]`
from the geometry map. For add-text blocks (no geometry map entry), the
approximation is `top_y + fontSize`.

---

## D6-4 — Resize feature removed entirely

**Decision**: Corner-handle resize (`blockSizes` store, `resizeBlock` action,
4 handle `<span>` elements in TextBlock) has been removed.

**Why**: The visual resize didn't clip text reliably (root div used `minHeight`
not `height`) and the PDF output never used the width/height values — the server
ignored them. The feature added complexity for zero user benefit.

**How to apply**: If resize is re-added it needs: exact `height/width` on both root
and content divs, server-side support to wrap/clip inserted text to a specific column
width, and a `blockSizes` store field wired into `changeList()`.

---

## D6-5 — Text Move: ghost mask pattern for visual feedback

**Decision**: During drag and after a block settles at a new position, a white
`<div>` ("ghost mask") is pinned at the **original** PDF coordinates to cover the
stale PNG text (the PNG only re-renders on Save — the move isn't applied server-side
until then). The actual block overlay renders above the ghost (z-index 100 vs 99),
painting the block text at the new spot.

**Why the ghost must persist after drop**: `bumpRender()` only cache-busts the
`<img>` URL; it does not apply changes server-side. Re-fetching the PNG returns the
same image with the original text at the old position. The ghost must stay to mask it.

**Small-move z-index fix**: After drop `moveOffset` clears to `null`, which previously
reset the block's z-index to `undefined` (0), letting the ghost (99) paint over it.
Fixed by keeping `zIndex: 100` whenever `moveOffset || pos` — i.e. both during drag
and after settling at a new spot.

**Move does not push to undo stack**: `blockPositions` is a parallel structure
separate from the `changes` Map and `annotations` array that undo snapshots track.
Adding it to snapshots requires a Snapshot type change — deferred to Wave 6E.
