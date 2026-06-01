# Wave 2C — OCR PDF (one cloud tool)

Status: **code complete — committed + pushed (build green, tsc clean) — pending Gate 2C
(Hetzner provisioning + test)**. Engine: **ocrmypdf** (user-approved over raw Tesseract).
Commit: `feat(tools): Wave 2C — OCR PDF (ocrmypdf on Hetzner)`.

## What shipped (code)
- Slug `ocr-pdf`, id `ocr-pdf`, ToolPages key `ocrPdf`, `cat: Convert`, `mode: cloud`,
  icon `IconScan`, accent `#60A5FA`. Catalog 27 → 28.
- **Frontend** (testable now for UI; backend needed to actually run):
  - `components/tools/OcrPdf.tsx` — dropzone + **language picker** (eng/tur/rus, default = locale)
    + progress + download. Mirrors `CloudConvertTool`, uses new `postFileForm` (file + `lang`).
  - `app/[locale]/ocr-pdf/page.tsx`, `lib/api.ts` (`postFileForm`).
  - 7 touch-points wired: icon, `lib/tools.ts`, `lib/seo.ts`, `lib/structured-data.ts`,
    `messages/{en,tr,ru}.json` (Tools.ocr-pdf + ToolPages.ocrPdf), page, component.
- **Backend**:
  - `server/services/ocr.ts` — `ocrPdf(input, lang)` spawns `ocrmypdf -l <lang> --skip-text
    --optimize 1` via temp files; `--skip-text` passes through already-text pages. `normalizeLang`
    whitelists eng/tur/rus. Binary path overridable via `OCRMYPDF_BIN`.
  - `server/routes/ocr.ts` — POST `/api/ocr` (multipart `file` + optional `lang`). Auth-optional
    (`getRequester`), rate-limited via **`checkServerTool`** (anon 3/day IP, free 10/day, Pro
    unlimited — reuses the existing server-tool limiter, see decisions.md), history for signed-in
    users only, best-effort R2 store. Wired in `server/index.ts` (`.use(ocr)`).
  - `.env.example`: `OCRMYPDF_BIN` documented.

`bun run build` green (28 routes × en/tr/ru, no MISSING_MESSAGE). `tsc --noEmit` clean (0 errors).

## Hetzner provisioning (REQUIRED before Gate 2C — manual, needs SSH)
The backend shells out to `ocrmypdf` on the host where Bun/Elysia runs. Install it:
```bash
ssh root@49.13.119.27
apt update && apt install -y ocrmypdf tesseract-ocr-eng tesseract-ocr-tur tesseract-ocr-rus
ocrmypdf --version && tesseract --list-langs   # verify eng/tur/rus present
```
(ocrmypdf pulls in tesseract-ocr + ghostscript + qpdf.) For **local** testing, install the same
on the dev box (Windows: WSL or a Linux VM; or test against the Hetzner backend by pointing
`NEXT_PUBLIC_API_URL` at it). The Next dev server alone can't OCR — the Elysia backend must run
(`bun run server`) with ocrmypdf available.

## Gate 2C (after provisioning)
- Scanned PDF → text selectable/searchable after.
- Text PDF passthrough (no error; `--skip-text`).
- Turkish scanned (`tur`) + Russian scanned (`rus`) recognized.
- Mobile 375px, dark mode, /en /tr /ru render.
- Rate limit: 4th anonymous run in a day → 429 (friendly "Daily limit reached").
Commit: `feat(tools): Wave 2C — OCR PDF (ocrmypdf on Hetzner)`.
