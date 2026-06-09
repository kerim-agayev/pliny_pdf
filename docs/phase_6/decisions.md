# Phase 6 — Technical Decisions

## D6-1 — Noto Italic: silently fall back to regular weight

**Decision**: Italic for Noto fonts (Noto Sans, Noto Serif, Noto Sans Mono)
renders as regular weight in the saved PDF because NotoSans-Italic.ttf and
NotoSerif-Italic.ttf are not on disk.

**Why**: Downloading additional TTFs adds ~400KB each; italic support for these
fonts is low-priority for Phase 6. The CSS overlay still shows italic via
`font-style: italic` for the on-screen preview.

**Impact**: Users who select a Noto font + italic will see italic on screen but
regular in the downloaded PDF. Document in the known limitations section.

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

## D6-4 — Noto Serif: download from Google Fonts to Hetzner

**Decision**: NotoSerif-Regular.ttf and NotoSerif-Bold.ttf are downloaded to
`public/fonts/` on the Hetzner server. Not committed to git (too large; already
gitignored as *.ttf? — check .gitignore).

**Why**: User chose "Download NotoSerif fonts" option during Wave 6A planning.
Adds a real serif alternative to Times New Roman with full Unicode support.
