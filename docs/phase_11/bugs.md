# Phase 11 — Bugs

## B11-1 — White mask on colored background (Wave 11A) — FIXING
Editing existing text redacts the old text and fills with hardcoded white
(`pdf-editor.py:217`, `add_redact_annot(rect, fill=(1,1,1))`). On gray zebra
rows / colored cells / images this leaves a white rectangle.
Fix: sample the real page background behind the bbox, use it as the redaction
fill; white fallback when not a flat color.
Repro: user's account-requisites PDF (gray zebra rows).
