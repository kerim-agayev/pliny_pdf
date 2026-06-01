# PlinyPDF Phase 2 — Architecture

> New tool patterns and Phase 2-specific architecture. Phase 1 architecture lives
> in `docs/architecture.md` (root, read-only) — referenced by path, not duplicated.

## Adding a local tool — the 7 touch-points
1. **`components/shared/icons.tsx`** — add an `Icon*` component (stroke-based, 24×24,
   via the shared `I` wrapper).
2. **`lib/tools.ts`** — import the icon, add a `Tool` entry
   `{ id, slug, name, desc, cat, mode:"local", icon, accent, tag?, available:true }`.
3. **`lib/seo.ts`** — add `TOOL_SEO["<slug>"] = { title, description }` (REQUIRED).
4. **`lib/structured-data.ts`** — add `TOOL_FAQ["<slug>"]` (3 Qs, first is `PRIVACY_FAQ`).
   HowTo auto-derives from `mode` (`LOCAL_HOW`).
5. **`messages/{en,tr,ru}.json`** — `Tools.<id>` (`name`,`desc`; `Tools.tag.<id>` if tagged)
   + `ToolPages.<camelKey>` (`subtitle`, `action`, `successTitle`, + tool UI labels).
6. **`app/[locale]/<slug>/page.tsx`** — server component; `export const generateMetadata =
   toolMetadata("<slug>")`; renders `<JsonLd data={toolSchemas("<slug>")} />` + `<ToolShell>`.
7. **`components/tools/<Tool>.tsx`** (client) + **`lib/pdf/<op>.ts`** (pdf-lib logic).

Auto-derived (no action): `/tools` cards, `app/sitemap.ts`, `app/api/og`, dashboard links.

## Canonical client pattern
`components/tools/RotateTool.tsx` is the reference for per-page tools: state machine
`idle→loading→ready→processing→done|error`; `renderThumbnails(file)` (`lib/pdf/thumbnails.ts`);
`Set<number>` selection (Ctrl/Cmd multi); thumbnail grid `repeat(auto-fill,minmax(120px,1fr))`;
`analytics.toolUsed("<slug>")` on success; `downloadBlob`/`baseName` from `lib/format`.
Shared UI: `ToolShell`, `FileDropzone`, `SuccessPanel`/`ErrorBanner` (`ResultPanels.tsx`),
`FileInfoBar`, `Spinner`.

## pdf-lib op pattern
`lib/pdf/rotate.ts`: `PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true })`
→ mutate / `PDFDocument.create()` + `copyPages(src, indices)` + `addPage` → `doc.save()` →
`new Blob([data as BlobPart], { type: "application/pdf" })`.

## Cloud tool pattern (OCR PDF — Wave 2C)
Cloud tools (PDF↔Word, OCR) talk to the **Bun/Elysia backend** (`server/`, port 8080), not the
Next app. Flow: client `postFile`/`postFileForm` (`lib/api.ts`, `credentials:"include"` so the
Better Auth cookie reaches the cross-origin backend) → Elysia route → `getRequester(headers)`
(session → plan/userId, or null) → `checkServerTool(plan, userId|ip)` (Upstash; anon 3/day,
free 10/day, Pro unlimited) → service spawn → `fileResponse` (attachment). 429 → client shows
`ToolUI.rateLimited`. History saved for signed-in users only (privacy).

**OCR specifics:** `server/services/ocr.ts` spawns `ocrmypdf -l <eng|tur|rus> --skip-text
--optimize 1` over temp files (preserves original pages, adds an invisible text layer; skips
pages that already have text). Route `server/routes/ocr.ts` = POST `/api/ocr` (multipart
`file` + optional `lang`). Frontend `OcrPdf.tsx` adds a language picker (default = locale).
Requires `ocrmypdf` + `tesseract-ocr-{eng,tur,rus}` installed on the backend host (Hetzner) —
the Next dev server alone cannot OCR. See `waves/wave_2c.md` for provisioning.

## Unicode font pattern (text-to-pdf, markdown-to-pdf)
For tools that render arbitrary user text, pdf-lib `StandardFonts` (WinAnsi/CP1252) are unusable
(no Cyrillic, partial Turkish — they throw). Pattern:
- `lib/pdf/fonts.ts` — shared loader; `fetch('/fonts/<file>')` once, cached in a module-level Map.
- Fonts in `public/fonts/`: `NotoSans-Regular.ttf`, `NotoSans-Bold.ttf`, `NotoSansMono-Regular.ttf`
  (committed to the repo).
- Embed via `@cantoo/pdf-lib` + `@pdf-lib/fontkit`: `doc.registerFontkit(fontkit)` then
  `await doc.embedFont(bytes)` — **full font, never `{ subset: true }`** (fontkit@1.1.1 subsetter
  drops glyphs; see decisions.md + bugs.md). text-to-pdf uses Regular; markdown-to-pdf uses
  Regular/Bold/Mono.

## Hetzner server state (end of Phase 2)
- IP 49.13.119.27. Backend: systemd `plinypdf-backend.service` (auto-restart), port 8080.
- Gotenberg: Docker `pliny_pdf-gotenberg-1` (port 3001) — PDF↔Word only.
- ocrmypdf installed (apt) + tesseract `eng`/`tur`/`rus` packs — used by `server/services/ocr.ts`
  via `execFile` (host binary, NOT Docker).
- OCR rate limiting reuses `checkServerTool` (`lib/ratelimit.ts`) → Upstash keys
  `pp:ip:server:<ip>` (anon 3/day) and `pp:user:server:<userId>` (free 10/day; Pro unlimited).
  No OCR-specific Redis keys.
- UFW: 22/80/443 open; 8080 opened for Gate 2C browser testing — close once domain + Caddy land
  (then the frontend reaches the backend via `api.plinypdf.com`, not the raw IP:8080).
- Deploy/update flow: `git pull && bun install && systemctl restart plinypdf-backend`.
- `FRONTEND_ORIGIN` must be `https://plinypdf.com` in prod (single-origin `@elysiajs/cors`).
