# Phase 11 — Bugs

## B11-1 — White mask on colored background (Wave 11A) — FIXING
Editing existing text redacts the old text and fills with hardcoded white
(`pdf-editor.py:217`, `add_redact_annot(rect, fill=(1,1,1))`). On gray zebra
rows / colored cells / images this leaves a white rectangle.
Fix: sample the real page background behind the bbox, use it as the redaction
fill; white fallback when not a flat color.
Repro: user's account-requisites PDF (gray zebra rows).
RESOLVED in Wave 11A (commit `a66bc80`); manual fallback + hint in 11B/11D.

## B11-2 — Text-over-image mask silently white (Wave 11D) — FIXED
When the bg auto-sample fails (text over image/gradient/watermark) the server
sends `bgColor:null` and the mask fell back to white with no signal to the user.
Fix: `editorStore` derives `bgSampleFailed` on selection; toolbars surface a
"pick a color / use the eyedropper" hint (`bgNoMatchHint`, EN/TR/RU). Verified
with a synthetic text-over-image PDF (gradient block → bgColor None → hint).

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
