# Phase 10 — Known Bugs & Fixes

> Read before touching related code. The same issue may have been solved before.

## Open (scheduled later in Phase 10)
- **Issue 2 — PDF→Word 500 on slide-deck PDFs.** Gotenberg/LibreOffice fails on some
  notebook/slide-deck PDFs. Backend (Hetzner). Wave 10C.
- **Issue 5 — PDF→JPG block characters.** Non-embedded / CID-encoded fonts render as
  █████ via PyMuPDF `get_pixmap`. `server/services/pdf-tools.py`. Wave 10C.

## Resolved
- **Issue 1 — Compress PDF broken.** Removed from UI (Wave 10A, hidden via `available:false`
  + route redirect). Not re-enabled — needs a full rewrite (out of scope).
