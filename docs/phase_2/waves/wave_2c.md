# Wave 2C — OCR PDF (one cloud tool)

Status: **pending** (starts after Gate 2B).

## Scope
`ocr-pdf` — `type: "cloud"`. Hetzner backend, Tesseract (`tesseract-ocr` + eng/tur/rus
language packs) via `Bun.spawn`. Split PDF → images (Gotenberg) → tesseract per page →
re-embed invisible text layer with pdf-lib → searchable PDF back.

## Backend (CLAUDE_2.md §6)
1. SSH Hetzner (49.13.119.27): `apt install -y tesseract-ocr tesseract-ocr-eng
   tesseract-ocr-tur tesseract-ocr-rus`; verify `tesseract --list-langs`.
2. `server/services/ocr.ts` — page-by-page Tesseract, re-embed text layer.
3. `server/routes/ocr.ts` — POST `/api/ocr` (multipart PDF + language), auth-optional.
4. Upstash keys: `ocr:anon:<ip>:<date>` (3/day), `ocr:user:<id>:<date>` (free 10/day, Pro 100/day).
5. `server/index.ts` — wire route.

## Frontend
`lib/tools.ts` (cloud), `app/[locale]/ocr-pdf/page.tsx` + `components/tools/OcrPdf.tsx`
(dropzone + language picker default = locale + progress bar + download). No design needed.

Gate 2C: scanned PDF (text selectable after), text PDF passthrough, Turkish scanned
(`tur`), mobile, rate-limit (4th anon blocked).
Commit: `feat(tools): Wave 2C — OCR PDF (Tesseract on Hetzner)`.
