# Wave 9I — Critical Pre-Launch Items

**Status:** DONE ✅ — GATE 9I PASSED (2026-06-17, user-confirmed on Vercel).

See CLAUDE_9.md for the full spec.

## Outcome

Scope check (3 Explore agents) found **most of the wave already shipped** from earlier phases. Built only the genuinely missing items.

### Already done — verified only (not rebuilt)
- **OG images** — `app/api/og/route.tsx` (dynamic 1200×630, branded) + `lib/seo.ts` wires `openGraph`/`twitter` on every page.
- **Favicon** — `app/favicon.ico` (branded, multi-res).
- **Sentry** — `instrumentation.ts` + `sentry.server/edge.config.ts` + `instrumentation-client.ts` (Next 16 pattern), DSN-gated, capturing.
- **Keyboard shortcuts** — ⌘Z/⌘Y/Delete/Esc in `components/tools/EditorTool.tsx` (constraint: not added elsewhere).
- **Tool-page skeletons** — `components/tools/ToolSkeleton.tsx` via `ToolMount.tsx` (dynamic-import fallback, all tools).

### Built (missing items)
1. **Cookieless analytics + privacy notice** — `PostHogProvider` flipped to `persistence: "localStorage"` (drops the tracking cookie; capture unchanged), honors persisted opt-out (`ANALYTICS_CONSENT_KEY`). New `components/shared/PrivacyNotice.tsx` (first-visit dismissible card: Got it / Opt out). Privacy page cookies section reworded (cookieless analytics in localStorage, opt-out available).
2. **Branded 404** — `app/[locale]/not-found.tsx` (localized, popular `ToolCard`s + CTAs), `app/[locale]/[...rest]/page.tsx` catch-all (sets locale → `notFound()`), `app/not-found.tsx` root fallback (own `<html>`).
3. **PWA manifest + icons** — `app/manifest.ts` (theme `#6B5CE7`, bg `#0F0F0F`), `app/icon.tsx` (512) + `app/apple-icon.tsx` (180) generated via `next/og`. Layout metadata gained `manifest` + `appleWebApp` + `viewport.themeColor`.
4. **Branded error UI** — `app/[locale]/error.tsx` + `app/global-error.tsx`, both `Sentry.captureException`.
5. **OfflineIndicator** — `components/shared/OfflineIndicator.tsx` (online/offline listeners, top banner).
6. **BrowserWarning** — `components/shared/BrowserWarning.tsx` (IE + Safari < 14 only; one-time dismissible; modern browsers never see it).
7. **Loading skeletons** — `app/[locale]/dashboard/loading.tsx` + `app/[locale]/tools/loading.tsx` (reuse `pp-skeleton`).

All banners + notices mounted in `app/[locale]/layout.tsx`. i18n namespaces `PrivacyNotice`/`NotFound`/`ErrorPage`/`OfflineIndicator`/`BrowserWarning` added to en/tr/ru.

### Decisions
- **D9-I1: Cookie consent = cookieless + light notice** (not a GDPR consent wall). PostHog uses localStorage only → no tracking cookie → privacy page's "no analytics cookies" claim is true; an opt-out notice covers transparency. Lowest risk to analytics capture.
- **D9-I2: Icons generated via `next/og`** (no binary PNG assets) — "P" mark on indigo, consistent with the OG route.
- **D9-I3: Email verification left disabled** (intentional Phase 1 decision, `requireEmailVerification:false`). Wave item 9 treated as no-op.

### Notes / deferred
- Flagged (not changed): `PostHogProvider` defaults `api_host` to `us.i.posthog.com` while layout preconnects `eu`; assumed overridden by `NEXT_PUBLIC_POSTHOG_HOST` in prod — confirm env var.

**Verification:** `bun run build` green (Next 16.2.6; `/icon`, `/apple-icon`, `/manifest.webmanifest` prerendered static). Commit `fb7f32c` (19 files, frontend only — no Hetzner). User tested green on real device/browser. Next: Wave 9J (Final QA + Phase 9 docs).
