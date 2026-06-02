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

## [2026-06-02] Gate 3C — Bug 1: Balanced & High compress presets returned the original
- **Symptom:** 5 MB image PDF → Maximum 5→3 MB ✓; Balanced & High returned the original (no change).
- **Cause:** at 150/300 DPI the rasterized output of a screen-resolution PDF is *larger* than the
  original, so the never-inflate guarantee correctly returned the original — i.e. those presets
  could never beat the source. 300 DPI also made a 26 MB file take far too long.
- **Fix:** recalibrated DPIs to at/below screen resolution so all three reliably compress and stay
  ordered — max 72 DPI/q0.35, balanced 96 DPI/q0.55, high 120 DPI/q0.72. Logic unchanged; never-inflate kept.
  Status: FIXED (pending re-test). Big-file speed also improves (fewer pixels).

## [2026-06-02] Gate 3C — Perf: heavy raster tools could hang on large PDFs
- **Symptom:** a 26 MB PDF in Compress took so long the user aborted; grayscale similarly heavy.
- **Cause:** both tools rasterize every page on the main thread.
- **Fix:** added per-tool caps enforced in `onFiles` before processing — Grayscale ≤10 MB/≤100 pages,
  Compress ≤50 MB/≤300 pages — with localized `toast.error`. See decisions.md. Proper off-main-thread
  fix comes in Wave 3G (web workers). Status: FIXED (pending re-test).

## [2026-06-02] Gate 3C — Bug 2: Grayscale returned the original (still in color, same size)
- **Symptom:** grayscale downloaded the same file — same size, still color.
- **Cause:** for a small/vector color PDF the grayscale raster inflates, so the never-inflate
  guard returned the *color* original — defeating the tool's whole purpose.
- **Fix:** grayscale now ALWAYS returns the converted (grayscale) file; if it ends up larger than
  the original, the UI shows a warning toast (`sizeGrew`) instead of silently handing back color.
  Conversion is the deliverable, not shrinkage. Status: FIXED (pending re-test).
