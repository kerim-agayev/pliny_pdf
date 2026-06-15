# Wave 9A — Limit UI Display (All 33 Tools)

**Status:** ✅ **GATE 9A PASSED (2026-06-15, confirmed by user on Vercel)** · `bun run build` green · committed & pushed

## What shipped
- `components/shared/LimitBadge.tsx` — ported from Phase 9 design (`phase9-kit.jsx`), fully i18n.
  States: default (indigo), cloud (+ "Today x/y", amber ≤2 left), free (anon sub-line),
  anonymous (sign-in upsell), over-limit (red), live FileMeter (component-supported).
- `lib/limits.ts` — `getToolLimits(toolId, plan)` → `{ mb, count, unit, cloud, dailyLimit? }`.
- `lib/ratelimit.ts` — exported `SERVER_DAILY = { anon: 3, free: 10 }` (used by limiters + badge + /api/usage).
- `app/api/usage/route.ts` + `lib/hooks/useDailyUsage.ts` — live daily quota for cloud tools.
- `components/tools/FileDropzone.tsx` — `toolId` prop; renders LimitBadge; inline pre-upload
  size validation (red badge + red border) and page validation (inline red line) replacing toasts.
- All 30 FileDropzone call sites pass `toolId` (CloudConvertTool derives pdf-to-word/word-to-pdf).
- `messages/{en,tr,ru}.json` — new `LimitBadge` namespace (real translations).

## Verified limits (display == backend, both from lib/limits.ts)
- Local PDF tools: 10/25 MB · 30/100 pages (anon/free).
- compress, grayscale: 20/75 MB · 50/200 pages · daily 3/10.
- merge: 20/75 MB · 100/300 pages. pdf-to-jpg: 20/75 MB · 15/50 pages.
- pdf-to-word, word-to-pdf, ocr: 15/50 MB · 25/75 pages. edit-pdf: 10/30 MB · 15/50 pages.
- jpg-to-pdf: 10/25 MB · 50/100 **images**. nup/repeat: local input limits in badge; output caps in-tool.

## Bugs fixed: B9-1 (cloud page limit), B9-2 (editor size limit). See bugs.md.

## GATE 9A checklist (to confirm)
1. LimitBadge on all 31 file-input tools; none on text-to-pdf / markdown-to-pdf.
2. Anon: lower limit + "Sign in for …" upsell. Free: limit + "Anonymous tier: …" sub-line.
3. Cloud tools show "Today {used}/{total}" from /api/usage; amber ≤2 left.
4. Over-size file → red badge + red border before upload; clears on reselect.
5. Over-page PDF → inline page error using the tool's real page limit.
6. jpg-to-pdf badge reads "{n} images".
7. EN/TR/RU all correct; dark + light.
8. `bun run build` green ✔ (exit 0).

## Full 33-tool audit (GATE 9A round 2)

All tools use FileDropzone with the correct `toolId` (or are intentional exceptions). FileDropzone
does inline size+page validation before `onFiles` for every PDF tool. Verified per tool:

| Group | Tools | FileDropzone (toolId) | MB check | Page check | Badge |
|---|---|---|---|---|---|
| Local standard (20 PDF-in) | split, rotate, delete-pages, extract-pages, add-page-numbers, header-footer, crop-pdf, organize-pages, reversePages, sign-pdf, redact-content, remove-metadata, edit-metadata, flatten-pdf, pdfToText, watermark, protect, unlock, edit (Annotate), pdfBooklet | ✅ | ✅ inline | ✅ inline (FileDropzone) | ✅ local 10/25 MB · 30/100 pg |
| No file input | text-to-pdf, markdown-to-pdf | n/a (correct) | n/a | n/a | none (correct) |
| jpg-to-pdf | jpg-to-pdf | ✅ image, multiple | ✅ inline | image-count ✅ inline (B9-7 fix) | ✅ "{n} images" |
| nup / repeat | nupLayout, repeatPages | ✅ | ✅ inline | input ✅ inline; output cap ✅ inline ErrorBanner + disabled | ✅ local input |
| Cloud single-file | compress, grayscale-pdf, pdf-to-jpg, ocr-pdf, pdf-to-word | ✅ | ✅ inline | ✅ inline (FileDropzone) | ✅ + daily |
| word-to-pdf | word-to-pdf | ✅ accept=word | ✅ inline | server-side only (docx) | ✅ + daily |
| merge | merge | ✅ multiple | ✅ per-file + **total** (B9-7) | ✅ per-file + **total** (B9-7) | ✅ 20/75 MB · 100/300 pg + daily |
| edit-pdf | edit-pdf | custom uploader | ✅ inline (over) | ✅ inline (over, before upload) | ✅ 10/30 MB · 15/50 pg + daily (B9-4) |

Fixes this round: **B9-6** (jpg-to-pdf toast→inline), **B9-7** (merge total size/pages guard).

## Verify
- `cd pliny_pdf && bun run dev`; open split (local), pdf-to-jpg (cloud+pages), ocr-pdf (office),
  edit-pdf, jpg-to-pdf at 1440px and 375px; exercise default/over-size/over-page/anon/cloud-quota
  in EN+TR+RU, dark+light.
