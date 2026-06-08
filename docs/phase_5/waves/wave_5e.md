# Wave 5E — Edit PDF improvements ✅ DONE (GATE 5E passed 2026-06-08, user-confirmed)

Improvements deferred from Phase 4. See CLAUDE_5.md §4 Wave 5E.

- **5E-1** — font/size/color controls live when `tool === "text"` (`EditorToolbar.tsx`,
  `fmtEnabled = enabled || textMode`); chosen styling already reached `addText`. Draft
  input previews the chosen font (`cssFont` exported from TextBlock).
- **5E-2** — `addLocalBlock` store action pushes the new block into `pages[].textBlocks`
  + auto-selects (switches to Select); `commitDraft` calls it after `addText` returns
  `{ blockId }` (approx bbox via offscreen-canvas `measureTextWidth`).
  **Backend `saveSession`** merges edits/deletes of `add-…` blockIds into the preserved
  add-text op (the pristine-PDF geometry map can't resolve them) — TS-only, **needs
  Hetzner deploy**.
- **5E-3** — store `blockSizes` + `resizeBlock`; resize is rAF-smoothed, Shift locks the
  starting aspect, min 50×20px, dashed outline during drag. **Visual-only** (no w/h in
  `BlockChange`; server ignores block width).

GATE 5E: custom-styled Text+ saves correctly; added block selectable + editable +
deletable in the same session (after backend deploy); smooth aspect-lockable resize.
`bun run build` green; `tsc --noEmit` clean.

## Decisions
- 5E-2 required a backend change + Hetzner deploy (user-approved) for added-block
  edit/delete to persist on save — not achievable frontend-only.
- After placing new text: switch to Select + auto-select the block (user-approved).

## GATE-run bug fixes (commit d0a5d79)
- **Times Base-14 code:** `_BASE14["times"]` regular was `"times"` (invalid) → `"tiro"`.
  Caused a 502 on add-text/save for Times blocks ("need font file or buffer").
- **Underline (Bug 3):** added `s.underline` + `blockStyles`; U button → `setFormat`;
  TextBlock applies `text-decoration`.
- **Alignment (Bug 4):** persisted per block in `blockStyles`; TextBlock applies `text-align`.
  Both underline + alignment are **visual-only** (not sent on save).

## Deferred to Phase 6 (design decisions, not bugs — see bugs.md)
- Resize text overflow when the box shrinks (resize is visual-only by design).
- Minimum-size width/height values swapped (50/20 → 20/50).

**User-confirmed GATE 5E green (2026-06-08).**
