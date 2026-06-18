# Phase 10 — Known Bugs & Fixes

> Read before touching related code. The same issue may have been solved before.

## Known limitations / accepted regressions
- **/edit-pdf Lighthouse Performance 84 (Wave 10D).** Down from Phase 9 baseline 94; below the
  ≥90 target. The editor route is the heaviest page (pdfjs-dist + canvas + fabric). Accepted by
  the user at GATE 10D as a non-blocking known regression — **not** a launch blocker. Other pages
  improved/held (Homepage 91→96, /tools 97). Revisit as a Phase 11 candidate (lazy-load fabric,
  defer pdfjs worker, code-split the editor). A11y 96 / BP 100 / SEO 100 on the page are fine.

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
- **Issue 2 — PDF→Word 500 on slide-deck PDFs.** REAL root cause (Wave 10C, `746f976`):
  **non-ASCII filename in `Content-Disposition`.** The deck `Hiçlik_Felsefesi…` converts fine,
  but `fileResponse` in `convert.ts` set a raw `filename="Hiçlik…docx"` — HTTP headers must be
  ASCII, so `new Response()` threw a `TypeError` AFTER conversion, outside the try/catch →
  uncaught 500. Fixed by using the shared `attachmentDisposition()` helper (RFC 5987) in
  `convert.ts` + `ocr.ts` (tools/editor routes already used it). Verified Turkish-named PDF
  → 200. NB: this only bit logged-in users (anon is capped at 15 MB and 413s before
  `fileResponse`), which initially masked it.
  - Also hardened this wave: `libreoffice.ts` `maxBuffer` + typed `ConversionUnsupportedError`
    on empty output; `convert.ts` `console.error` logging + clearer 502 message; `server/index.ts`
    `.onError` now logs uncaught errors + returns a friendly JSON 500/400 body (this is what
    surfaced the root cause).
