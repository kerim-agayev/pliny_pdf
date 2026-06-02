# Phase 3 — Bugs

(One entry per bug found this phase: symptom → cause → fix → status.)

## [2026-06-02] Gate 3B — "local tools show Max 25 MB badge" — NOT REPRODUCED
- **Symptom reported:** local tools (compress-pdf, merge-pdf) showed "Max 25 MB" instead of 100 MB.
- **Investigation:** code is correct — `FileDropzone` defaults `maxSizeMB = LOCAL_MAX_MB` (100);
  only the 3 cloud tools pass an override. Curled the running dev server (:3000):
  compress-pdf/merge-pdf/rotate-pdf → "Max 100 MB"; ocr-pdf/pdf-to-word → "Max 25 MB" (anon). Correct.
- **Root cause:** stale browser tab / Turbopack hot-reload state from when the badge first
  appeared mid-edit. No code defect.
- **Resolution:** hard-refresh the tab. No code change. Status: CLOSED (not a bug).

## [2026-06-02] Gate 3B — "26 MB file accepted on local tool" — WORKING AS INTENDED
- Local limit is 100 MB; 26 MB < 100 MB is correctly accepted. Test instruction was misphrased.
  Status: CLOSED (not a bug).
