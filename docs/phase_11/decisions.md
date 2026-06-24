# Phase 11 — Decisions

## 11A — Backend sampling (Option B)
Chose backend PyMuPDF sampling over frontend canvas (A) or glyph-only redaction
(C). Reason: the saved PDF is the bug; sampling the same PyMuPDF pixmap that
produces the output guarantees the mask matches. A only fixes the live preview
and duplicates logic; C is more complex.

## 11A — Flat-color fill with white fallback
Mask uses a single sampled median color. If the background isn't uniform
(gradient/image/border/watermark → high variance) we fall back to white — never
worse than today. Per-region / gradient fills deferred to 11B/11C.

## 11A — Sample from a pristine copy
`cmd_apply` opens a second `original.pdf` purely for sampling, so earlier white
redactions in the same save can't contaminate later samples (multi-row zebra
tables edit many labels at once).

## 11A — Find-replace left white
`_apply_find_replace` keeps the white mask. F&R was removed from the UI in
Wave 8D (dormant), so changing it adds risk for no user-visible benefit.

## 11D — Most "uneditable detection" was already shipped
Scanned (parse `scanned` flag → `phase:"scanned"` modal), encrypted
(`needs_pass` → PasswordModal), and multi-column isolation (per-blockId
two-pass redact/draw) were all already built by Waves 11A/11B and earlier
phases. 11D only added the missing text-over-image hint + verification + QA.

## 11D — Text-over-image hint via `block.bgColor === null`
The server already distinguishes flat-bg (hex) from sample-failed (null) from
locally-added (key absent → undefined). So the hint keys off `=== null`
exactly — no new backend field needed. Hint is passive (amber ring+tooltip on
desktop, text line on mobile), never a modal, so it can't block the flow.

## 11D — Rotated pages: verified correct, no derotation fix
Empirically tested on a real 270° PDF: PyMuPDF maps both redaction and
`insert_text` correctly there, so edits land in place. The plan's "test first,
fix only if broken" path resolved to no-change. `_sample_bg_color` still bails
to white on rotation (placement is fine; flat-bg *sampling* on a rotated page
is the part that's unreliable).

## 11D — Performance accepted, not chased
The wave's perf premise (fabric+pdfjs load on mount) was stale — both are
already lazy/absent on `/edit-pdf`. The real ceiling is LCP from the
`ssr:false` editor, fixable only by a risky SSR refactor the plan excluded.
Tightening browserslist for the 33 KiB legacy-JS win would drop older-browser
support for the global/CIS audience — unsafe. Accepted 84 as a non-blocker
(per GATE 10D precedent + the user's pre-authorized decision).

## 11A — Live preview stays white until save
Frontend mask div stays white during editing; the re-rendered PNG shows the
correct color after save. Live WYSIWYG folds into 11B with the eyedropper/color
UI. (User-confirmed: backend only.)
