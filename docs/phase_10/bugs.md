# Phase 10 — Known Bugs & Fixes

> Read before touching related code. The same issue may have been solved before.

## Known limitations (won't fix without a reproducer)
- **Issue 5 — PDF→JPG block glyphs.** Some PDFs whose fonts are **not embedded** or use
  **CID/Identity encoding** may render as block glyphs (████) in PDF→JPG. Investigated on
  Hetzner (Wave 10C): the host already has DejaVu+Noto fonts and `fontconfig`, and PyMuPDF
  renders with its **own bundled fonts** (it does NOT consult system fontconfig) — so
  installing system fonts does **not** help. The public SlicedInvoices sample renders
  correctly (its fonts are subset-embedded), so the failing input is a specific file we
  don't have. **Cannot fix without the actual test PDF.** Revisit when a reproducer is
  provided; likely needs a code-level fallback in `cmd_pdf_to_jpg` (`server/services/pdf-tools.py`)
  and/or a `pymupdf` upgrade — not a font install.

## Resolved
- **Issue 1 — Compress PDF broken.** Removed from UI (Wave 10A, hidden via `available:false`
  + route redirect). Not re-enabled — needs a full rewrite (out of scope).
- **Issue 2 — PDF→Word "500" on slide-deck PDFs.** Investigated on Hetzner (Wave 10C):
  could not reproduce a 500 — the route already returns a friendly **502**
  ("Conversion failed…") for failures (the user's 500 came from the stale Phase 8 deploy).
  Hardened anyway: `server/services/libreoffice.ts` now sets `maxBuffer` on the soffice
  exec and throws `ConversionUnsupportedError` when no/empty `.docx` is produced;
  `server/routes/convert.ts` logs failures (`console.error`, so they appear in journald)
  and maps the typed error to a clearer message ("…may be a slide deck, scanned image, or
  protected file."). Status stays 502.
