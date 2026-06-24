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

## [2026-06-24] Wave 11C — text color preserved on save (implemented, gate pending)
- Investigation: 3 of 4 issues already correct from 11A/11B (origin/baseline
  captured). Alignment (`_draw_edit` uses `Point(g["origin"])`), baseline
  (insert_text point = baseline), multi-line leading (blocks are per source
  line → N/A) and width overflow (anchored, flows right — acceptable) need no
  change. Only color was broken.
- Bug: original text color is extracted (`block.color`) and shown in the live
  editor, but dropped on save — a plain retype sends only `{newText}`, geo had
  no color, and `_draw_edit` fell back to hard black → gray/colored labels
  turned black in the saved PDF.
- Fix (backend-only, `pdf-editor.py`): `_build_geometry_map` stores the packed
  `color` int; `_draw_edit` resolves `change.get("color") or
  _int_color_to_hex(g.get("color", 0))` for text + underline. Explicit toolbar
  color still wins; new add-text stays black-default.
- `cmd_selftest` gains a color-preservation guard (gray block, no explicit
  color → drawn glyphs read gray). All selftests green; `bun run build` green.
- Pending: Hetzner deploy + user visual confirm before GATE 11C pass.

## [2026-06-24] GATE 11C PASSED ✅ — Wave 11C COMPLETE
- User confirmed all tests green: edited gray label stays gray (no black
  fallback), black stays black, explicit color picker still wins, short/long
  replacements anchored at original x — no baseline/alignment drift.
- Commit `d5df213` (backend color fix + docs). Pushed to main; Hetzner pulled +
  `plinypdf-backend` restarted, health `{"ok":true}`.
- Alignment/baseline/line-height/width needed no code change (already correct
  from 11A/11B origin capture; multi-line leading N/A — per-line blocks).
- Next: Wave 11D — Uneditable detection + performance + final QA. Not started.

## [2026-06-24] Wave 11D — investigation: most detection already shipped
- Mobile audit (11A/11B/11C): all clear. Edit PDF shares the desktop code path;
  only the toolbar swaps (`MobileToolbar` ↔ `EditorToolbar`), both driving the
  same store. bgColor mask, ghost-mask-on-move, touch delete, bg picker,
  eyedropper, font prefill, 11C color — no mobile-only bypass. No fix.
- Scanned detection: already wired (backend `scanned` flag → store
  `phase:"scanned"` → modal w/ OCR redirect + Continue-anyway + i18n). No fix.
- Encrypted: already handled (`doc.needs_pass` → `passwordRequired` → in-browser
  PasswordModal). No fix.
- Multi-column: edits are per-blockId redact+draw, fully isolated (two-pass). No fix.
- Performance premise was stale: `/edit-pdf` doesn't load fabric at all; pdfjs is
  lazy (on upload, not mount); EditPdf is already `dynamic(ssr:false)` + SSR
  placeholder. Documented levers already done.

## [2026-06-24] Wave 11D — text-over-image hint (the one real gap)
- When auto-sampling fails (text over image/gradient) the server sends
  `bgColor:null` and the mask silently fell back to white. Added a hint.
- `editorStore.selectBlock`: derived `bgSampleFailed = block.bgColor === null &&
  no manual override` (`=== null` excludes locally-added text, which omits
  bgColor → undefined). `setFormat` clears it once a color is picked.
- Desktop `EditorToolbar`: amber ring + retitled tooltip on the bg swatch when
  failed (dense row → no inline string). Mobile `MobileToolbar`: amber hint line
  under the bg field. New i18n key `bgNoMatchHint` (EN/TR/RU).
- Verified on Hetzner with a synthetic text-over-image PDF: "TEXT OVER IMAGE"
  (gradient) → bgColor=None (hint fires); "TEXT ON WHITE" → #ffffff (no hint).
  `bun run build` green.

## [2026-06-24] Wave 11D — rotated page VERIFIED, no fix needed
- Tested user's REKVIZIT-rotated.pdf (rotation 270) on Hetzner via the real
  engine. First crude test mis-flagged it (compared to bbox*scale assuming
  display space — wrong space). Rigorous tests corrected it:
  - Identity re-type of all 25 blocks → only 2.5% of sampled pixels change
    (font-substitution/anti-aliasing noise) → text re-lands in place.
  - Single-block edit ("EDITED-LINE-12345") → renders exactly in the right row,
    correct orientation, old text cleanly removed (visual confirm).
- Conclusion: PyMuPDF maps redaction AND insert correctly here; edits land
  correctly on the 270° page. NO backend change → NO Hetzner deploy for rotation.

## [2026-06-24] Wave 11D — performance: measured, accepted (no safe win)
- Lighthouse (mobile, prod /edit-pdf): Performance 66 this run (vs 84 at GATE
  10D — large run-to-run/network variance). LCP 4.7s, TBT 370ms, CLS 0.166.
- LCP element = the CLIENT-rendered empty-state H1, not the SSR placeholder —
  meaningful paint waits for the `ssr:false` editor chunk. Fixing = SSR-ing the
  empty state = the risky editor refactor the plan excludes.
- Top opportunity "unused JS 356 KiB" lives in the editor chunk (same risky
  refactor). "Legacy JS 33 KiB" would need tightening `.browserslistrc` to
  modern-only — drops older-browser support for the global/CIS audience, so NOT
  a safe change for a launched product.
- Per the pre-authorized decision (accept if no safe win): accepted as a
  non-blocker (consistent with GATE 10D). LCP refactor deferred as a future item.
