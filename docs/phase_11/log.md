# Phase 11 — Log

## [2026-06-23] Phase 11 start + Wave 11A investigation
- Created `docs/phase_11/` tree.
- Investigated Edit PDF architecture (see architecture.md): editor shows
  server-rendered PNGs + DOM overlays; text edit = PyMuPDF redact-then-redraw;
  mask hardcoded white at `pdf-editor.py:217`; no sampling exists.
- Decision: Wave 11A = backend PyMuPDF background sampling (Option B), flat
  median fill with white fallback. Backend-only (user-confirmed).
- Implemented `_sample_bg_color` + `_redact_rect(fill)` + pristine sample doc in
  `cmd_apply`/`_apply_edit`. Self-check `test_sample_bg.py` green; `bun run
  build` green.
- GATE 11A engine check on real REKVIZIT.pdf: 15 gray-row blocks sample uniform
  0.92 gray (not white), 26 white blocks stay white, 0 false fallbacks, page
  unrotated. End-to-end edit of "Valyuta" gray row → rendered patch 0.918 gray.
  PASS. Pending: Hetzner deploy + visual confirm in editor UI.

## [2026-06-23] Wave 11A frontend live-preview mask
- Backend gate passed but the LIVE EDITOR still showed white masks (frontend
  `TextBlock.tsx` `#fff` mask div) — backend-only wasn't enough; users judge by
  the editor. Pulled the frontend tint forward from 11B.
- `_page_blocks` now attaches `bgColor` per block (same `_sample_bg_color`);
  `TextBlock.tsx` mask uses `block.bgColor ?? "#fff"`. No new API calls — reads
  existing parse JSON. `bgColor` optional (locally-added text → white).
- Verified: parse on REKVIZIT emits `#eaeaea` for 15 zebra rows; `bun run build`
  green. Pending user confirm of the live editor before GATE 11A pass.

## [2026-06-23] Wave 11A move fix (gray no longer travels)
- Moving a gray-row block dragged the gray with the text (live editor). Cause:
  the bgColor tint was applied to the moving root div, not just the ghost mask.
  Fix (`TextBlock.tsx`): root div bg → transparent when moved; ghost (original
  bbox) keeps the gray. Backend already correct (redacts original bbox only).
  Edit-in-place still tints (grow case). `bun run build` green; frontend-only
  (Vercel auto-deploy). Pending user confirm move matches Sejda.

## [2026-06-23] Wave 11A delete fixes
- Delete left an empty selectable placeholder: `deleteBlock` only flags
  `deleted:true`; `TextBlock` hid the text but still rendered the interactive
  root. Fix: `TextBlock` early-returns for deleted → renders ONLY the ghost mask
  (covers stale PNG text with sampled bg), no interactive root. (Filtering the
  block out would drop the mask and re-expose old text — avoided.)
- Added keyboard Delete/Backspace on a selected block: extended the existing
  annotation delete handler in `EditorCanvas` (`s.selectedBlock && !s.editingBlock
  → s.deleteBlock`), reusing the input/contentEditable typing guard. Mirrors the
  Annotate-PDF pattern. `bun run build` green; frontend-only (Vercel auto-deploy).

## [2026-06-23] GATE 11A PASSED ✅ — Wave 11A COMPLETE
- User confirmed all tests green: colored-bg mask, white-bg unchanged, gradient
  fallback, move (gray stays put), delete (no empty placeholder) + keyboard
  Delete/Backspace.
- Commits: `a66bc80` (backend sampling), `338dca3` (live-mask tint), `59a014d`
  (move fix), `4334ec2` (delete fix + keyboard delete).
- Next: Wave 11B — manual color picker/eyedropper + font matching + AZ/TR/RU
  character support. Not started.

## [2026-06-24] GATE 11B PASSED ✅ — Wave 11B COMPLETE
- Shipped Part A (manual bg color + full-canvas eyedropper), Part B (font
  matching → 6 families), Part C (Noto @font-face preview parity + never-tofu
  selftest). Then 8 bug-fix rounds on the manual-bg highlight geometry:
  - r2 schema/`modified` flag + apple-icon 404; r3 50pt-floor width, line-grouping
    delete fix, proxy.ts matcher; r4 highlight semantics (ghost=sampled, manual
    highlight sized to current text via `_text_width`); r5 finished r4 frontend +
    dropped floor; r6 descenders/true-shrink/move-with-text; r7 z-index tiers
    (PNG -3 / ghost -2 / frame -1) so a colored block survives over another
    block's ghost in the UI; r8 backend two-phase apply (`_redact_edit` all →
    `apply_redactions` per page → `_draw_edit` all) so a colored block moved onto
    another moved block's original spot isn't erased in the saved PDF.
- `pdf-editor.py selftest` now also guards the redact/draw ordering (renders a
  moved red block, asserts the red pixel survives). Both selftests green.
- Final commits: `cadf462` (r6), `3b6c931` (frame padding + debug-log removal),
  `2e6adee` (r7 z-index), `d08c70f` (r8 ordering). Hetzner redeployed (health OK).
- User confirmed: saved PDF matches the editor, no 11A regression.
- Next: Wave 11C — color & alignment fidelity. Not started.
