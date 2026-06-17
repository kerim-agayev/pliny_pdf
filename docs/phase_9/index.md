# Phase 9 — Pre-Launch Polish · Index

> Read `CLAUDE_9.md` first, then this file. Phase 1–8 docs are READ-ONLY.

## Current Status
- Phase: 9 (pre-launch polish) — **✅ COMPLETE (all 10 waves 9A–9J gate-passed; GATE 9J 2026-06-17)**
- Last completed: **Wave 9J — final QA + Phase 9 docs — ✅ COMPLETE / GATE 9J PASSED (2026-06-17, user-confirmed)**. Closing wave, no new code. Automated checks all green (build exit 0; i18n parity en=tr=ru 27 namespaces / 958 keys; 33 available tools + `summarize` dormant all route; 12 EN landing pages + sitemap; 5 blog posts). Final spot-check (tools desktop+375px, landing, blog EN/TR/RU, dark mode, iPhone+Android) confirmed. Docs completed: decisions backfilled (D9-B*/C*/I*), architecture summary, bugs reaffirmed, all wave files DONE. Docs-only commit.
- **Phase 9 closed → Phase 10 can begin** (launch prep: ProductHunt/HN/Reddit, Help/FAQ, demo video, onboarding, social proof — see CLAUDE_9.md §8).

## Waves
- 9A: Limit UI on all tools — LimitBadge + per-tool getToolLimits + live daily quota — **✅ GATE 9A PASSED (2026-06-15)**
- 9B: Annotate PDF mobile — full-screen takeover (MobileAnnotateToolbar + Edit-PDF canvas pattern) — **✅ GATE 9B PASSED (2026-06-15)**
- 9C: Sign PDF mobile — 2-screen takeover (Create→Place) + multi-placement (`signPdf` array engine) — **✅ GATE 9C PASSED (2026-06-16)**
- 9D: Organize/Crop/Redact mobile — full-screen branches; Organize list+press-hold reorder, Crop 44×44 handles+pull-up panel, Redact draw+confirm modal (both platforms) — **✅ GATE 9D PASSED (2026-06-16)**
- 9E: form-heavy tools mobile (Edit Metadata, Add Watermark, Header & Footer, Add Page Numbers) — **✅ GATE 9E PASSED (2026-06-16)**. 4 tools (not 5: Sign PDF Form Fields skipped, D9-E1 — no such tool). Full-screen mobile branch per tool; all controls inline (D9-E2). Commit `d4946de`.
  - NOTE: Wave 9D–9E design screens use `screen-p9-*.jsx` naming (e.g. `screen-p9-organize.jsx`), not `screen-*-mobile.jsx`. All present in `.design-handoff/phase-9/`.
- 9F: 23 simple tools responsive audit — **✅ GATE 9F PASSED (2026-06-16)**. 21/23 already responsive (mobile-first codebase); fixes: N-up Layout preview `longSide` 380→300 on mobile (`useMediaQuery`), Reverse Pages strips stack `flex-col sm:flex-row` + token-row `overflow-x-auto py-3`/`sm:` reset. CSS-only, desktop pixel-identical. Commit `bcca2b8`.
- 9G: perf/memory/bundle audit — **✅ GATE 9G PASSED (2026-06-17)**. Audit-first (system already strong: tools code-split, fonts swap+subset, rate limits enforced). 1 mem leak fixed (JpgToPdf object URL). Lighthouse round-2 fixes: security headers (BP 77→100), preconnect + PostHog trim + `.browserslistrc` + edit-pdf SSR LCP placeholder (Perf), a11y heading-order + `--text-3`→`--text-2` contrast, footer `contain:layout` (CLS), canonical→www. www→apex `redirects()` tried & reverted (loop). Frontend only.
- 9H: SEO + landing + blog — **✅ GATE 9H PASSED (2026-06-17)**. Scope check: ~85% already done (33-tool meta, SoftwareApplication/FAQPage/HowTo, related-tools, sitemap, robots, 5 blog posts). Built gaps only: `breadcrumbSchema` (Home→Tools→tool on 33 pages; Home→Blog→post; Home→landing) + `organizationSchema` (global in layout, logo=`/api/og`) + 12 EN-only landing pages (template `app/[locale]/landing/[slug]` + `lib/landing.ts`, `notFound()` for tr/ru) + EN-only sitemap entries. Existing 5 blog posts kept (D9-H2), no category hubs (D9-H3). 36→12 EN landing (D9-H1).
- 9I: critical pre-launch items — **✅ GATE 9I PASSED (2026-06-17)**. Scope check: most already shipped (OG/favicon/Sentry/shortcuts/tool skeletons). Built gaps: cookieless PostHog (`persistence:"localStorage"`) + `PrivacyNotice` (D9-I1); branded 404 (`not-found.tsx` localized + `[...rest]` catch-all + root `not-found.tsx`); PWA `manifest.ts` + `icon.tsx`/`apple-icon.tsx` via `next/og` (D9-I2); `error.tsx`/`global-error.tsx` (Sentry capture); `OfflineIndicator`; `BrowserWarning` (IE/Safari<14); dashboard/tools `loading.tsx`. Email verify left off (D9-I3). Commit `fb7f32c`.
- 9J: final QA + docs — **✅ GATE 9J PASSED (2026-06-17)**. Automated checks green (build, i18n parity, tool routes, 12 landing, sitemap, 5 blog); manual spot-check confirmed; docs/phase_9 completed. **Phase 9 COMPLETE.**

## Key Files (Wave 9A)
- `components/shared/LimitBadge.tsx` — reusable limit indicator (ported from Phase 9 design)
- `lib/limits.ts` — `getToolLimits(toolId, plan)` + `ToolLimits`/`BadgePlan` (single source of truth)
- `lib/ratelimit.ts` — exports `SERVER_DAILY = { anon: 3, free: 10 }`
- `components/tools/FileDropzone.tsx` — renders LimitBadge, inline pre-upload size/page validation
- `app/api/usage/route.ts` + `lib/hooks/useDailyUsage.ts` — live daily quota for cloud tools
- `.design-handoff/phase-9/` — Claude Design bundle (LimitBadge in `project/phase9-kit.jsx`)

## Key Files (Wave 9B)
- `components/tools/EditorTool.tsx` — Annotate PDF (route `pdf-editor`); mobile full-screen takeover
- `components/tools/MobileAnnotateToolbar.tsx` — new, props/callback-driven bottom toolbar + option sheets
- `lib/touch.ts` — `usePinchZoom` now takes an optional `deps` param (re-bind on mount)
- Design screen: `.design-handoff/phase-9/.../project/screen-annotate-mobile.jsx` (+ `-core`, `-desktop`)

## Key Files (Wave 9C)
- `components/tools/SignPdfMobile.tsx` — new mobile takeover (Create→Place, multi-placement); Create layer stays mounted so fabric/React never race
- `components/tools/SignPdf.tsx` — `useMediaQuery` mobile branch; array-form sign call; render effect mobile-guarded
- `lib/pdf/signPdf.ts` — `signPdf(file, PlacedSignature[])` (multi-signature engine; desktop passes single-element array)
- Design screen: `.design-handoff/phase-9/.../project/screen-p9-sign.jsx`

## Key Files (Wave 9D)
- `components/tools/OrganizePages.tsx` — mobile vertical-list branch; module-level `SortableRow` (`verticalListSortingStrategy`); press-hold `PointerSensor` `{delay:180,tolerance:8}`; 3-dot `BottomSheet` (uid-scoped helpers); select mode + sticky Apply
- `components/tools/CropPdf.tsx` — shared `CropCanvas` (44×44 handle hit-area on mobile); mobile pull-up panel (presets + scope + reset + apply)
- `components/tools/RedactContent.tsx` — shared `RedactCanvas` + shared `RedactConfirmModal` (desktop centered / mobile sheet, both platforms); mobile bottom toolbar + Find/color `BottomSheet`s
- Shared reuse: `components/tools/EditPdf/BottomSheet.tsx`, `lib/hooks/useMediaQuery.ts`, dnd-kit, `lib/pdf/thumbnailLoader.ts`
- Design screens: `.design-handoff/phase-9/.../project/screen-p9-organize.jsx`, `screen-p9-crop.jsx`, `screen-p9-redact.jsx`

## Key Files (GATE 9D bug fixes)
- `components/tools/NumberField.tsx` — NEW shared touch number stepper (`[−][input][+]`, 44×44, native spinners hidden); used by Split / Add Page Numbers / Repeat Pages
- `components/tools/ResultPanels.tsx` — `SuccessPanel` actions stack full-width on mobile (download no longer overflows)
- `app/globals.css` — `.pp-number` spinner-hide rules

## Key Files (Wave 9E)
- `components/tools/EditMetadata.tsx` — mobile branch (no preview): header + scroll form + sticky Save
- `components/tools/WatermarkTool.tsx` — mobile branch + responsive `previewW` (mobile fits 375px; desktop `=== PREVIEW_W`, unchanged); preview-top + inline controls + sticky Apply
- `components/tools/HeaderFooter.tsx` — mobile branch; `ScaledPreview` (width-200) + band overlays + page nav on top; inline `BandConfig` ×2 + Skip-First + sticky Apply
- `components/tools/AddPageNumbers.tsx` — mobile branch; `ScaledPreview` + nav on top; inline position grid / format dropdown / `NumberField` / sliders / swatches + sticky Apply
- Shared reuse (as-is): `lib/hooks/useMediaQuery.ts`, `components/tools/NumberField.tsx`, `components/tools/ScaledPreview.tsx`, safe-area inline pattern
- i18n: `ToolUI.removeFile` + per-tool `mobileTitle` (en/tr/ru, parity verified)
- Design screens: `.design-handoff/phase-9/.../project/screen-p9-metadata.jsx`, `screen-p9-watermark.jsx`, `screen-p9-header-footer.jsx`, `screen-p9-page-numbers.jsx`

## Key Files (Wave 9G)
- `next.config.ts` — `headers()` global security headers (HSTS etc.). NO `redirects()` (host canonicalization is Vercel domain-level; in-code redirect caused a loop).
- `app/[locale]/layout.tsx` — 3 `<link rel="preconnect">` (PostHog/Sentry)
- `components/analytics/PostHogProvider.tsx` — `disable_surveys` + `capture_dead_clicks:false`
- `app/[locale]/edit-pdf/page.tsx` — static `aria-hidden` SSR LCP placeholder (covered by editor's `fixed inset:0 z-50` shell)
- `lib/seo.ts` — `SITE_URL` default `https://www.plinypdf.com` (www = primary domain)
- `.browserslistrc` — drops legacy JS polyfills
- `components/tools/JpgToPdfTool.tsx` — object-URL leak fix (revoke on files change/unmount)
- a11y/CLS: `ToolCard.tsx` (h3→p), `ToolsCatalog.tsx` (h3→h2), `Footer.tsx` (contrast + `contain:layout`), `RecentFiles.tsx` (contrast)

## Key Files (Wave 9H)
- `lib/structured-data.ts` — `breadcrumbSchema(locale, items)`, `organizationSchema()`, `toolSchemas(slug, locale?)` (appends BreadcrumbList when locale passed)
- `lib/landing.ts` — NEW; `LANDING` (12 EN topics, each → primary tool + related + FAQ), `landingSlugs`, `getLanding`
- `app/[locale]/landing/[slug]/page.tsx` — NEW; EN-only template (hero + CTA + FAQ + related grid + FAQPage/BreadcrumbList JSON-LD; `notFound()` for tr/ru)
- `app/[locale]/layout.tsx` — global `<JsonLd data={organizationSchema()} />`
- `app/[locale]/blog/[slug]/page.tsx` — BlogPosting now paired with BreadcrumbList
- `app/sitemap.ts` — EN-only `/en/landing/<slug>` entries (priority 0.7, x-default=en)
- 33 tool `app/[locale]/<slug>/page.tsx` — `toolSchemas(slug, locale)` (one-line each)

## Key Files (Wave 9I)
- `components/analytics/PostHogProvider.tsx` — `persistence:"localStorage"` (cookieless), opt-out re-applied from `ANALYTICS_CONSENT_KEY`
- `components/shared/PrivacyNotice.tsx` — NEW first-visit dismissible notice (Got it / Opt out → `posthog.opt_out_capturing()`)
- `components/shared/OfflineIndicator.tsx` — NEW online/offline banner; `components/shared/BrowserWarning.tsx` — NEW IE/Safari<14-only banner
- `app/[locale]/not-found.tsx` — NEW localized branded 404 (popular `ToolCard`s); `app/[locale]/[...rest]/page.tsx` — NEW catch-all; `app/not-found.tsx` — NEW root fallback (own `<html>`)
- `app/[locale]/error.tsx` + `app/global-error.tsx` — NEW branded error boundaries (Sentry capture)
- `app/manifest.ts` + `app/icon.tsx` (512) + `app/apple-icon.tsx` (180) — NEW PWA manifest + `next/og` icons
- `app/[locale]/dashboard/loading.tsx` + `app/[locale]/tools/loading.tsx` — NEW route skeletons (`pp-skeleton`)
- `app/[locale]/layout.tsx` — mounts the three client components; `metadata` gains `manifest`/`appleWebApp`; new `viewport.themeColor`
- `app/[locale]/privacy/page.tsx` — cookies section reworded (cookieless analytics, opt-out)
- i18n: `PrivacyNotice`/`NotFound`/`ErrorPage`/`OfflineIndicator`/`BrowserWarning` namespaces in en/tr/ru

## Design Handoff
- Saved to `.design-handoff/phase-9/`. LimitBadge + updated FileDropzone (`Dropzone9`) in `project/phase9-kit.jsx`; tokens in `project/brand.css`; behavior notes in `project/PlinyPDF Design.html`; intent in `chats/chat4.md`.
