# Phase 3 — Decisions

## 2026-06-02 — Wave 3H PDF→Word = Option B (patience UI), per CLAUDE_3.md default
Kept the existing Gotenberg flow and added a patience UI to CloudConvertTool: a live
mm:ss timer, an indeterminate progress bar, and a reassurance message that escalates
after 45s ("still converting… almost there"). NO hard page cap (Option A) — the per-plan
cloud size limits from 3B already bound the work; revisit Option A only if real testing
shows Gotenberg timeouts on allowed sizes. Option C (job queue) is out of scope for Phase 3.

## 2026-06-02 — Wave 3G worker scope = raster ops only (user-chosen at gate)
The ops that actually freeze the UI are the canvas/raster tools (Compress, Grayscale,
PDF→JPG); pure pdf-lib ops (Merge/Split/Organize/Crop/Redact) are fast and don't freeze.
So 3G-3 moves ONLY the raster ops into a shared worker via OffscreenCanvas (pdfjs run
inline in the worker), with a main-thread fallback — rather than the full 7-op list in
CLAUDE_3.md. Best value-to-risk; lets us relax the 3C caps once off-main-thread.

## 2026-06-02 — Wave 3G-1 lazy-load via central ToolMount registry, ssr:false
Tool widgets are client-only (no SEO content), so each is `next/dynamic(..., {ssr:false})`
behind a skeleton — keeps their pdf-lib/pdfjs/canvas JS out of the initial route payload.
One registry (`ToolMount`) instead of 28 per-page wrappers; pages pass a component key
(+ props for CloudConvertTool). The server-rendered ToolShell (SEO) is unaffected.

## 2026-06-02 — Toast library = sonner
User-approved. ~3KB, Next.js 16 + React 19 compatible, battle-tested. One `<Toaster/>`
mounted in `app/[locale]/layout.tsx`; tools import `{ toast }` from `sonner` directly
(no custom hook — Simplicity First).

## 2026-06-02 — Wave 3A findings that adjust CLAUDE_3.md
1. **Design tokens are NOT `--pp-*`.** Real tokens in `app/globals.css`: `--bg`, `--bg-2`,
   `--text`, `--text-2`, `--text-3`, `--indigo` (#6b5ce7), `--emerald` (#10b981),
   `--blue` (#3b82f6), `--rose` (#f43f5e), `--line`. `pp-*` is only the utility-class prefix
   (`.pp-btn`, `.pp-card`, `.pp-input`, `.pp-badge`, `.pp-mono`). Use the real tokens.
2. **No `alert()` exists anywhere.** Errors render via `ErrorBanner`/`SuccessPanel`/`Spinner`
   in `components/tools/ResultPanels.tsx`. Wave 3A adds the new layer alongside; tool
   rewiring is Wave 3F.
3. **Email verification is already disabled** in Better Auth (`lib/auth/index.ts` has no
   `requireEmailVerification`, no `/verify-email` route). Wave 3D becomes cleanup/verify,
   not a teardown.
4. **No "Request a tool" link exists** in `components/shared/Footer.tsx`. Wave 3D step is an
   *add* (static mailto), not a *replace*.
5. Messages load wholesale per locale (`i18n/request.ts`), so a new top-level `Errors`
   namespace is auto-available. No existing `Errors` namespace; current error strings live
   under `ToolUI`.
6. `@cantoo/pdf-lib` is installed; `lib/pdf/password.ts` already has `removePassword`/
   `protectPdf`. `isPdfEncrypted` reuses the same load pattern.

## 2026-06-02 — Wave 3C gate fixes (overrides CLAUDE_3.md Wave 3C numbers)
- **Compress DPIs recalibrated** from CLAUDE_3.md's 96/150/300 to **72/96/120** (q 0.35/0.55/0.72).
  Reason: at 150/300 DPI the rasterized output of a normal screen-resolution PDF is *larger* than
  the source, so never-inflate returned the original for Balanced/High (they appeared broken), and
  300 DPI made large files crawl. Lower DPIs make all three presets reliably compress while staying
  ordered (max < balanced < high). Never-inflate guarantee retained.
- **Grayscale always returns the converted file.** CLAUDE_3.md said "if output > input, return the
  original." In practice that handed back a *color* file for vector/small PDFs, defeating the tool.
  Decision: the grayscale conversion is the deliverable — always return it; warn (toast) if it grew.
- **User preference (defer to Phase 4):** user finds 3 compress presets unnecessary and would keep
  only "Maximum". Presets are NOT removed now (only fixed); revisit consolidation in Phase 4.

## 2026-06-02 — Tool-specific caps for grayscale & compress (raster guard)
Both tools re-render every page to a canvas on the main thread, so very large/long PDFs hang
(the 26 MB compress test crawled). Added stricter per-tool caps, enforced in the tool's `onFiles`
(after `readPageCount`) with a localized `toast.error`, before any processing:
- Grayscale: ≤ 10 MB and ≤ 100 pages (`GRAYSCALE_MAX_MB`, `GRAYSCALE_MAX_PAGES`).
- Compress: ≤ 50 MB and ≤ 300 pages (`COMPRESS_MAX_MB`, `COMPRESS_MAX_PAGES`; message suggests Split first).
These sit on top of the generic 100 MB local dropzone limit. New error codes
`FILE_TOO_LARGE_GRAYSCALE` / `FILE_TOO_LARGE_COMPRESS` in `lib/errors.ts`. Constants in `lib/limits.ts`.
(Web Workers in Wave 3G will move this off the main thread; caps may be revisited then.)
