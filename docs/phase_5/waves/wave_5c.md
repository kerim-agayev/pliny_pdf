# Wave 5C — Local tool optimizations (stub)

Fix slow local tools without moving to cloud. See CLAUDE_5.md §4 Wave 5C.

- 5C-1: Header/Footer — single-page preview (apply-to-all on download)
- 5C-2: Extract Pages — remove live preview, use text input ("1, 3, 5-10")
- 5C-3: Sign PDF — render only the selected signature page
- 5C-4: Thumbnail lazy loading (Delete/Organize Pages) — IntersectionObserver, batch 10, 72 DPI
- 5C-5: Web Worker (Rotate, Crop, Redact, Page Numbers) — reuse Wave 3G worker, real progress bar
- 5C-6: JPG→PDF — image count limit (anon 50 / free 100 / pro 200), "0 / 50 images"

GATE 5C: slow tools optimized; Rotate 300-page <15s, UI responsive, progress bar.

## Status (code complete, build green; functional GATE pending user test)
New infra: `lib/pdf/thumbnailLoader.ts` (createThumbLoader — open pdfjs doc once,
render pages on demand, cached, concurrency-queued), `components/tools/LazyThumb.tsx`
(IntersectionObserver placeholder→render), `components/tools/ProgressPanel.tsx`
(determinate "Processing page X of Y"), `lib/workers/pdfops.worker.ts` +
`lib/workers/pdfOpsClient.ts` (`runPdfOp` rotate/crop/pageNumbers; transfers bytes;
main-thread fallback). Cores added to `lib/pdf/{rotate,crop,addPageNumbers}.ts`
(`*Core(bytes, params, onProgress)`); File wrappers call them.

- [x] 5C-1 HeaderFooter — single-page preview via loader (no full render)
- [x] 5C-2 ExtractPages — thumbnails removed; ranges text input + readPageCount + ofPages hint
- [x] 5C-3 SignPdf — only selected page rendered on demand
- [x] 5C-4 DeletePages + OrganizePages — LazyThumb grids (Organize lazy-loads inside SortableThumb)
- [x] 5C-5 RotateTool (lazy grid) + CropPdf (single-page) + AddPageNumbers (single-page),
      all save via `runPdfOp` worker + ProgressPanel. **Redact left on main thread (decision).**
- [x] 5C-6 JPG→PDF — `JPG_TO_PDF_MAX_IMAGES` {50,100,200} + `jpgToPdfMaxImages`;
      cap + `tooManyImages` toast + "X / N images" counter.
- i18n added (en/tr/ru): `ToolUI.processingPage`, `ToolUI.imagesCount`,
  `Errors.tooManyImages`, `ToolPages.extractPages.ofPages`.
- `renderThumbnails` (thumbnails.ts) kept — still used by RedactContent.
- Verified: `tsc --noEmit` 0 errors; `bun run build` green (141/141, no MISSING_MESSAGE).
- ⏳ PENDING: user browser test (GATE 5C steps) on a large PDF; then commit + push (Vercel).
  NOT committed yet.
