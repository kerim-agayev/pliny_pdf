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

## B11-4 — /edit-pdf Lighthouse Performance < 90 (Wave 11D) — ACCEPTED
Measured 66 (mobile, prod) this run; 84 at GATE 10D — high run-to-run variance.
Root cause: LCP (4.7s) is the client-rendered empty-state H1, gated by the
`ssr:false` editor chunk; "unused JS 356 KiB" is inside that chunk. Both need a
risky editor SSR refactor (excluded by the 11D plan). The only other lever
(legacy JS via modern browserslist) drops older-browser support → unsafe for the
global/CIS audience. Accepted as a non-blocker per the pre-authorized decision;
LCP refactor deferred to a future phase.
