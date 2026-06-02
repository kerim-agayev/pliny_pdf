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

## [2026-06-02] Wave 3F-1 recent files built (pre-gate)
Approach: augment + chunked (user-approved). lib/recentFiles.ts (localStorage, max 10, metadata
only). downloadBlob records on download (slug from path; no tools.ts import to keep format.ts
server-safe). RecentFiles.tsx (full + compact, hidden if empty). Wired into /tools + dashboard
sidebar; DB "Recent activity" untouched (complementary). RecentFiles i18n en/tr/ru. Build green,
tsc clean. Populated state pending browser gate.
