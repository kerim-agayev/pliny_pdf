# Wave 3G — Performance

Chunked + gated like 3F. Worker scope decided at gate: **raster ops only** (user-chosen) —
see decisions.md.

## 3G-1 — Lazy-load tool components ✅ (built, awaiting gate)
- `components/tools/ToolMount.tsx` (client) — a central registry mapping each tool's
  component key → `next/dynamic(() => import("./X").then(m => m.X), { ssr:false, loading })`.
  One file owns all 27 dynamic imports; each tool becomes its own on-demand chunk.
- `components/tools/ToolSkeleton.tsx` — presentational placeholder (shimmer, reduced-motion
  safe via `pp-skeleton` in globals.css) sized to the dropzone so layout doesn't jump.
- All 28 tool pages now render `<ToolMount component="X" />` instead of importing the tool
  directly (26 via a one-off codemod, since deleted; the 2 CloudConvertTool pages hand-edited
  to forward props through `ToolMount`'s `props`). The SEO shell (ToolShell heading/how-it-
  works/related + JSON-LD) stays server-rendered & prerendered; only the interactive widget
  (pdf-lib/pdfjs/canvas) is fetched client-side behind the skeleton.
- Why ssr:false: tool widgets are client-only anyway (no SEO content); ssr:false keeps their
  JS out of the initial route payload and lets the skeleton show during the chunk fetch.
- Verify: build green (exit 0, 138 pages prerendered), no MISSING_MESSAGE. Perceived-load /
  skeleton needs browser gate.

## 3G-2 — Streaming download for large output ✅ (built, awaiting gate)
- `lib/format.ts` `downloadBlob` is the single download chokepoint (the only other
  `createObjectURL` in the app is a JpgToPdf image *preview*, not a download), so wiring it
  here covers every tool.
- Files ≥10 MB on a secure context that supports `showSaveFilePicker` → File System Access
  API: pick a location, `createWritable()` → `write(blob)` → `close()` (written straight to
  disk). `showSaveFilePicker` is called synchronously at the top of the async path so the
  click's user activation stays valid.
- Fallbacks: unsupported browser / non-secure context → classic anchor + blob: URL (unchanged
  behaviour). Picker cancelled (`AbortError`) → nothing saved, nothing recorded. Any other
  FSA failure → fall back to the anchor download.
- Small files (<10 MB) keep the one-click anchor download (no save dialog).
- Server-safe: all `window`/`document` use is inside function bodies guarded by
  `pickerSupported()`; the Bun server still imports `baseName`/`formatBytes` fine.
- Verify: build green (exit 0). Save-dialog behaviour needs browser gate (Chromium-only API).

## 3G-3 — Web Worker (raster ops only) (pending)
- `lib/workers/pdf.worker.ts` running pdfjs inline + OffscreenCanvas for Compress / Grayscale /
  PDF→JPG, with main-thread fallback if OffscreenCanvas/Worker unavailable. Lets us relax the
  3C caps once off-main-thread.
