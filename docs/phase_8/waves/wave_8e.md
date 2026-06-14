# Wave 8E — Performance, Toolbar UX, Audit

## Status: IMPLEMENTATION COMPLETE — GATE pending user verification

## Goal
Zero overlap issues, no memory leaks, single-active dropdown, performance sanity,
toolbar UX final pass. No new features — closing cleanup wave of Phase 8.

## Audit findings (honest baseline)
The editor was already in much better shape than CLAUDE_8.md §4 Wave 8E assumes:
- **Tooltips:** already present — every toolbar `TBtn` has a `title` attribute.
- **Disabled states:** already comprehensive (selection / session / undo-redo / text-mode).
- **Error toasts:** already wired on save / upload / link / duplicate.
- **Memory leaks:** none found. All 15 window/document event listeners, both
  `URL.createObjectURL` calls, all `requestAnimationFrame`, and all `setTimeout` /
  `setInterval` have proper cleanup. Two negligible fire-and-forget timeouts
  (BottomSheet close-anim, LinkDialog focus) — not leaks.
- **Z-index:** a coherent 13-layer scheme already existed (1→100) with no overlaps.

## Changes shipped
1. **Single-active dropdown** (`EditorToolbar.tsx`) — replaced `shapesOpen` /
   `stampOpen` / `marksOpen` with one `openMenu` value + a click-outside/Esc effect
   guarded by `menuWrapRef` (Row 1). Opening one closes the rest; outside-click / Esc
   closes the open one. `linkOpen` (modal dialog) left as a separate boolean. Mobile
   (`MobileToolbar`) already used a single `sheet` value — unchanged.
2. **Save in-flight state** (`index.tsx`) — `savingRef` synchronous re-entry guard +
   `saving` state; Save/Download disable while saving, primary button shows
   `Spinner` + "Saving…". New i18n key `saving` (EN/TR/RU).
3. **Z-index — light touch** — no renumber. Verified snap guides (`z=1`) stay visible
   during drag (below the `z=100` dragged block, above the PNG + static blocks).
   Added a z-index hierarchy legend comment to `index.tsx`.

## Out of scope (deliberate)
- No global `activeDropdown` in editorStore (local state sufficient).
- No broad z-index renumber to the spec table (current scheme works).
- No speculative memo/perf rewrites (snap already rAF-throttled; no measured jank).
- Find & Replace performance gate skipped (F&R removed from UI in 8D).

## GATE 8E (verify before commit)
- [ ] Only one dropdown open at a time; outside-click / Esc closes it
- [ ] Stamp-on-text stacking correct; snap guide visible during drag
- [ ] Heap doesn't grow after open/edit/save ×5
- [ ] Drag with 50 blocks smooth; 50-page nav smooth
- [ ] Save shows "Saving…" + disables; no double-fire
- [ ] Tooltips present on all desktop toolbar buttons
- [ ] New string renders EN/TR/RU
- [ ] `bun run build` green ✅ (done)

## See CLAUDE_8.md §4 Wave 8E for full spec.
