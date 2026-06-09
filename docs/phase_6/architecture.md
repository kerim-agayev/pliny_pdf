# Phase 6 — Architecture Notes

## Text Move (Wave 6A)

Move is tracked client-side in `editorStore.blockPositions: Record<string, {x,y}>`,
parallel to `blockSizes` (resize). No undo support (same as resize).

On save, the moved position is included in `BlockChange.{x,y}` (top-left, PDF
points). The `/save` route passes it through as `Change.{x,y}`. `saveSession`
reconciles `x`/`y` for add-text blocks (updates structural op). For existing PDF
blocks, `_apply_edit` computes `baseline_y = y + baseline_offset` from the
geometry map and uses that as the insert point.

## Bold/Italic Fix (Wave 6A)

Root bug: `_apply_edit` used `change.get("text", "")` which erased text when only
bold/italic was changed. Fix: geometry map now stores `"text"` and `_apply_edit`
uses `change.get("text") or g.get("text", "")` as fallback.

Bold/italic are also reconciled for add-text blocks in `saveSession` (were
previously missing from the reconcile loop).

## More Fonts (Wave 6A)

`_insert_text` now checks `_is_explicit_noto(font_name)` first. If true, routes
to the matching Noto TTF regardless of whether the text needs Unicode. The
existing `_needs_unicode` auto-fallback still applies for non-Noto fonts.

Font name → TTF mapping:
| Frontend name | TTF file | PyMuPDF fontname code |
|---|---|---|
| Noto Sans | NotoSans-Regular / Bold | "noto" / "notob" |
| Noto Serif | NotoSerif-Regular / Bold | "notser" / "notseb" |
| Noto Sans Mono | NotoSansMono-Regular | "notomono" |
