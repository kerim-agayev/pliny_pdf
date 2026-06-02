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
