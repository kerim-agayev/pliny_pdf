# Phase 3 — Log

## [2026-06-02] Phase 3 started
Created `docs/phase_3/` tree. Read CLAUDE_3.md master plan. Decided toast = sonner.
Beginning Wave 3A (foundations).

## [2026-06-02] Wave 3A foundations built (pre-gate)
All 5 sub-tasks done: sonner Toaster, `lib/errors.ts` (10 codes + i18n), `lib/validation.ts`
(type/magic-byte/size/isPdfEncrypted), PasswordModal, ToolStatus. Build green, TS passed,
no MISSING_MESSAGE. isPdfEncrypted verified PASS. Awaiting user browser gate before Wave 3B.
Not yet committed (commit on gate confirmation per gated workflow).

## [2026-06-02] Wave 3A gate passed → committed d667578, pushed to origin/main.

## [2026-06-02] Wave 3B limits & security built (pre-gate)
Centralized validation/size/password in FileDropzone (chokepoint for all 28 tools).
lib/limits.ts (local 100MB, cloud anon25/free50/pro200). Cloud tools pass plan-tier limit;
Protect/Unlock opt out of auto-prompt; SplitTool 500-page cap; backend 413 enforcement in
convert/ocr/ai routes; magic-byte (PDF + docx/doc). Build green, tsc clean, validation
helpers unit-verified PASS. Awaiting user browser gate before Wave 3C.

## [2026-06-02] Wave 3B gate passed → 34220f7 pushed. Badge "bug" investigated, not a bug (428a19e).

## [2026-06-02] Wave 3C compress + grayscale built (pre-gate)
Compress: 3 real presets max/balanced/high (96/150/300 DPI, q30/60/85), pure-text detection
skips raster + textOnly toast, never-inflate kept, before/after toast. Grayscale: 150 DPI cap,
JPEG not PNG, never-inflate (returns original + warning if not smaller). Build green, tsc clean.
Canvas-dependent size diffs need browser gate. Awaiting user verification before Wave 3D.

## [2026-06-02] Wave 3C gate found 2 bugs → fixed (pre-re-test)
Bug1: Balanced/High returned original (150/300 DPI inflate screen PDFs → never-inflate kept
original). Recalibrated DPIs to 72/96/120 (q0.35/0.55/0.72) so all 3 compress + stay ordered;
also fixes 26MB-file slowness. Bug2: Grayscale returned the color original (raster inflated →
never-inflate). Now grayscale ALWAYS returns the converted file; warns (sizeGrew toast) if larger.
Both documented in bugs.md + decisions.md (deviation from CLAUDE_3.md numbers). Build green, tsc clean.
Awaiting user re-test.

## [2026-06-02] Wave 3C re-test passed + tool caps added (c3f6912)
User confirmed compress/grayscale fixes. Added per-tool caps (grayscale ≤10MB/100pg,
compress ≤50MB/300pg) to prevent main-thread hangs on big PDFs.

## [2026-06-02] Wave 3D built (pre-gate)
Email verification confirmed off (made explicit: requireEmailVerification:false). Footer
request-a-tool mailto (feedback@plinypdf.com) added (no prior link). New /support refund page
(LegalShell) with support@plinypdf.com, 14-day guarantee + Lemonsqueezy order #; footer Support
link + sitemap entry; Support namespace en/tr/ru. Build green, /support × 3 locales prerendered.
Awaiting user gate before Wave 3E.

## [2026-06-02] Wave 3D gate fix (6017cdc)
Per gate feedback, moved request-a-tool from footer to the bottom of /tools (the existing
"Missing a tool?" section's dead button → mailto:feedback@plinypdf.com). Removed footer line.

## [2026-06-02] Wave 3E built (pre-gate)
Deleted best-ilovepdf-alternatives-2026.md; wrote how-plinypdf-protects-your-privacy.md (965w,
DevTools-verify angle, 24h-delete/no-training cloud note, localized internal links). Index/sitemap
auto-update via lib/blog.ts. Build green; old slug 404s; /en/blog shows new post. Awaiting gate before 3F.

## [2026-06-02] Wave 3E gate passed → 019e10e (post body) + fcbd595 (delete) pushed.

## [2026-06-02] PHASE 3 COMPLETE — all 8 waves gate-passed
3H gate passed. Final closeout build green (exit 0, 138 pages, no MISSING_MESSAGE).
Phase 3 (hardening) shipped: 3A foundations, 3B limits/security, 3C compress+grayscale,
3D email-off/request-a-tool/support, 3E privacy blog, 3F UX polish (recent files, shortcuts,
toasts), 3G performance (lazy-load, streaming download, raster web worker), 3H PDF→Word
patience UI. Catalog unchanged (28 tools). Commits d667578→3H. `.env.local` never committed.

## [2026-06-02] Wave 3H patience UI built (pre-gate)
Option B (decisions.md): CloudConvertTool uploading box gains a live mm:ss timer, an
indeterminate progress bar, and a patience message that escalates after 45s
(cloudPatience→cloudPatienceLong). Gotenberg flow/limits unchanged; no page cap. i18n
en/tr/ru. Build green (exit 0). Timer/escalation needs browser gate. (Final wave.)

## [2026-06-02] Wave 3G-3 raster web worker built (pre-gate)
Shared env-agnostic `raster-core.ts` (CanvasEnv abstraction) runs grayscale/compress-raster/
pdf→jpgs on either thread. `pdf.worker.ts` (OffscreenCanvas) + `pdfWorkerClient.ts` (one
lazy worker, id-correlated, feature-detected). grayscale/compress(raster)/pdfToJpg try the
worker, fall back to main-thread core on ANY failure — identical output. pdfjs parses on its
nested worker inside ours (both chunks emitted). 3C caps kept (fallback safety). Build green
(exit 0). Off-main-thread behaviour needs browser gate.

## [2026-06-02] Wave 3G-2 streaming download built (pre-gate)
`downloadBlob` (the single download chokepoint) now uses File System Access
`showSaveFilePicker` + `createWritable/write/close` for files ≥10 MB on supporting secure
contexts; anchor+blob fallback otherwise; cancelled picker records nothing. Server-safe
(window use guarded). Build green (exit 0). Save-dialog needs browser gate (Chromium).

## [2026-06-02] Wave 3G-1 lazy-load built (pre-gate)
Worker scope decided at gate: raster ops only (decisions.md). 3G-1: central `ToolMount`
client registry (`next/dynamic` ssr:false + `ToolSkeleton` shimmer) lazy-loads each tool
widget on demand; all 28 pages render `<ToolMount component="X" />` (26 via deleted codemod,
2 CloudConvert hand-edited for props). SEO shell stays server-rendered. Build green (exit 0,
138 pages), no MISSING_MESSAGE. Skeleton/perceived-load needs browser gate.

## [2026-06-02] Wave 3F-3 toast wiring built (pre-gate)
Augment approach: toasts fired from shared SuccessPanel (success, `quietToast` opt-out) and
ErrorBanner (error) on mount — one edit covers ~27 tools, existing panels kept. Stable toast
ids dedupe StrictMode dev double-invoke. CompressTool opts out (keeps size toast); Grayscale
keeps generic success + sizeGrew warning. No FileDropzone/tool error-toast duplication. Build
green, no MISSING_MESSAGE. Live behaviour needs browser gate.

## [2026-06-02] Wave 3F-2 keyboard shortcuts built (pre-gate)
Chokepoint approach (no per-tool edits): `useToolShortcuts` hook mounted once in ToolShell
acts on `[data-pp-shortcut]` markers — Ctrl/Cmd+O (open via FileDropzone), Ctrl/Cmd+D
(download via SuccessPanel), Esc (reset via SuccessPanel/FileInfoBar). Skips editable fields;
preventDefault only when a target exists; no PasswordModal-Esc conflict. Platform-aware Kbd
hint chips (⌘ vs Ctrl, suppressHydrationWarning). i18n ToolUI.shortcutOpen en/tr/ru. Build
green, no MISSING_MESSAGE. Live keys need browser gate. (See note: custom-download tools skip Ctrl+D.)

## [2026-06-02] Wave 3F-1 recent files built (pre-gate)
Approach: augment + chunked (user-approved). lib/recentFiles.ts (localStorage, max 10, metadata
only). downloadBlob records on download (slug from path; no tools.ts import to keep format.ts
server-safe). RecentFiles.tsx (full + compact, hidden if empty). Wired into /tools + dashboard
sidebar; DB "Recent activity" untouched (complementary). RecentFiles i18n en/tr/ru. Build green,
tsc clean. Populated state pending browser gate.
