# Wave 3B — Limits & Security

## Approach decision
Centralized magic-byte validation, size limits, and the encrypted-PDF password
prompt in **`FileDropzone`** (the single file-entry component every tool uses)
rather than editing all 28 tools. This honors CLAUDE_3.md §3 ("add PasswordModal
where PDF input is detected" — that's the dropzone) and §6 (Simplicity/Surgical).
Net effect: the 24 PDF tools inherit the behavior with **zero** changes.

## Sub-tasks
- [x] `lib/limits.ts` — `LOCAL_MAX_MB=100`, `CLOUD_MAX_MB {anon25,free50,pro200}`,
  `cloudMaxMB`/`cloudMaxBytes`/`bytesToMB`. Shared front + back.
- [x] `FileDropzone` enhanced: extension+magic-byte (`validateFileType`), size limit
  (default 100MB, badge "Max N MB"), encrypted-PDF → `PasswordModal` (sequential for
  multi-file), corrupt-PDF toast. Failures surface as localized toasts; `onFiles` only
  gets valid, decrypted files. New props: `maxSizeMB`, `disablePasswordPrompt`.
- [x] `ProtectTool` + `UnlockTool` pass `disablePasswordPrompt` (they own password logic).
- [x] Cloud tools (`SummarizeTool`, `OcrPdf`, `CloudConvertTool`) pass plan-tier
  `maxSizeMB` from `useSession` + `cloudMaxMB`.
- [x] `SplitTool` caps "every page" at 500 (disables option + message; auto-fallback to
  range on load); range mode unlimited.
- [x] Backend size enforcement (status 413 `{error:"fileTooLarge",limitMB,fileMB}`) in
  `server/routes/convert.ts` (both routes), `ocr.ts`, `ai.ts`.
- [x] PDF→JPG: size-limit only (inherited from dropzone default), no page cap — nothing to add.
- [x] Magic-byte: PDF `%PDF`; Word accepts `.docx`/PK and legacy `.doc`/OLE (no regression).
- [x] i18n: `ToolUI.maxSize`, `ToolPages.split.eachCapped` in en/tr/ru.

## Verification
- `bun run build` green + `tsc --noEmit` clean (incl. server routes), 2026-06-02.
- `validateFileType`/`validateFileSize` unit-checked: real PDF ok, exe-renamed-.pdf rejected,
  .docx + legacy .doc ok, 30MB>25MB rejected with limit/file MB. → PASS.
- `isPdfEncrypted` PASS (from 3A).
- Browser gate (try 30MB anon reject, 60MB free reject, pro 100MB+, encrypted-PDF prompt
  on a normal tool, split cap message): **pending user**.

## Files changed
- new: `lib/limits.ts`
- edited: `components/tools/FileDropzone.tsx` (core), `ProtectTool.tsx`, `UnlockTool.tsx`,
  `SummarizeTool.tsx`, `OcrPdf.tsx`, `CloudConvertTool.tsx`, `SplitTool.tsx`
- edited: `server/routes/convert.ts`, `server/routes/ocr.ts`, `server/routes/ai.ts`
- edited: `messages/{en,tr,ru}.json`
