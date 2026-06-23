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

## 11A — Live preview stays white until save
Frontend mask div stays white during editing; the re-rendered PNG shows the
correct color after save. Live WYSIWYG folds into 11B with the eyedropper/color
UI. (User-confirmed: backend only.)
