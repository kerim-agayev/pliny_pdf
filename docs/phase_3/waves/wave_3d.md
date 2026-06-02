# Wave 3D — Email verification + mailto + refund

## Sub-tasks
- [x] **Email verification** — was already OFF (Better Auth default; no `/verify-email` route,
  no `sendVerification`/`requireEmailVerification` refs). Made explicit with
  `emailAndPassword.requireEmailVerification: false` in `lib/auth/index.ts` (self-documenting,
  no behavior change). Existing users unaffected.
- [x] **Request-a-tool** — CORRECTED placement (gate feedback): the `/tools` page already had a
  "Missing a tool?" section (`ToolsCatalog`, `ToolsPage.missing*` keys) — its CTA was a dead
  `<button>`. Wired it to `mailto:feedback@plinypdf.com` (+ "→") and aligned TR/RU copy to the
  requested wording. Removed the (wrongly-placed) footer line + `Footer.requestTool` key. No new
  namespace — reused the existing `ToolsPage.missing*` keys (copy already matched).
- [x] **/support refund page** — `app/[locale]/support/page.tsx` via existing `LegalShell`/
  `LegalSection` + `pageMetadata`. Sections: Refunds (14-day guarantee, order email +
  Lemonsqueezy order #), Contact. `support@plinypdf.com` as a `t.rich` `<mail>` link.
  New `Support` i18n namespace (en/tr/ru). Footer Company column gets a `Support` link.
  Added `/support` to `app/sitemap.ts` (× 3 locales).

## Files changed
- `lib/auth/index.ts`, `components/shared/Footer.tsx`, `app/sitemap.ts`
- new: `app/[locale]/support/page.tsx`
- `messages/{en,tr,ru}.json` (Footer `support`/`requestTool`; new `Support` namespace)

## Verification
- `bun run build` green; `/[locale]/support` prerendered for en/tr/ru; no MISSING_MESSAGE.
- Curl /en/support → "14-day money-back" + `mailto:support@plinypdf.com` present.
- Curl /en footer → `mailto:feedback@plinypdf.com`, "Missing a tool", `/en/support` link present.

## Gate 3D
Sign up → straight to dashboard, no verification email. Footer feedback mailto opens mail client.
`/en/support` (and /tr, /ru) accessible with refund/contact content + support mailto.
