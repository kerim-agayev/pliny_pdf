# Phase 3 — Architecture

Hardening layer added on top of the existing 28-tool catalog. New shared pieces:

## Toast (Wave 3A)
- `sonner` `<Toaster/>` mounted once in `app/[locale]/layout.tsx`.
- `components/shared/Toaster.tsx` — client wrapper: responsive position
  (top-right desktop / bottom-center mobile), 4s duration, max 3 visible, token-matched.
- Tools call `toast.success/error/warning(t("Errors.<code>"))`.

## Error layer (Wave 3A)
- `lib/errors.ts` — `ErrorCode` union + `errorMessageKey(code)` → `Errors.<key>`.
  Pure (no React), shared by client toasts and server structured-error JSON.
- `messages/{en,tr,ru}.json` → `Errors` namespace.

## Validation (Wave 3A)
- `lib/validation.ts` — `validateFileType` (extension + magic bytes), `validateFileSize`,
  `isPdfEncrypted` (via `@cantoo/pdf-lib`). All return `{ ok, error?, ...meta }`.

## Password handling (Wave 3A)
- `components/shared/PasswordModal.tsx` — detect-and-prompt flow, 3-attempt cap, reuses
  `removePassword` from `lib/pdf/password.ts`. Wave 3B wires it into every tool.

## Tool status (Wave 3A)
- `components/shared/ToolStatus.tsx` — standard idle/loading/processing/done/error display.
  Reuses `Spinner` + `ErrorBanner`. Wave 3F wires it into all 28 tools.

## Lazy-loading (Wave 3G-1)
- `components/tools/ToolMount.tsx` — central registry; each tool is
  `next/dynamic(() => import("./X"), { ssr:false, loading: ToolSkeleton })`. Pages render
  `<ToolMount component="X" [props]/>`; the server-rendered ToolShell (SEO) is unaffected.
- `components/tools/ToolSkeleton.tsx` — shimmer placeholder (`pp-skeleton` in globals.css).

## Streaming download (Wave 3G-2)
- `lib/format.ts` `downloadBlob` — single download chokepoint. Files ≥10 MB on a supporting
  secure context use the File System Access API (`showSaveFilePicker` → `createWritable` →
  `write` → `close`); otherwise / on cancel it falls back to the anchor+blob: URL method.

## Raster Web Worker (Wave 3G-3) — raster ops only
- `lib/pdf/raster-core.ts` — env-agnostic algorithms (grayscale, compress-raster, pdf→jpgs).
  A `CanvasEnv` abstracts canvas-create + JPEG-encode; `domCanvasEnv()` (main thread) and the
  worker's OffscreenCanvas env share ONE copy of each algorithm. pdfjs + pdf-lib run in both.
- `lib/workers/pdf.worker.ts` — single shared module worker (`{op, payload}` protocol,
  `progress`/`done`/`error` messages, transferable ArrayBuffers). pdfjs parses on its own
  nested worker inside this one.
- `lib/workers/pdfWorkerClient.ts` — one lazily-created worker, id-correlated promises,
  `workerSupported()` feature detection. All failures reject.
- Pattern: the heavy lib fns (`grayscalePdf`, `compressPdf`→rasterBytes, `pdfToJpg`) try the
  worker, then fall back to `*Core` + `domCanvasEnv()` on any rejection → identical output,
  worker is pure optimization. 3C size caps retained as fallback-thread safety.

(Later waves append here: recent-files, etc.)
