# Phase 5 — Log

(Append one entry per wave gate-pass.)

## [2026-06-07] GATE 5A passed — global fixes + limit enforcement
- Download filename fix (`lib/format.ts`): `showSaveFilePicker` now gets a `types`
  array (keeps extension on rename); anchor fallback appends `.pdf` if missing.
  Covers .pdf/.jpg/.zip/.docx.
- Plan-aware limits (`lib/limits.ts`): `LOCAL_MAX_MB` {10,25,50} + `LOCAL_MAX_PAGES`
  {50,150,300}; `CLOUD_MAX_MB` {25,100,250} + `CLOUD_MAX_PAGES` {50,300,1000}; new
  `localMaxMB/localMaxBytes/localMaxPages` + `cloudMaxPages`.
- `lib/ratelimit.ts`: free daily server-tool limit 10→15 (anon stays 3).
- `FileDropzone`: plan-aware size badge/validation; opt-in `checkPages` page gate
  (rejects over-limit PDFs before processing). `checkPages` added to 17 local PDF tools.
- i18n: `Errors.tooManyPagesLocal` in en/tr/ru.
- `bun run build`: green (Compiled successfully, 141/141 static pages, no MISSING_MESSAGE).
- Edit PDF limits unchanged; existing cloud route logic untouched (inherits new size constants).

## [2026-06-07] Wave 5B code complete — cloud migration (Compress/Grayscale/PDF→JPG/Merge)
- New backend: `server/services/pdf-tools.py` (PyMuPDF CLI: compress/grayscale/
  pdf-to-jpg/merge, page-cap enforced) + `server/services/pdf-tools.ts` wrapper
  (TooManyPagesError) + `server/routes/tools.ts` (`/api/tools/*`, 400/413/429/502,
  cloudMaxBytes/cloudMaxPages, checkServerTool). Registered in `server/index.ts`.
- Frontend: `lib/api.ts` `postBinary` (multi-file + server-named download);
  `lib/tools.ts` 4 tools `mode: local→cloud` (badge flips automatically);
  CompressTool (presets removed → single button), GrayscalePdf, PdfToJpgTool,
  MergeTool (dnd reorder kept) rewritten to upload; shared `CloudProgress` panel;
  privacy page notes the 9 cloud tools.
- Compress: never returns larger than input. PDF→JPG: 1 page→.jpg, 2+→.zip, 150 DPI.
- Dead code removed: `lib/pdf/{merge,compress,grayscale,pdfToJpg,raster-core}.ts`,
  `lib/workers/{pdfWorkerClient,pdf.worker}.ts`, `COMPRESS_MAX_*`/`GRAYSCALE_MAX_*`.
  jszip kept (still used by jpgToPdf + split).
- Verified: `bun run build` green (141/141, no MISSING_MESSAGE); `tsc --noEmit` 0 errors
  (incl. new server files); `pdf-tools.py` py_compile OK.
- ⏳ PENDING (GATE 5B functional): deploy `server/` to Hetzner (PyMuPDF 1.27.2.3) and
  run the real-file checks (compress 50 MB <20 s; grayscale 200 pg no inflation;
  PDF→JPG 200 pg zip + 1 pg jpg; merge 3 large; 413/429 toasts). Not runnable from
  the dev box (no local PyMuPDF; frontend targets api.plinypdf.com).

## [2026-06-07] GATE 5C passed — local tool optimizations (no cloud)
- New infra: `lib/pdf/thumbnailLoader.ts` (`createThumbLoader` — open pdfjs doc once,
  render pages on demand, cached, concurrency-queued); `components/tools/LazyThumb.tsx`
  (IntersectionObserver placeholder→render, rootMargin 300px);
  `components/tools/ProgressPanel.tsx` (determinate "Processing page X of Y");
  `lib/workers/pdfops.worker.ts` + `lib/workers/pdfOpsClient.ts` (`runPdfOp`
  rotate/crop/pageNumbers; transfers bytes; main-thread fallback when worker
  unsupported/errors). Cores added to `lib/pdf/{rotate,crop,addPageNumbers}.ts`
  (`*Core(bytes, params, onProgress)`); File wrappers call them.
- 5C-1 Header/Footer: single-page preview via loader (no full-doc render).
- 5C-2 Extract Pages: thumbnails removed → ranges text input + `readPageCount` +
  "of N pages" hint; instant.
- 5C-3 Sign PDF: only the selected page renders on demand.
- 5C-4 Delete + Organize Pages: lazy `LazyThumb` grids (Organize lazy-loads inside
  `SortableThumb`); select/reorder/rotate/delete unchanged.
- 5C-5 Rotate (lazy grid) + Crop (single-page preview) + Page Numbers (single-page
  preview) save via `runPdfOp` worker + `ProgressPanel`. **Redact left on main thread
  (decision)** — `renderThumbnails` kept (still used by Redact).
- 5C-6 JPG→PDF: `JPG_TO_PDF_MAX_IMAGES` {anon 50, free 100, pro 200} +
  `jpgToPdfMaxImages`; cap + `tooManyImages` toast + "X / N images" counter.
- i18n (en/tr/ru): `ToolUI.processingPage`, `ToolUI.imagesCount`, `Errors.tooManyImages`,
  `ToolPages.extractPages.ofPages`.
- Verified: `tsc --noEmit` 0 errors; `bun run build` green (141/141, no MISSING_MESSAGE).
- Frontend-only → Vercel auto-deploys on push.

## [2026-06-07] GATE 5D passed — mobile touch support (both editors)
- **Decision:** used Pointer Events (the existing RedactContent/SignPdf/CropPdf
  pattern), NOT the spec's touchstart→mousedown translation layer. One code path
  for mouse+touch+pen; far less code. `lib/touch.ts` holds only the shared piece.
- New `lib/touch.ts`: `usePinchZoom(ref, {getScale,setScale,panTarget})` — two-finger
  pinch→zoom + midpoint pan; non-passive touch listeners; callbacks kept in a ref so
  the once-bound listeners never read stale zoom. Generic over zoom units (Annotate
  factor 0.5–2; Edit PDF percent 50–200, both already clamp).
- Annotate PDF (`EditorTool.tsx`): `touch-action:none` on the fabric canvas;
  `usePinchZoom(wrapRef, …)` → existing `applyZoom`. fabric v6 already feeds its
  draw handlers from touch, so no handler changes.
- Edit PDF: `EditorCanvas.tsx` mouse→pointer (`onPointerDown`, `beginDrag`/`beginDraw`
  window `pointermove`/`pointerup`), `touch-action:none` on the page surface,
  `usePinchZoom` on the scroll container; draft-text guard → `onPointerDown`.
  `TextBlock.tsx` pointer events + **double-tap-to-edit** (300 ms, `onDoubleClick`
  kept for desktop) + pointer-based corner resize (`touch-action:none` on handles).
  `HighlightTool.tsx` + `DrawingTool.tsx`: `onMouseDown`→`onPointerDown`.
- `globals.css`: `.pp-edtool` mobile min-height 40→44px (≥44px tap target).
- No changes to WhiteoutTool, EditorToolbar (TSX), the store, or backend.
- Verified: `bun run build` green (Compiled successfully, no MISSING_MESSAGE);
  GATE 5D confirmed (DevTools 375px touch sim — both editors draw/select/pinch).
- Frontend-only → Vercel auto-deploys on push.

## [2026-06-08] GATE 5E passed — Edit PDF improvements (new-text styling, selectable-after-add, resize polish)
- **5E-1** (`EditorToolbar.tsx`): font/size/color controls now live when `tool === "text"`
  (`fmtEnabled = enabled || textMode`), not only when a block is selected. bold/italic/
  underline/align stay selection-only (addText takes none of them). The chosen
  fontFamily/fontSize/fontColor already flowed into `addText`; draft `<input>` now
  previews in the chosen font (`cssFont`, exported from TextBlock).
- **5E-2** (`editorStore.ts` + `EditorCanvas.tsx` + **backend** `editor.ts`):
  - `addLocalBlock(block)` — pushes the new block into the current page, switches to
    Select, auto-selects it. `commitDraft` calls it after `addText` returns `{ blockId }`,
    with an approximate bbox (`measureTextWidth` offscreen-canvas + `h = fontSize*1.25`).
  - **Backend `saveSession`:** edits/deletes targeting `add-…` blockIds (which the
    pristine-PDF geometry map can't resolve, so they were silently dropped) are now
    merged into the preserved add-text structural op — patch text/fontSize/fontName/
    color, or drop the op on delete. TS-only; no Python change. **Requires Hetzner deploy.**
- **5E-3** (`editorStore.ts` + `EditorCanvas.tsx` + `TextBlock.tsx`):
  `blockSizes` map + `resizeBlock` action (replaces throwaway component state). Resize
  drag: rAF-coalesced (no jitter), **Shift** locks the starting aspect ratio, min 50×20px,
  dashed-blue outline while dragging. **Visual-only** — `BlockChange` has no w/h and the
  server ignores block width, so resize affects the edit overlay, not the output PDF.
- Verified: `bun run build` green; `tsc --noEmit` 0 errors (incl. server). No new i18n keys.
- ⚠️ Frontend auto-deploys (Vercel); **5E-2 save needs the Hetzner backend deploy**
  (git reset --hard origin/main + restart plinypdf-backend) — until then, editing a
  newly-added block and saving still drops the edit.

