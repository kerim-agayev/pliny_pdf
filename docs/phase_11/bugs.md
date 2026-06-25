# Phase 11 — Bugs

## B11-1 — White mask on colored background (Wave 11A) — FIXING
Editing existing text redacts the old text and fills with hardcoded white
(`pdf-editor.py:217`, `add_redact_annot(rect, fill=(1,1,1))`). On gray zebra
rows / colored cells / images this leaves a white rectangle.
Fix: sample the real page background behind the bbox, use it as the redaction
fill; white fallback when not a flat color.
Repro: user's account-requisites PDF (gray zebra rows).
RESOLVED in Wave 11A (commit `a66bc80`); manual fallback + hint in 11B/11D.

## B11-2 — Text-over-image hint never fired on OCR'd PDFs (Wave 11D) — FIXED
First cut keyed the hint off `bgColor === null`. But `_sample_bg_color` only
returns null on HIGH variance (>25% of the frame differs). OCR text over a
scan/photo samples a LOCALLY FLAT frame (e.g. dark comic artwork → solid
`#1a1a1a`), so it returns a color, not null → the hint never showed (user report).
Root cause: wrong signal. "Text over image" is structural, not a color-variance
property — and the engine never checked for images.
Fix: backend `_page_blocks` collects dict type-1 (image) block rects and sets
`overImage = text bbox intersects any image rect`. Frontend fires the hint when
`block.bgColor === null || block.overImage === true` (no manual override yet).
Verified on Hetzner: OCR-over-comic text → `bgColor #1a1a1a, overImage True →
hint fires`; gradient (vector) text → `bgColor None → fires`; plain text on
white → `#ffffff, overImage False → no fire`. Backend change → Hetzner deploy.

## B11-3 — Rotated page edits — NOT A BUG (Wave 11D verified)
Suspected misplacement of edits on rotated pages. Verified on REKVIZIT-rotated.pdf
(rotation 270): PyMuPDF maps both redaction and insert correctly — edits land in
place (identity re-type 2.5% pixel delta; single-block edit visually correct).
No code change. NB: `_sample_bg_color` still deliberately bails to white on
rotated pages (`pdf-editor.py:295`) — sampling, not placement, is the limitation.

## KNOWN LIMITATION — rotated-page background match
On rotated pages, edited-text masks fall back to white instead of sampling the
page background (`_sample_bg_color` returns None when `page.rotation`). Edits land
correctly; only the auto bg-match is disabled. Parity with Sejda/pdfFiller, which
also degrade on rotated scans. Manual bg color + eyedropper still work. Accepted.

USER-FACING NOTE (reconciled, Issue-4 QA round): rotated pages (90/180/270°) —
text edits are still *placed* correctly (B11-3), but the auto background-match
degrades (falls back to white). Manual bg color + eyedropper remain available.
Parity with Sejda/pdfFiller; rare use case; deferred to a future phase.

## B11-5 — "Text darkens on move" — font substitution, not color (FIXED)
Reported: moving a block darkens its text. Investigated by sampling the rendered
REKVIZIT header: original blue (14,164,247) vs moved (15,164,247) — IDENTICAL
(#009ff7). 11C color preservation is correct. The darkening is heavier glyph
WEIGHT: re-insertion substituted Noto Bold (bolder than the original font) → more
inked pixels → looks darker.
Fix (Wave 11D, `pdf-editor.py`): on a pure reposition/recolor (text + bold/italic
unchanged), re-draw using the PDF's own EMBEDDED font (`_embedded_fontfiles` +
`_insert_text_embedded`) so the weight matches exactly. Verified: embedded-TTF
move → glyph coverage ratio 0.999 (exact match); base-14 + text-change fall back
to Noto cleanly; all selftests pass.
RESIDUAL: base-14 fonts (e.g. Helvetica-Bold) aren't embedded, so AZ text in them
(the REKVIZIT header) still routes to Noto and stays slightly heavier — unavoidable
without the original font. Documented.
LIVE-UI follow-up (QA round): saved PDF is correct, but the editor still showed the
moved overlay heavier (DirectWrite renders the web font bolder than the PNG raster).
Mitigated frontend-only in `TextBlock.tsx`: `opacity: 0.85` on the MOVED overlay
span (+ font-smoothing hints) to drop its contrast toward the PNG. Moved-only so
edit-in-place color fidelity (11C) and the saved PDF are untouched. User: acceptable.

## B11-6 — Descenders clipped on move (Wave 11D) — FIXED
Moving a block clipped g/y/ğ/ş/ç by ~2-3px: the transparent root div's
`overflow:hidden` cut the overlay glyphs at the tight box height. Fix
(`TextBlock.tsx`): add a font-proportional bottom allowance (`descenderPad =
fontSize*0.18`) to the root height only; the visible frame + ghost stay at origH,
so no visible box spills into the next row.
QA-round follow-up: with a custom bg color the COLORED frame box (at origH) still
clipped the same tails — they sat below the box. Fix: extend the frame box height
to `origH + descenderPad` (DOWN only; top stays at blockTop) so the tails sit
inside the colored box. Ghost (white/sampled, old spot) left at origH. User: confirmed.

## B11-7 — Text shifts on double-click edit — FIXED (QA round, user-confirmed)
Entering edit on a PRISTINE block swaps the PNG-baked text for the DOM overlay,
whose baseline (lineHeight:1.12, top-aligned) doesn't match the PDF baseline →
small jump. (Already-edited blocks use the same overlay div in display + edit, so
they don't shift — confirms it's PNG-vs-DOM, not an edit-mode style diff.)
Fix (`TextBlock.tsx`): translate the overlay onto the PDF baseline using
`baselineOffset` from parse. The full delta `baselineOffset*scale − domAscent`
OVERSHOT down (web-font ascent < the original's; one real block measured offset
10.43px, domAscent 8px → 2.43px translate looked too low). Zero-shift sits between
the un-nudged UP shift (delta 0) and the full-correction DOWN shift, so apply HALF:
`(baselineOffset*scale − domAscent) * 0.5`. User confirmed zero shift on double-click.
Tunable single factor if a future font reveals a different sweet spot.

## B11-8 — Undo/redo breaks at a bg-color change (Wave 11D QA) — FIXED
Reported: undo/redo works until it reaches a background-color change, then stops —
won't undo that pick or anything before it. Root cause: the desktop manual color
control is a native `<input type=color>`, whose React `onChange` is bound to the
`input` event → fires on EVERY drag tick. Each tick called `setFormat` →
`editBlock`, pushing a fresh undo snapshot, so one pick flooded the stack with dozens
of near-identical entries; a few undos only peeled intermediate ticks and never
reached the real prior actions. (Mobile swatches + eyedropper push one clean entry
each — not affected.) The same latent flood existed on the desktop font-color input.
Fix (`editorStore.ts` + `EditorToolbar.tsx`): new `previewColor` pushes ONE pre-edit
snapshot on the first tick of a burst and only repaints on later ticks; `endColorBurst`
(toolbar fires it when the picker opens/blurs) bounds each pick to one undo step.
Swatches/eyedropper still use `setFormat`. Self-check `editorStore.test.ts` asserts
one drag = one undo step and that picks stay separately undoable. User confirms pending.

## B11-9 — Edit PDF empty state covered the footer (post-11D) — FIXED
The `/edit-pdf` upload/empty screen covered the full viewport and overlapped the
global footer (worst on mobile: on first load the footer flashed in covering ~half
the page, then vanished when the editor mounted). Only this tool had it.
Root cause: the empty state rendered inside the editor's full-screen takeover shell
`SHELL = {position:fixed; inset:0; zIndex:50}` (and the SSR LCP placeholder was
`position:fixed; inset:0`), both OUT of normal flow → `<main className="flex-1">`
collapsed and the always-rendered `<Footer/>` rode up under the navbar until the
fixed layer painted over it. Other tools keep their dropzone in normal flow.
Fix: switch ONLY the empty state (and its SSR placeholder) to normal document flow;
`loading`/`active`/`scanned`/`error` keep the takeover. `EditPdf/index.tsx` empty
branch → `<>`-wrapped `minHeight:70vh` flex-center wrapper (no `SHELL`), editor
`Header` dropped so the global navbar shows. `edit-pdf/page.tsx` placeholder → same
normal-flow wrapper, wrapped in new `SsrEmpty.tsx` (`"use client"`) that paints
server-side for LCP then self-removes after hydration (no double-render with the
client editor). `bun run build` green. User confirmed footer no longer covered on
desktop + mobile. Commit `33693b2`. Frontend-only (Vercel auto-deploy).

## B11-4 — /edit-pdf Lighthouse Performance < 90 (Wave 11D) — ACCEPTED
Measured 66 (mobile, prod) this run; 84 at GATE 10D — high run-to-run variance.
Root cause: LCP (4.7s) is the client-rendered empty-state H1, gated by the
`ssr:false` editor chunk; "unused JS 356 KiB" is inside that chunk. Both need a
risky editor SSR refactor (excluded by the 11D plan). The only other lever
(legacy JS via modern browserslist) drops older-browser support → unsafe for the
global/CIS audience. Accepted as a non-blocker per the pre-authorized decision;
LCP refactor deferred to a future phase.
