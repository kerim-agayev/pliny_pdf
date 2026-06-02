# Phase 3 — Decisions

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
