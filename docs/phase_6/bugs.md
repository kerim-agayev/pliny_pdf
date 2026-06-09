# Phase 6 — Known Bugs

## Bug A — Shape drag preview wrong (CRITICAL UX) — Wave 6D / 6A

**Status**: Fixed in Wave 6A

**Symptom**: Arrow, circle, line, and strikethrough all render as a generic dashed
indigo rectangle during drag. Only after mouse release do they become the correct
shape.

**Root cause**: `EditorCanvas.tsx:315–322` — the drag preview block has only two
branches (whiteout → WhiteoutPreview, everything else → generic dashed div). No
per-tool/per-shapeType rendering.

**Fix**: Add branches for highlight (translucent div), strike (SVG line at mid-y),
and each shape type (rect div, circle div, arrow/line SVG with barbs).

---

## Bug B — Resize: text overflows shrunk box — Wave 6A

**Status**: Fixed in Wave 6A

**Symptom**: When resizing a text block smaller using corner handles, the text
content renders outside the dashed border.

**Root cause**: Content `<div>` in `TextBlock.tsx` has `whiteSpace: "pre-wrap"`
but no `overflow: hidden`.

**Fix**: Add `overflow: "hidden"` to the content div style (~line 173).

---

## Bug C — Resize: min-width/height swapped — Wave 6A

**Status**: Already fixed (verified 2026-06-09 — code at TextBlock.tsx:101–102
already has `Math.max(50, …)` for width and `Math.max(20, …)` for height, which
IS the correct "should be" state from §2).

**CLAUDE_6.md §2** describes this as needing a fix, but Phase 5E appears to have
already applied the swap. No code change needed.
