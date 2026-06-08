# Wave 5E — Edit PDF improvements ✅ (GATE 5E passed 2026-06-08)

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
