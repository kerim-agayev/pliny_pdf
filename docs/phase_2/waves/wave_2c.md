# Wave 2C — OCR PDF (one cloud tool)

Status: **DONE — GATE 2C PASSED (2026-06-01) — PHASE 2 COMPLETE**. Engine: **ocrmypdf**
(user-approved over raw Tesseract). Commits: `feat(tools): Wave 2C — OCR PDF (ocrmypdf on
Hetzner)` + `fix(ocr): register POST /api/ocr without trailing-slash mismatch` (a01c5f1).

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

## Gate 2C — PASSED ✅ (2026-06-01)
- Scanned PDF → searchable PDF (Ctrl+F finds text after) ✅
- Turkish OCR (`tur`) working ✅
- Rate limit: 429 after 3 anonymous attempts ✅
- /en /tr /ru render ✅
- Hetzner provisioned: ocrmypdf + tesseract eng/tur/rus installed; `FRONTEND_ORIGIN`
  reverted to `https://plinypdf.com` after testing.

## Bugs found + fixed at the gate (detail in bugs.md)
- **OCR route 404:** Elysia `prefix:"/api/ocr"` + `.post("/")` → `/api/ocr/` (trailing slash);
  frontend POSTs `/api/ocr`. Fixed by `prefix:"/api"` + `.post("/ocr")` (commit a01c5f1).
- **Deploy hazard:** a stale `nohup` bun process can hold :8080 → `systemctl restart` can't bind;
  use `fuser -k 8080/tcp` first.
- **429 after flushdb:** @upstash/ratelimit default in-memory cache; full reset = flushdb + restart.
- **.env in shell:** strip CRLF + quotes (`tr -d '"' | tr -d '\r'`) when extracting values.

## Deviations from the original wave_2c.md plan (documented in decisions.md)
- Engine **ocrmypdf**, not a hand-rolled pdftoppm→tesseract→pdf-lib pipeline.
- Rate limiting **reuses `checkServerTool`** (`pp:ip:server` / `pp:user:server`; anon 3/day,
  free 10/day, Pro unlimited) — no bespoke `ocr:*` keys, no Pro 100/day cap.
- Route path `/api/ocr` is registered under `prefix:"/api"` (not a dedicated `/api/ocr` prefix).
