# Phase 5 — Decisions

## 5A
- **Page-count check is centralized in `FileDropzone`** (not duplicated per tool).
  Local PDF tools opt in with a `checkPages` prop. Cloud tools don't pass it →
  unaffected (cloud page enforcement is server-side, lands in 5B).
  *Why:* single source of truth, less duplication, keeps cloud tools untouched.
- **New cloud limits apply to ALL cloud tools** (existing PDF↔Word/OCR/AI included),
  since `CLOUD_MAX_MB`/`cloudMaxBytes` are shared constants and CLAUDE_5.md §3's
  cloud table lists those tools. Route logic is not rewritten — only the constants change.
- **Free daily rate 10→15 is shared** (`userServer` limiter). Edit PDF free
  incidentally becomes 15/day. Per-tool rate-limit key separation is deferred to
  Wave 5B (CLAUDE_5.md §10), where Edit PDF can get its own limiter if needed.
- **Download filename fix**: pass `types` to `showSaveFilePicker` (keeps the
  extension on rename) + anchor `download` extension safety net. Handles
  `.pdf` / `.jpg` / `.zip` / `.docx`.
