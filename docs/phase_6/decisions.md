# Phase 6 — Technical Decisions

## D6-1 — Noto Italic: synthesize oblique via shear (SUPERSEDED in GATE 6A re-test)

**Original decision**: Italic for Noto fonts (and any text routed to the Noto
path because it needs Unicode) rendered as regular weight in the saved PDF —
NotoSans-Italic.ttf / NotoSerif-Italic.ttf are not on disk.

**Updated (GATE 6A re-test)**: italic is now synthesized in `_insert_text` for the
Noto/unicode branch by shearing the glyphs with `pymupdf.Matrix(1, 0, 0.25, 1, 0, 0)`
around the insertion point (`morph`). This matches the right-leaning slant of the
base-14 oblique faces. No extra TTFs needed. Verified by rendering: Noto Sans,
Noto bold+italic, and Turkish unicode (`şğü`) all slant correctly.

**Why it mattered**: Wave 6A added Noto fonts to the toolbar dropdown, so selecting
a Noto font + italic (or italicizing text with smart quotes / non-Latin-1 chars)
hit this branch and lost italic in the PDF — while base-14 italic (`heit`/`tiit`/
`coit`) already worked. The asymmetry is why "bold worked but italic didn't".

---

## D6-2 — Text Move: no undo support

**Decision**: `moveBlock` does not push to the undo stack (same as `resizeBlock`
which also has no undo).

**Why**: Undo snapshots track `changes` (BlockChange map) and `annotations`, but
`blockPositions` is a parallel structure. Adding it to snapshots requires a
Snapshot type change and coordinating moveBlock with the undo stack — deferred
to Wave 6E review.

---

## D6-3 — Move y-coordinate: top-y in BlockChange, baseline computed server-side

**Decision**: `BlockChange.y` stores the TOP of the text block (PDF points). The
server computes the insertion baseline as `top_y + baseline_offset` where
`baseline_offset = g["origin"][1] - g["bbox"][1]` from the geometry map.

For add-text blocks (no geometry map entry), the approximation is
`top_y + fontSize` (accurate for base-14 fonts; slight offset for Noto).

**Why**: The frontend tracks block positions as top-left (consistent with how
`block.y` is used in rendering), so this is the natural coordinate to store.

---

## D6-5 — Find & Replace removed from UI in Wave 6A

**Decision**: The Find & Replace button and ⌘H shortcut are removed from
EditorToolbar (Row 3) and the keyboard handler in index.tsx. FindReplaceModal.tsx
is retained but not rendered anywhere.

**Why**: Find & Replace needs a UX rework before re-enabling (Wave 6E). The
current implementation has interaction issues that require a design pass.

---

## D6-6 — Resize removed in Wave 6A

**Decision**: Corner-handle resize (blockSizes store, `resizeBlock` action, resize handles in TextBlock) has been removed entirely.

**Why**: The visual resize didn't clip text reliably (root div used `minHeight` not `height`) and the PDF output never used the width/height values — the server ignored them. The feature added complexity for zero user benefit.

**How to apply**: If resize is re-added, it needs: exact `height/width` on both root and content divs, and backend support to wrap/clip inserted text to a specific column width.

---

## D6-7 — Underline burns into the PDF (GATE 6A re-test)

**Decision**: Underline now persists in the saved PDF. It is still stored
client-side in `blockStyles[blockId].underline` (drives the on-screen
`text-decoration`), but `changeList()` in `index.tsx` merges it into the
`BlockChange` payload on save. `BlockChange.underline` flows through the save
route → `saveSession` → `_apply_edit` / `_apply_add_text`, where
`_draw_underline()` draws a line just below the baseline (`baseline + 0.12·size`)
spanning the text width (measured for re-typed text, original bbox width
otherwise). Chosen over keeping it display-only.

**Re-test fixes also landed here**: moved blocks no longer show blank (overlay
`masked` now includes a position override `pos`, and a white ghost stays pinned
at the original coords to cover the stale PNG); bold/italic now persist after
deselect (`modified` includes `change.bold`/`change.italic`).

**Note**: `textAlign` remains visual-only — no server support.

---

## D6-4 — Noto Serif: download from Google Fonts to Hetzner

**Decision**: NotoSerif-Regular.ttf and NotoSerif-Bold.ttf are downloaded to
`public/fonts/` on the Hetzner server. Not committed to git (too large; already
gitignored as *.ttf? — check .gitignore).

**Why**: User chose "Download NotoSerif fonts" option during Wave 6A planning.
Adds a real serif alternative to Times New Roman with full Unicode support.
