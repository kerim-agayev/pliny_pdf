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

## 5E (incl. GATE 5E bug fixes)
- **Times Base-14 code bug (`pdf-editor.py`)**: `_BASE14["times"]` regular code was
  `"times"` — not a valid PyMuPDF Base-14 name, so `insert_text` demanded a fontfile
  ("need font file or buffer") and the apply crashed → add-text/save 502. Correct code
  is `"tiro"` (Times-Roman). Surfaced once 5E-1 let users pick the Times font.
- **Underline + text alignment are visual-only.** `BlockChange` (and the server) carry
  no underline/align, so they're stored in a **client-only per-block style map**
  (`blockStyles` in `editorStore`, mirroring `blockSizes`) and applied as CSS
  (`textDecoration` / `textAlign`) in `TextBlock`. Never sent on save — they do **not**
  alter the output PDF (same constraint as 5E-3 resize). True alignment/underline in the
  PDF would need a `BlockChange`/backend extension (out of scope).
