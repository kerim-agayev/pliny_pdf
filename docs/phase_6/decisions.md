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

## D6-7 — Date stamp removed from UI

Date stamp removed from UI — not needed by user. The Date dropdown button,
its handler, and the `toolDate` i18n key (en/tr/ru) were removed from
`EditorToolbar.tsx`. No backend changes — the feature reused the existing
`add-text` op, which stays intact for the Text tool and Duplicate.

## D6-8 — Whiteout re-architected to an editable annotation (Wave 6C)

**Decision**: Whiteout changed from an immediate, permanent structural op into a
client annotation (`type:"whiteout"`), like image/stamp. It's selectable, movable,
recolorable, bordered, duplicable, deletable, and undoable in the editor; on **save**
it burns as a redaction (`add_redact_annot(fill=color)` + `apply_redactions()`),
preserving TRUE content removal — then draws a border rect if requested.

**Why**: The requested whiteout features (color picker, border, duplicate-to-all-pages,
select/delete) are impossible while whiteout is an immediate fire-and-forget redaction.
The annotation model gives all of them for free (same pattern as Wave 6B).

**Blackout** = a whiteout annotation with `color:"#000000"` — no separate tool/type.
Redaction fill is black, so underlying text is genuinely removed (privacy), verified by
text extraction in the smoke test.

**Links — two-pass**: `cmd_apply` inserts links in a second pass after all other
changes, so an overlapping whiteout's `apply_redactions()` (which clears everything in
its rect) can't strip a freshly inserted link.

**Feature 12 (edit/remove EXISTING links) deferred** to a later wave. Existing links are
preserved automatically (rebuild from original.pdf) but not yet editable. Feasibility
verified: `get_links()` returns `xref`, `delete_link(dict)` works (PyMuPDF 1.27.2).

**Legacy `/whiteout` route + `whiteout()` client/service** left in place unused
(back-compat, zero refs) — removable in a later cleanup.

## D6-9 — Whiteout border removed; duplicate confirm; link underline (GATE 6C feedback)

- **Whiteout border feature removed** — not useful to the user. Dropped the border
  toggle + border-color picker and all `border`/`borderColor` plumbing (store, API,
  route schema, Python `_apply_whiteout`, i18n).
- **Duplicate-to-all-pages now behind a confirmation** (`ConfirmDialog`) — accidentally
  copying a whiteout to a 500-page doc is hard to undo. Shows "…copy to all {count}
  other pages. Are you sure?" with Cancel / Duplicate.
- **Links get a visible blue underline in the PDF** — `_apply_link` now draws a
  `#2563EB` line under the linked rect after `insert_link`, so the hyperlink is obvious
  in the downloaded PDF (standard hyperlink look), not just a clickable invisible area.

## D6-10 — Find & Replace re-enabled in 6E, full QA deferred to Phase 7

Find & Replace re-enabled in Wave 6E but full QA deferred to Phase 7 — may be
reworked or removed then. The button (Row 3 + ⌘H) and `FindReplaceModal` stay
wired as-is. Two interaction bugs were fixed during 6E (missing `bumpRender()`
after replace; duplicate Replace/Replace-All buttons consolidated), but the
feature has not been put through the full QA matrix and is not gating Phase 6.

## D6-11 — Moved-text ghost mask: z-index lowered, not removed (GATE 6E feedback)

**Decision**: The white "ghost" div that masks stale PNG text at a moved block's
ORIGINAL position (D6-5) had `zIndex: 99`, which placed it in the positive z-index
group — above every annotation overlay (all `auto`). So draw/whiteout/shape/
highlight placed over a moved block's old spot rendered *under* the ghost and
vanished. Fixed by removing the explicit z-index so the ghost falls back to `auto`:
by DOM order it still paints above the page PNG (mask preserved) but below all
annotation overlays (which come later in the DOM). The moved block keeps
`zIndex: 100` to stay above its own ghost.

**Why not delete the ghost** (as first proposed): the move is not applied
server-side until Save, and `bumpRender()` only cache-busts the `<img>` URL — the
server returns the same PNG with the text still at the old position. Removing the
ghost would show the original text at the old spot AND the moved copy at the new
spot (duplicate text) until save. The z-index fix solves the functional problem
(tools no longer blocked) without that regression. The ghost is white-on-white on
a normal page, so it's invisible except where it was covering annotations.

## D6-12 — Settled moved block drops to z-index `auto` (GATE 6E feedback round 2)

**Decision**: After D6-11, the moved TextBlock div still used `zIndex: 100` for
both `moveOffset` (active drag) AND `pos` (settled). The settled `100` put the block
in the positive group, above all annotation overlays — so draw/whiteout/shape placed
at the block's NEW position rendered under it. Changed to `zIndex: moveOffset ? 100 :
undefined`: the block is lifted to 100 only while actively dragging (clear feedback);
once settled it is `auto`.

**Why `auto` is safe for the ghost**: within the TextBlock fragment the ghost is
rendered before the block div, so by DOM order the settled block still paints above
its own ghost (no need for a positive z-index). Annotation overlays are rendered
after all text blocks in EditorCanvas, so at `auto` they paint above the settled
block — annotations always sit above text blocks (the user's Option C: DOM order, no
z-index numbers). Consistent with non-moved edited blocks, which were already `auto`.
