# Wave 10C — Backend Bug Fixes

Issues: 2 (PDF→Word slide-deck 500), 5 (PDF→JPG block characters). Hetzner deploy.

## Tasks
- [x] PDF→Word slide-deck "500" — investigated on Hetzner; **no conversion bug**.
- [x] PDF→JPG font blocks — investigated; documented as known limitation (no reproducer).
- [x] Deploy to Hetzner.

## Findings (investigated live on Hetzner)
- **Prod was stale at Phase 8 (`b3d8b8a`)** — backend had not been redeployed since Phase 8.
  Deploy fast-forwarded through Phase 9+10 backend changes (page caps / `officeMax*`).
- **REAL ROOT CAUSE of the PDF→Word 500: non-ASCII filename in `Content-Disposition`.**
  The reported deck (`Hiçlik_Felsefesi…`, 14 pp, 18.7 MiB) **converts fine** (~25 s, 20 MB
  docx). But the user is a **logged-in (free, 50 MB) user**, so it passes the size check,
  converts, then `fileResponse` in `convert.ts` set a **raw** `Content-Disposition:
  attachment; filename="Hiçlik…docx"`. HTTP header values must be ASCII — the `ç` makes the
  header invalid and `new Response(...)` throws a `TypeError` **after** a successful
  conversion. That throw is **outside** the route try/catch → escaped to Elysia → **raw 500**.
  (My earlier anon tests showed 413 only because anon is capped at 15 MB and never reached
  `fileResponse`; that masked the real bug.) The bug was surfaced by the `.onError` logging
  added earlier this wave: `TypeError: Header '17' has invalid value … at fileResponse
  (convert.ts:48)`.
- The shared `attachmentDisposition()` helper (`server/routes/http.ts`) already RFC 5987-
  encodes non-ASCII names and is used by `tools.ts` (PDF→JPG) + `editor.ts` — but `convert.ts`
  and `ocr.ts` had their **own inline `fileResponse`** with the raw filename. Fixed both to
  use the helper. Verified: Turkish-named PDF → **HTTP 200**, header
  `filename="Hiclik…"; filename*=UTF-8''Hi%C3%A7lik…`, no errors in journald.
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
- `server/routes/convert.ts` + `server/routes/ocr.ts` — use shared `attachmentDisposition()`
  (RFC 5987) instead of a raw inline `Content-Disposition` (the actual 500 fix).
- Commits: `85022c8` (robustness edits) + `587d4b8` (onError hardening) + `746f976`
  (Content-Disposition RFC 5987 fix — the real root cause). Deployed to Hetzner.

## GATE 10C — PASSED ✅ (2026-06-18)
- [x] PDF→Word: non-ASCII filename 500 fixed (RFC 5987 header); converts (logged-in) or clean
      friendly 413/502 — verified Turkish-named PDF → 200.
- [x] PDF→JPG: documented as known limitation (no test file; font install confirmed a no-op).
- [x] `bun run build` green.
- [x] Hetzner deployed (HEAD `587d4b8`, health OK; validation→400, oversized→413 verified).
