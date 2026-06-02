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

## 3G-2 — Streaming download for large output (pending)
- File System Access `showSaveFilePicker` for >10 MB on supporting browsers; Blob-URL fallback.

## 3G-3 — Web Worker (raster ops only) (pending)
- `lib/workers/pdf.worker.ts` running pdfjs inline + OffscreenCanvas for Compress / Grayscale /
  PDF→JPG, with main-thread fallback if OffscreenCanvas/Worker unavailable. Lets us relax the
  3C caps once off-main-thread.
