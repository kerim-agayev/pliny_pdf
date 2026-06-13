# Wave 8C — Smart Auto-Resize Text Blocks

## Status: DONE ✅ (GATE 8C passed 2026-06-14)

## Goal
Text blocks adapt their dimensions to content automatically.
Alignment buttons reposition the block on the page (left/center/right).

## What shipped
- **New helper** `lib/editor/textMeasure.ts` — holds `cssFont` (single source of
  truth for the family map; re-exported by TextBlock).
- **Store** `lib/stores/editorStore.ts` — added `blockSizes: Record<id,{w,h}>`
  override map + `setBlockSize` action (does NOT push undo; size is derived from
  content). `blockSizes` is captured in Snapshot + restored on undo/redo/reset.
- **TextBlock.tsx** — content-derived box size; alignment-as-position; the bug-fix
  iterations below.
- **EditorCanvas.tsx** — passes `size`, `pageWidth`, `onResize` to each TextBlock.
- **EditorToolbar.tsx** — alignment buttons reposition the selected block via the
  existing `moveBlock` pipeline (left=36 / centered / right margin); active-button
  highlight derived from the block's actual x-position.

## Decisions
- **Frontend-only, no Hetzner deploy.** Backend renders text point-based
  (`insert_text`) and re-extracts fresh bboxes on reopen, so block w/h is a purely
  client-side concern and never needs to be persisted. CLAUDE_8.md's "backend may
  need changes" did not apply.
- **Alignment repositions immediately on click** (not deferred to Save), reusing
  `moveBlock` → `blockPositions` → save-`x` → `_apply_edit` reposition.

## Bug-fix journey (GATE 8C took several rounds)
The initial canvas-`measureText` approach was fundamentally broken; rewritten to
DOM measurement. Key fixes:
1. **Canvas → DOM measurement.** `measureText` underestimates real layout, causing
   edit-mode text to wrap. Replaced with a hidden measurement mirror div.
2. **White mask decoupled from content box.** Mask pinned to the ORIGINAL bbox
   (`origW × origH`) so shrinking text doesn't leak the baked PNG text.
3. **Alignment active-state** derived from position, not a stored flag.
4. **Re-measure in display mode** (hidden mirror), so font/size/bold changes resize
   the box immediately without re-entering edit mode.
5. **Phantom trailing newline** from `contentEditable.innerText` stripped
   (`.replace(/\n+$/,"")`) so a blank line can't permanently inflate height.
6. **`white-space: pre`** on mirror + editable → no soft-wrap; long line grows RIGHT,
   not down. Width clamped to page in JS.
7. **Height from font metrics, not DOM** — `fontSize * 1.15 * lineCount` — tight to
   the line pitch so the box never covers the block below.
8. **Zeroed vertical box padding/margin** (`padding: "0 3px"`, `margin: "0 -3px"`) —
   the old `2px` vertical padding (content-box) added ~4px and spilled into the row
   below.

## See CLAUDE_8.md §4 Wave 8C for the original spec.
