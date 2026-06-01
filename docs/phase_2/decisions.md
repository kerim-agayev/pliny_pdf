# PlinyPDF Phase 2 — Decisions

> Phase 2 technical decisions and their reasons. Phase 1 decisions live in
> `docs/decisions.md` (root, read-only) — do not duplicate here.

## Tool catalog field shape (follow the code, not CLAUDE_2.md §3)
CLAUDE_2.md §3 sketches a `{ category, type, badge, free, comingSoon }` shape.
The actual `lib/tools.ts` `Tool` interface is
`{ id, slug, name, desc, cat, mode, icon, accent, tag?, available }`
(`cat` ∈ Organize|Convert|Edit|Secure|AI, `mode` ∈ local|cloud). New tools follow
the **real** shape so the existing catalog/sitemap/OG/dashboard keep working unchanged.

## A new tool touches 7 files, not 1
CLAUDE_2.md implies adding to `lib/tools.ts` is enough. Verified otherwise:
`lib/seo.ts` (`TOOL_SEO`) is **required** — `toolMetadata()` reads `seo.title` and a
missing entry crashes `bun run build`. `lib/structured-data.ts` (`TOOL_FAQ`) is needed
for FAQ/HowTo JSON-LD. There is no existing icon for any new tool, so `icons.tsx` gets a
new component each time. i18n keys must land in all three locales (en/tr/ru) or the build
fails with MISSING_MESSAGE.

## No new dependencies in Wave 2A
`@dnd-kit/core` + `@dnd-kit/sortable` (organize-pages) and `fabric` (sign-pdf draw pad)
were already in `package.json` from Phase 1 — nothing new to install.

## redact-content uses a DOM overlay, not fabric, for the boxes
The Wave 2A build note suggested fabric.js for redaction rectangles. We instead store
boxes as page-percent coords drawn via a DOM overlay (pointer rubber-band).
**Why:** percent coords feed the permanent rasterizer (`redactPdf`) directly and survive
page navigation cleanly; fabric's canvas-pixel model would need extra conversion +
per-page serialization for no UX gain. sign-pdf still uses fabric for its free-draw pad
(where fabric is the right tool). The redaction UI still matches the handoff exactly.

## Permanent redaction = re-rasterize affected pages
`redactPdf` renders any page that has redaction boxes to an image (pdfjs) with the boxes
painted on, then rebuilds that page from the image — the underlying text/vectors are
**removed, not hidden**. Pages without boxes are copied through untouched so their text
stays selectable. This is the only way to make "Redactions are permanent" actually true
(a pdf-lib black rectangle would leave the text extractable underneath).

## Design tools live in a full-width ToolShell
The six design tools use `<ToolShell ... fullWidth>` (settings + live-preview/canvas two-column)
instead of the default sidebar layout — matching the handoff, which has no how-it-works
sidebar on these screens. ToolShell still provides breadcrumb + header + privacy badge.

## Text-input tools embed Noto Sans, not pdf-lib StandardFonts
`text-to-pdf` and `markdown-to-pdf` take arbitrary user text, so they hit the WinAnsi
(CP1252) ceiling of pdf-lib's `StandardFonts` — which throws on Cyrillic (RU) and several
Turkish letters, both day-one launch locales (see bugs.md, 2026-06-01).
**Decision:** embed **Noto Sans** (Regular/Bold) + **Noto Sans Mono** via `@cantoo/pdf-lib`
(already a dep) + `@pdf-lib/fontkit` (new dep), embedding the **full font (NOT `subset: true`)**.
**Why over sanitize-to-ASCII:** sanitizing would silently delete Russian and mangle Turkish —
unacceptable for EN/TR/RU.
**Why full embed, not subset:** `@pdf-lib/fontkit@1.1.1`'s subsetter drops glyphs (renders
correct spacing but blank letters — see bugs.md). `{ subset: true }` is therefore forbidden here.
Trade-off: output PDFs carry the full font (~280 KB for text-to-pdf's one font; ~1.4 MB for
markdown's three). Acceptable for v1; revisit with a pre-built minimal subset font if size matters.
New dep: `@pdf-lib/fontkit`. New assets: `public/fonts/NotoSans-{Regular,Bold}.ttf` +
`NotoSansMono-Regular.ttf` (~1.5 MB total), fetched at runtime only on these two tool pages
via `lib/pdf/fonts.ts` (module-level cache). Other tools keep `pdf-lib` StandardFonts — they
draw only ASCII/Latin chrome (page numbers, header/footer), so WinAnsi is fine there.

## OCR PDF uses ocrmypdf, not a hand-rolled Tesseract pipeline
`wave_2c.md` originally sketched a manual pipeline (pdftoppm → tesseract per page →
re-embed text layer with pdf-lib). We use **ocrmypdf** instead (user-approved).
**Why:** ocrmypdf is purpose-built for "PDF in → searchable PDF out" — it rasterizes,
recognizes, and writes back a correctly-aligned invisible text layer in one call, and
`--skip-text` makes already-text / mixed PDFs pass through instead of erroring. The manual
pipeline has many more moving parts and edge cases for no quality gain. Cost: heavier install
(ocrmypdf + ghostscript + qpdf alongside the tesseract language packs) on Hetzner. Service:
`server/services/ocr.ts` (one `Bun`/`execFile` spawn, temp files, cleanup in `finally`).

## OCR reuses checkServerTool, not bespoke per-day OCR keys
`wave_2c.md` suggested dedicated Upstash keys (`ocr:anon`, `ocr:user`) with Pro 100/day.
We instead reuse the existing **`checkServerTool`** limiter (anon 3/day by IP, free 10/day,
Pro unlimited) — the same limiter the PDF↔Word cloud tools use. **Why:** consistent UX across
all server-CPU tools, one place to tune limits, and the existing `rateLimited` i18n + 429
handling in the client already cover it. Pro "unlimited" matches the product's stated tiers
(CLAUDE.md §9.6) more cleanly than an arbitrary 100/day cap.

## @upstash/ratelimit has a default in-memory cache (Gate 2C debugging)
`@upstash/ratelimit@2.0.8`: when `ephemeralCache` is not passed (our case), the constructor
creates a default in-memory `Map` cache (`dist/index.js:782-783`). Once an identifier is
blocked, the **running process** answers `blocked` from this Map without consulting Redis for
the rest of the window. **Consequence:** `flushdb` on Redis alone does NOT reset a live limit —
the process keeps the block in memory. **Full reset = `flushdb` + `systemctl restart
plinypdf-backend`.** Documented because it cost real time during Gate 2C.

## Sign PDF is a visual signature, not a cryptographic e-signature
`sign-pdf` embeds a signature *image* (drawn/typed/uploaded) onto the page. It is NOT a
PKI/certificate-based digital signature. Correct scope for v1 and matches most online tools;
the FAQ/JSON-LD says so explicitly. Revisit (PAdES/qualified signatures) only if demanded.

## Design handoff delivered 1 screen per tool, not 4 variants
Claude Design returned 1 screen per design-needed tool (6 total), not the 4 variants
(empty + active + dark + mobile) originally envisioned. Empty/active states and dark mode were
implemented in code from Phase 1 patterns; mobile (375px) verified via DevTools. No quality loss.

## Grayscale PDF re-rasterizes (text stops being selectable)
`grayscale-pdf` renders each page to a grayscale image, so text becomes part of the image and is
no longer selectable/searchable — same trade-off as a heavy raster compress. This is stated in
the tool UI so users aren't surprised. A vector-preserving grayscale would need per-object color
rewriting (out of scope for v1).

## CORS testing workaround during Gate 2C (must revert)
To test the localhost:3000 frontend against the Hetzner backend, `FRONTEND_ORIGIN` was
temporarily set to `http://localhost:3000` on Hetzner (the backend's `@elysiajs/cors` echoes a
single origin). **This MUST be reverted to `https://plinypdf.com` for production** — never leave
a localhost origin in prod CORS. Revert command lives in `log.md` / `index.md`.
