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
(already a dep) + `@pdf-lib/fontkit` (new dep), with `{ subset: true }`.
**Why over sanitize-to-ASCII:** sanitizing would silently delete Russian and mangle Turkish —
unacceptable for EN/TR/RU. Subsetting keeps output PDFs small (only used glyphs embedded).
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
