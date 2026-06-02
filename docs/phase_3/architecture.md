# Phase 3 — Architecture

Hardening layer added on top of the existing 28-tool catalog. New shared pieces:

## Toast (Wave 3A)
- `sonner` `<Toaster/>` mounted once in `app/[locale]/layout.tsx`.
- `components/shared/Toaster.tsx` — client wrapper: responsive position
  (top-right desktop / bottom-center mobile), 4s duration, max 3 visible, token-matched.
- Tools call `toast.success/error/warning(t("Errors.<code>"))`.

## Error layer (Wave 3A)
- `lib/errors.ts` — `ErrorCode` union + `errorMessageKey(code)` → `Errors.<key>`.
  Pure (no React), shared by client toasts and server structured-error JSON.
- `messages/{en,tr,ru}.json` → `Errors` namespace.

## Validation (Wave 3A)
- `lib/validation.ts` — `validateFileType` (extension + magic bytes), `validateFileSize`,
  `isPdfEncrypted` (via `@cantoo/pdf-lib`). All return `{ ok, error?, ...meta }`.

## Password handling (Wave 3A)
- `components/shared/PasswordModal.tsx` — detect-and-prompt flow, 3-attempt cap, reuses
  `removePassword` from `lib/pdf/password.ts`. Wave 3B wires it into every tool.

## Tool status (Wave 3A)
- `components/shared/ToolStatus.tsx` — standard idle/loading/processing/done/error display.
  Reuses `Spinner` + `ErrorBanner`. Wave 3F wires it into all 28 tools.

(Later waves append here: limits, worker pattern, recent-files, etc.)
