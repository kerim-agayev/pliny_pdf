# Phase 9 — Architecture Notes

## Limit system (Wave 9A)

```
lib/ratelimit.ts        SERVER_DAILY {anon:3, free:10}  ──┐ (single source for daily caps)
lib/limits.ts           *_MAX_* constants + helpers       │
                        getToolLimits(toolId, plan) ───────┼─► returns {mb,count,unit,cloud,dailyLimit?}
                                                           │
backend server/routes/* import the same helpers ──────────┘ (enforcement == display, by construction)

components/shared/LimitBadge.tsx   presentational, i18n ("LimitBadge" namespace), all states
components/tools/FileDropzone.tsx  toolId → getToolLimits → renders LimitBadge + inline validation
app/api/usage/route.ts             GET → {plan,used,total,remaining} via remainingServerTool()
lib/hooks/useDailyUsage.ts         client fetch of /api/usage (cloud tools only)
```

- **Plan source (client):** `useSession()` from `@/lib/auth/client` → `user.plan` → `effectivePlan()` → `"anon" | "free"`.
- **Plan source (server, /api/usage):** `auth.api.getSession({ headers })`; anon keyed by `clientIp`.
- **Tiers:** anon / free only (Pro maps to free limits via `effectivePlan`; Pro daily = unlimited).
- **Tools without file input:** `text-to-pdf`, `markdown-to-pdf` never pass `toolId` → no badge.

## Phase 9 — final architecture summary (Wave 9J)

Phase 9 was polish over an already-strong base — net-new architecture is small and additive.

- **Limit system (9A):** `lib/limits.ts` `getToolLimits(toolId, plan)` is the single source for
  display + enforcement (imported by both frontend and Bun/Elysia server). `LimitBadge` +
  `FileDropzone` inline pre-upload validation; `/api/usage` + `useDailyUsage` for live daily quota.
- **Mobile full-screen-takeover pattern (9B–9E):** every redesigned tool branches on
  `useMediaQuery("(max-width:767px)")` **before** its desktop `return`, rendering a `fixed inset:0`
  overlay (safe-area header → shrinkable live preview/canvas → scrollable inline controls →
  sticky Apply), reusing all existing state/handlers/`lib/pdf` calls. Desktop is untouched.
- **Shared mobile primitives:** `EditPdf/BottomSheet.tsx`, `NumberField.tsx` (44×44 touch stepper),
  `ScaledPreview.tsx`, `MobileAnnotateToolbar.tsx`, `SignPdfMobile.tsx`, shared `CropCanvas`/
  `RedactCanvas`/`RedactConfirmModal`; `usePinchZoom` (`lib/touch.ts`) gained an optional `deps`
  param. Canvas pattern copied verbatim from Edit PDF (outer `overflow:hidden` + inner
  `overflow:auto`, no `alignItems:center`, no `touchAction:none` on the scroller).
- **SEO (9H):** `lib/structured-data.ts` adds `breadcrumbSchema` + `organizationSchema`
  (Organization rendered once in the locale layout); `lib/landing.ts` + `app/[locale]/landing/[slug]`
  drive 12 EN-only keyword landing pages (tr/ru `notFound()`, EN-only in `app/sitemap.ts`).
- **Pre-launch infra (9I):** cookieless PostHog (`persistence:"localStorage"`) + `PrivacyNotice`;
  branded 404 (`not-found.tsx` localized + `[...rest]` catch-all + root fallback) and error
  boundaries (`error.tsx`/`global-error.tsx`, Sentry capture); PWA `manifest.ts` + `next/og`
  `icon`/`apple-icon`; `OfflineIndicator` + `BrowserWarning`; route loading skeletons.
- **Perf/headers (9G):** global security headers in `next.config.ts` (no in-code host redirect —
  canonicalization is Vercel domain-level); preconnect hints; `.browserslistrc`; edit-pdf SSR LCP
  placeholder. `SITE_URL`/canonical = `https://www.plinypdf.com` (www = primary domain).

**Tool inventory:** 33 available tools + `summarize` (dormant, `available:false`) = 34 in
`lib/tools.ts`; all resolve to `app/[locale]/<slug>/page.tsx`. EN/TR/RU across all UI (27 i18n
namespaces, 958 leaf keys per locale, parity verified Wave 9J). Frontend on Vercel, backend
(PyMuPDF/Gotenberg) on Hetzner — Phase 9 was frontend-only (no Hetzner deploy).
