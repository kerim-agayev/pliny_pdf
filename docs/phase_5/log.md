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

