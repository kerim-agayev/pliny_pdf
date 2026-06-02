# Wave 3A — Foundations

Goal: shared hardening primitives every later wave depends on. Additive only —
no tool rewiring (that is Wave 3F).

## Sub-tasks
- [x] 3A-1 Toast system (sonner@2.0.7) — `<Toaster/>` in layout, `components/shared/Toaster.tsx`
- [x] 3A-2 `lib/errors.ts` (10 codes) + `Errors` + `PasswordModal` namespaces in en/tr/ru
- [x] 3A-3 `lib/validation.ts` — `validateFileType` (ext+magic-byte), `validateFileSize`, `isPdfEncrypted`
- [x] 3A-4 `components/shared/PasswordModal.tsx` (3-attempt cap, Esc/backdrop cancel)
- [x] 3A-5 `components/shared/ToolStatus.tsx` (idle/loading/processing/done/error, progress bar)

## Verification
- `bun run build` green, TypeScript passed, no MISSING_MESSAGE (exit 0, 2026-06-02).
- `isPdfEncrypted` verified via throwaway script: false on plain PDF, true on encrypted → PASS.
- All 3 locale JSON files parse.
- Browser smoke test (toast dark/mobile, PasswordModal unlock, ToolStatus states): **pending user gate**.

## Completion notes
Additive only — no existing tool touched. `ToolUI.loading` key added for ToolStatus default.
New shared surface: `Toaster`, `lib/errors.ts`, `lib/validation.ts`, `PasswordModal`, `ToolStatus`.
Tool wiring deferred: PasswordModal → Wave 3B, ToolStatus/toast → Wave 3F.

## Files created/changed
- new: `components/shared/Toaster.tsx`, `components/shared/PasswordModal.tsx`, `components/shared/ToolStatus.tsx`
- new: `lib/errors.ts`, `lib/validation.ts`
- edited: `app/[locale]/layout.tsx` (import + mount Toaster), `package.json` (sonner), `messages/{en,tr,ru}.json`
