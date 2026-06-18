# Wave 10C — Backend Bug Fixes

Issues: 2 (PDF→Word slide-deck 500), 5 (PDF→JPG block characters). Hetzner deploy.

## Tasks
- [x] PDF→Word slide-deck "500" — investigated on Hetzner; **no conversion bug**.
- [x] PDF→JPG font blocks — investigated; documented as known limitation (no reproducer).
- [x] Deploy to Hetzner.

## Findings (investigated live on Hetzner)
- **Prod was stale at Phase 8 (`b3d8b8a`)** — backend had not been redeployed since Phase 8.
  Deploy fast-forwarded through Phase 9+10 backend changes (page caps / `officeMax*`).
- **PDF→Word is not broken.** The reported slide-deck (`Hiçlik_Felsefesi…`, 14 pp, 18.7 MiB,
  landscape) **converts fine** — valid 20 MB `.docx` in ~25 s (direct `pdfToWord`). The "500"
  came from the **pre-deploy Phase 8 code** (looser `cloudMaxBytes` anon=20 MB, no page cap,
  no `maxBuffer`). On current code an anon user gets a clean **413 fileTooLarge** (anon office
  limit = 15 MB) *before* conversion; a logged-in (free, 50 MB) user converts successfully.
  Never a 500.
- **Block-glyph PDF→JPG** could not be reproduced: host already has DejaVu+Noto+fontconfig,
  and PyMuPDF renders with its **own bundled fonts** (ignores system fontconfig) — a font
  install is a no-op. The public SlicedInvoices sample renders correctly. Documented as a
  known limitation in `bugs.md`.

## Changes shipped
- `server/services/libreoffice.ts` — `maxBuffer: 10 MB` on the soffice exec; verify the
  `.docx` exists/non-empty (`test -s`) and throw typed `ConversionUnsupportedError` if not.
- `server/routes/convert.ts` — `console.error` on conversion failure (now visible in
  journald); map `ConversionUnsupportedError` → "This PDF couldn't be converted to Word. It
  may be a slide deck, scanned image, or protected file."; status stays 502.
- `server/index.ts` — hardened Elysia `.onError`: log uncaught errors to journald + return a
  friendly JSON body (400 for VALIDATION, 500 `serverError` otherwise) instead of a bare 500.
- `deploy/README.md` — documented Python/PyMuPDF install + the font caveat.
- Decision: keep anon `OFFICE_MAX_MB` = 15 MB (user choice) → oversized decks get a friendly
  413, not a conversion attempt.
- Commits: `85022c8` (robustness edits) + `587d4b8` (onError hardening). Deployed to Hetzner.

## GATE 10C — PASSED ✅ (2026-06-18)
- [x] PDF→Word: converts (logged-in) or clean friendly 413/502 — never 500 on current code.
- [x] PDF→JPG: documented as known limitation (no test file; font install confirmed a no-op).
- [x] `bun run build` green.
- [x] Hetzner deployed (HEAD `587d4b8`, health OK; validation→400, oversized→413 verified).
