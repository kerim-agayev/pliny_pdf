# Phase 9 — Log

## [2026-06-15] Phase 9 started; docs/phase_9 tree created
Created index/decisions/architecture/bugs/log + waves/wave_9a..9j.

## [2026-06-15] Wave 9A — Limit UI Display implemented (gate pending)
- Fetched Phase 9 Claude Design handoff → `.design-handoff/phase-9/`.
- Added `getToolLimits(toolId, plan)` + `ToolLimits`/`BadgePlan` to `lib/limits.ts`; exported `SERVER_DAILY` from `lib/ratelimit.ts`.
- New `components/shared/LimitBadge.tsx` (all states, EN/TR/RU).
- New `app/api/usage/route.ts` + `lib/hooks/useDailyUsage.ts` (live daily quota).
- `FileDropzone`: `toolId` prop, renders LimitBadge, inline pre-upload size (red badge) + page errors; fixed B9-1 / B9-2.
- Added `toolId` to all 30 FileDropzone call sites (31 tools; text-to-pdf / markdown-to-pdf have no input → no badge).
- Added `LimitBadge` i18n namespace to en/tr/ru.json (real translations).
- `bun run build` green (exit 0). **GATE 9A pending user confirmation; not committed.**

## [2026-06-15] Wave 9A — GATE 9A round 1: 3 bugs fixed (gate still pending)
- B9-3: cloud tools (PDF→JPG etc.) now page-check client-side before upload; size+page violations show unified red badge + red border (no more post-upload toast).
- B9-4: fixed mis-tagged Annotate (`EditorTool` → `toolId="edit"`); added LimitBadge + inline over-limit to the cloud Edit PDF custom uploader (`EditPdf/index.tsx`) — now shows 10/30 MB · 15/50 pages · daily.
- B9-5: `useDailyUsage` fetches with `cache: "no-store"`; verified `/api/usage` mapping (`used = total − remaining`) is correct.
- `LimitBadge` gained `overUnit`/`filePages` + `overPages` i18n key (EN/TR/RU).
- `bun run build` green (exit 0). **GATE 9A still pending user confirmation.**

## [2026-06-15] Wave 9A — GATE 9A round 2: full 33-tool audit + 2 fixes
- Audited all 33 tools (4 checks each: FileDropzone/toolId, MB, pages, badge). Table in waves/wave_9a.md.
- B9-6: jpg-to-pdf image-count now inline (was toast); removed unused sonner import.
- B9-7: merge now guards TOTAL size + TOTAL pages client-side (inline ErrorBanner + disabled button) — EN/TR/RU keys added.
- Result: every tool enforces limits inline before processing (word-to-pdf pages remain server-side — docx can't be parsed client-side; documented).
- `bun run build` green (exit 0). **GATE 9A still pending user confirmation.**

## [2026-06-16] Wave 9F — 23 simple tools responsive audit (gate pending)
- Audited all 23 simple tools at 375px/768px. Codebase is mobile-first; 21 already responsive.
- Self-responsive patterns (auto-fill grids, flex-wrap min-w buttons, max-w fields, tall textareas) left untouched.
- Fix 1 — N-up Layout: `NupSheet` preview shrunk via `useMediaQuery` (`longSide` 380→300 on mobile); fixed 380px overflow.
- Fix 2 — Reverse Pages: comparison strips stack on mobile (`flex-col sm:flex-row`); token row `overflow-x-auto py-3` + `sm:` reset (no badge clip); desktop pixel-identical.
- CSS-only (1 hook reuse); no globals.css, no new components, no i18n, no backend.
- `bun run build` green (exit 0). **GATE 9F pending user confirmation; not committed.**

## [2026-06-16] ✅ GATE 9F PASSED (user-confirmed on real device)
- All 23 simple tools verified green at 375px/768px; desktop pixel-identical.
- N-up Layout + Reverse Pages fixes committed `bcca2b8` (frontend only, no Hetzner deploy).
- Next: Wave 9G — Performance + Memory + Bundle audit (next session).

## [2026-06-15] ✅ GATE 9A PASSED (user-confirmed on Vercel)
Wave 9A (Limit UI) complete: LimitBadge on all 33 tools, live daily quota, inline pre-upload size+page validation, full 33-tool audit. Next: Wave 9B (Annotate mobile) — awaiting user go-ahead.

## [2026-06-15] Wave 9B — Annotate PDF mobile redesign implemented (gate pending)
- Re-fetched Phase 9 design → `.design-handoff/phase-9/`; verified all 10 wave screens (9C–9E use `screen-p9-*` naming).
- Mobile full-screen takeover in `EditorTool.tsx` (route `pdf-editor`); desktop unchanged. New `MobileAnnotateToolbar.tsx` (props-driven). i18n `ToolPages.editor.mobile` EN/TR/RU.
- `bun run build` green. Committed `4b34927`, pushed for Vercel device testing.

## [2026-06-15] Wave 9B — GATE 9B rounds (5 bugs fixed)
- B9-8 long-press menu (move threshold + 500ms); B9-9 undo/redo (baseline + keep-current-on-top); B9-10 pinch-zoom binding (`usePinchZoom` deps param); B9-11 color sheet instant-close (defer open 120ms); B9-12 top bar hidden / no pan → copied Edit PDF canvas pattern exactly (outer overflow:hidden + inner overflow:auto, no alignItems:center, no touchAction:none on scroller).
- Added Delete button (mobile FAB + desktop) + Delete/Backspace key, undoable.
- Commits `664478b`, `1214c98`, `1412383`. `bun run build` green each round.

## [2026-06-15] ✅ GATE 9B PASSED (user-confirmed on Vercel)
Wave 9B (Annotate PDF mobile) complete: full-screen takeover matching Edit PDF mobile (scrollable dark canvas, pinch-zoom+pan, fixed bars), MobileAnnotateToolbar + option sheets, long-press menu, delete button + Del key, fixed undo/redo. Deviations D9-B1..B5 (no eraser/swipe-page/font-size/find on mobile) documented in waves/wave_9b.md. Next: Wave 9C (Sign PDF mobile) — awaiting user go-ahead; ask for design link (`screen-p9-sign.jsx`).

## [2026-06-16] Wave 9C — Sign PDF mobile redesign implemented (gate pending)
- Reused Phase 9 design (`screen-p9-sign.jsx`, already in `.design-handoff/phase-9/`).
- Refactored `lib/pdf/signPdf.ts` to `signPdf(file, PlacedSignature[])` (multi-signature engine, single doc load); desktop passes a one-element array → desktop UI unchanged.
- New `components/tools/SignPdfMobile.tsx`: full-screen 2-screen takeover (Create→Place). Create = Draw/Type/Upload + Fabric pad + ink/fonts; Place = dark canvas, touch drag/resize/delete per signature, per-instance scope, page nav, add-another. `SignPdf.tsx` renders it via `useMediaQuery("(max-width: 767px)")`.
- Added 14 `ToolPages.signPdf` mobile keys (EN/TR/RU) via minimal targeted edits (reverted an accidental full-file JSON reformat first).
- `bun run build` green. Committed `ae1f039`, pushed for Vercel device testing.

## [2026-06-16] Wave 9C — GATE 9C round 1: B9-13 Place-screen crash fixed
- B9-13: tapping "Next" crashed the Place screen (browser-level error, no React boundary). Root cause: create→place transition unmounted the Create screen + its Fabric-wrapped `<canvas>` while disposing fabric → React `removeChild` on a fabric-moved node threw in the commit phase (uncatchable, 100% repro).
- Fix: keep the Create layer mounted (hidden via `visibility`, never unmounted), overlay the Place layer; init Fabric once, dispose only on full unmount (matches desktop `SignPdf`). Mobile takeover now owns its own thumbnail loader; parent render effect skipped on mobile.
- Commit `aecc578`. `bun run build` green.

## [2026-06-16] ✅ GATE 9C PASSED (user-confirmed on Vercel)
Wave 9C (Sign PDF mobile) complete: 2-screen takeover (Create→Place), multi-signature placement (drag/resize/delete, per-instance scope), Draw/Type/Upload, EN/TR/RU. Decisions D9-C1..C4 (streamlined takeover not 4-step wizard; no add date/initials; reuse existing fonts; no pressure) in waves/wave_9c.md. Next: Wave 9D (Organize/Crop/Redact mobile) — awaiting user go-ahead; ask for design link (`screen-p9-organize.jsx`, `screen-p9-crop.jsx`, `screen-p9-redact.jsx`).

## [2026-06-16] Wave 9D — Organize/Crop/Redact mobile redesign implemented (gate pending)
- Design screens already local (`screen-p9-organize/crop/redact.jsx`). User scope decisions D9-D1 (skip Organize blank-page/FAB), D9-D2 (Redact confirm on both platforms), D9-D3 (Crop mobile simplified).
- Single-source-of-truth `useMediaQuery("(max-width:767px)")` branch in each component; full-screen mobile chrome; reused `BottomSheet`, dnd-kit, `createThumbLoader`.
- Organize: `SortableRow` vertical list + `verticalListSortingStrategy` + press-hold sensor; 3-dot BottomSheet (uid-scoped rotate/duplicate/move/delete); select mode + bulk; sticky Apply. Crop: shared `CropCanvas`, 44×44 handle hit-areas, pull-up panel. Redact: shared `RedactCanvas` + shared `RedactConfirmModal` (desktop+mobile) + bottom toolbar/sheets.
- i18n `mobile` + `confirm*` keys for organizePages/cropPdf/redactContent (en/tr/ru, key parity verified).
- `bun run build` green. Committed `a3a55b7`, pushed for Vercel device testing.

## [2026-06-16] Wave 9D — GATE 9D bug fixes (2 shared-level fixes)
- B9-14: success "Download" button overflowed at 375px → shared `SuccessPanel` (`ResultPanels.tsx`) actions now stack full-width on mobile, hide keyboard chips, `break-all` filename. Fixes all 23 SuccessPanel tools.
- B9-15: numeric inputs lacked touch steppers / values felt stuck → new shared `components/tools/NumberField.tsx` (`[−][input][+]`, 44×44 steppers, native spinners hidden via `.pp-number`, focus-gated value re-sync). Adopted in Split (From/To), Add Page Numbers (start/first), Repeat Pages (count); `ToolUI.decrease/increase` i18n (en/tr/ru). Crop manual inputs left as-is (desktop-only on mobile).
- `bun run build` green. Committed `22ca88f`, pushed.

## [2026-06-16] ✅ GATE 9D PASSED (user-confirmed on Vercel)
Wave 9D (Organize/Crop/Redact mobile) complete: touch-friendly mobile redesigns matching the Edit-PDF bar — Organize list+press-hold reorder+action sheet, Crop 44×44 handles+pull-up panel, Redact draw+find/color sheets+confirm modal (desktop too). Decisions D9-D1..D3 in decisions.md; GATE-9D bug fixes B9-14/B9-15 (success-button overflow, shared NumberField steppers). EN/TR/RU complete. Next: Wave 9E (form-heavy tools mobile — Edit Metadata, Add Watermark, Header & Footer, Add Page Numbers, Sign PDF Form Fields) — do NOT start until user go-ahead; ask for Phase 9 design handoff link at 9E start.

## [2026-06-16] Wave 9E — Form-heavy tools mobile redesign implemented (gate pending)
- Scope: **4 tools, not 5.** D9-E1: "Sign PDF Form Fields" does not exist (only `sign-pdf` draw-signature tool, done in 9C; no AcroForm fill tool; Phase-2 do-not-build per CLAUDE.md §13). Skipped, no new feature built. D9-E2: all controls inline, no BottomSheet (minimal-safe).
- Design screens already local (`screen-p9-metadata/watermark/header-footer/page-numbers.jsx`). Mirrored the shell only (preview-on-top + scroll + sticky Apply); did NOT add mock-only features (Text/Image tabs, rotation, font picker, number-style segments).
- Per tool: added `useMediaQuery("(max-width:767px)")` mobile branch **before** the existing desktop `return`, reusing all state/handlers/preview-effects/`lib/pdf` calls verbatim. Full-screen takeover (`fixed inset:0 z-60`), safe-area header (back=reset + title + filename), shrinkable live preview on top, scrollable inline controls (≥44–48px), sticky bottom Apply. Dropzone + SuccessPanel states left shared/unchanged.
- WatermarkTool: only preview-sizing change — `previewW = isMobile ? min(300, round(300·w/h)) : PREVIEW_W` so overlay math stays correct at 375px; desktop `previewW === PREVIEW_W` (identical). Header & Footer + Add Page Numbers reuse `ScaledPreview` (width-200 wrapper) — already responsive.
- i18n: added `ToolUI.removeFile` + per-tool `mobileTitle` to en/tr/ru via minimal targeted edits (namespace-anchored, no full-file reformat); JSON parse + key parity verified.
- `bun run build` green (exit 0; 156 static pages; only pre-existing Sentry deprecation warnings). Committed `d4946de` (10 files, frontend only — no Hetzner), pushed for Vercel device testing.

## [2026-06-16] ✅ GATE 9E PASSED (user-confirmed on Vercel)
Wave 9E (form-heavy tools mobile) complete: 4 tools (Edit Metadata, Add Watermark, Header & Footer, Add Page Numbers) get a full-screen mobile takeover (safe-area header → shrinkable live preview on top → scrollable inline controls → sticky Apply), reusing all existing state/handlers/preview/`lib/pdf` — desktop unchanged. Watermark gained a responsive mobile preview width (desktop `=== PREVIEW_W`). i18n `ToolUI.removeFile` + per-tool `mobileTitle` (en/tr/ru). Decisions D9-E1 (Sign PDF Form Fields skipped — tool doesn't exist, Phase-2 do-not-build) + D9-E2 (all controls inline, no BottomSheet) in decisions.md. EN/TR/RU complete. Next: Wave 9F (23 simple tools CSS responsive audit — CSS-only, no design needed) — do NOT start until user go-ahead.

## [2026-06-17] Wave 9G — Performance + Memory + Bundle audit (audit + fixes)
- Audit-first (no speculative changes). Findings: heavy tools already code-split (`next/dynamic ssr:false` in ToolMount; pdfjs/fabric async-imported); fonts `next/font` swap+subset; rate limits enforced in every cloud handler (anon 3/day, free 10/day); no large static images (SVG + `next/og`). Only 1 confirmed mem leak.
- Fix (mem): `JpgToPdfTool.tsx` created `URL.createObjectURL` inline in render, never revoked → now created per `files` change in `useEffect`, revoked on change/unmount. Commit `65ce88b`.
- First prod Lighthouse below target (BP 77, Perf 51/46, A 88-90, SEO 92). Round-2 fixes (confirmed vs report): security headers in `next.config.ts` (BP→100); `preconnect` ×3 + PostHog `disable_surveys`/`capture_dead_clicks:false` + `.browserslistrc` + static SSR LCP placeholder in `edit-pdf/page.tsx` (Perf; `ssr:false` left untouched); heading order `ToolCard` h3→p / `ToolsCatalog` h3→h2 + contrast `--text-3`→`--text-2` (footer/RecentFiles); footer `contain:layout` (CLS). Commits `fb51e0e`, `56c87e6`.
- Incident: tried www→apex `redirects()` in `next.config.ts` → `ERR_TOO_MANY_REDIRECTS` in prod (fought Vercel domain redirect). Reverted `39274d9`. Primary domain confirmed **www.plinypdf.com**; `SITE_URL`/canonical set to www `abdb764`. Host canonicalization stays at Vercel domain level, never in code.
- All frontend only — no Hetzner deploy. `bun run build` green each round.

## [2026-06-17] ✅ GATE 9G PASSED (user-confirmed on Vercel prod, mobile incognito)
Wave 9G (perf/memory/bundle audit) complete. Lighthouse all targets met: homepage P91/A96/BP100/SEO100, /tools P97/A100/BP100/SEO100, /edit-pdf P94/A100/BP100/SEO100, desktop P100/A96/BP100/SEO100. Audit confirmed the system was already strong; net code change = 1 mem-leak fix + global security headers + perf hints (preconnect/PostHog trim/browserslist/edit-pdf SSR LCP placeholder) + a11y heading/contrast + footer CLS + canonical→www. Next: Wave 9H (SEO + landing pages + blog) — do NOT start until user go-ahead.

## [2026-06-17] Wave 9H — SEO + landing pages + blog (scope check + gaps built)
- Mandated scope check first: ~85% of 9H already shipped (unique 33-tool meta `lib/seo.ts`; SoftwareApplication/FAQPage/HowTo `lib/structured-data.ts`; related-tools `ToolShell`; sitemap; robots; 5 blog posts). Presented findings + 4 questions; user chose: 12 EN landing pages via template (not 36×3, D9-H1), keep existing 5 blog posts (D9-H2), no category hubs (D9-H3), EN-only landing.
- Built gaps only (D9-H4): `breadcrumbSchema(locale, items)` + `organizationSchema()` added to `lib/structured-data.ts`; `toolSchemas(slug, locale?)` now appends Home→Tools→tool BreadcrumbList. Updated all 33 tool `page.tsx` to `toolSchemas(slug, locale)` (regex batch; stripped the PS5.1 UTF-8 BOM it introduced). Organization rendered once in `app/[locale]/layout.tsx` (logo=`/api/og` PNG, no standalone asset). Blog post page: BlogPosting now paired with BreadcrumbList (Home→Blog→post).
- Landing: new `lib/landing.ts` (12 keyword topics, each → primary tool + related + 3 FAQ, EN copy inline) + new `app/[locale]/landing/[slug]/page.tsx` template (hero + intro + CTA + FAQ + related grid; FAQPage+BreadcrumbList JSON-LD; `notFound()` for non-en). `app/sitemap.ts` emits EN-only `/en/landing/<slug>` (priority 0.7, x-default=en).
- Verified on prod server: `/en/landing/compress-pdf-online-free`→200, `/tr/landing/…`→404, unknown→404; tool page JSON-LD = FAQPage+HowTo+BreadcrumbList+Organization (canonical www); blog = BlogPosting+BreadcrumbList+Organization; sitemap = 12 landing slugs EN-only (no tr/ru), robots unchanged.
- Frontend only, no Hetzner. `bun run build` green (Next 16.2.6, compiled ~17s). Committed `7f01556`, pushed for Vercel testing. **GATE 9H pending user confirmation.**

## [2026-06-17] ✅ GATE 9H PASSED (user-confirmed on Vercel)
Wave 9H (SEO + landing pages + blog) complete. User tested green: `/en/landing/compress-pdf-online-free` + `/en/landing/best-free-pdf-editor` render, tool-page schema present, sitemap has landing pages. Net: BreadcrumbList wired into tool/blog/landing JSON-LD + standalone Organization schema (global layout) + 12 EN-only landing pages (template `app/[locale]/landing/[slug]` + `lib/landing.ts`) + EN-only `/en/landing/<slug>` sitemap entries. Existing 5 blog posts kept (D9-H2), no category hubs (D9-H3), 36→12 EN landing (D9-H1), gaps-only build (D9-H4). Frontend only, commit `7f01556`. Next: Wave 9I (critical pre-launch items — 404, OG image, cookie consent, favicon, loading skeletons, offline indicator, browser warning, Sentry) — do NOT start until user go-ahead.

## [2026-06-17] Wave 9I — critical pre-launch items (scope check + gaps built)
- Mandated scope check first (3 Explore agents): most of 9I already shipped — OG images (`app/api/og/route.tsx` + `lib/seo.ts`), favicon (`app/favicon.ico`), Sentry (`instrumentation*.ts` + server/edge configs, DSN-gated, capturing), keyboard shortcuts (`EditorTool.tsx` ⌘Z/⌘Y/Del/Esc), tool-page skeletons (`ToolSkeleton` via `ToolMount`). Presented findings + 4 questions.
- User decisions: D9-I1 cookie consent = cookieless + light notice (not GDPR wall); D9-I2 icons via `next/og` (no PNG assets); D9-I3 email verification stays disabled (intentional Phase 1); extras = build all (error UI, offline, browser warning, dashboard/catalog skeletons).
- Built gaps only: (1) `PostHogProvider` → `persistence:"localStorage"` (cookieless; capture unchanged) + opt-out re-applied from `ANALYTICS_CONSENT_KEY`; new `PrivacyNotice.tsx` (Got it / Opt out); privacy page cookies reworded. (2) Branded 404: `app/[locale]/not-found.tsx` (localized, popular `ToolCard`s) + `app/[locale]/[...rest]/page.tsx` catch-all (set locale → `notFound()`) + `app/not-found.tsx` root fallback. (3) PWA: `app/manifest.ts` + `app/icon.tsx` (512) + `app/apple-icon.tsx` (180) via `next/og`; layout `metadata.manifest`/`appleWebApp` + `viewport.themeColor`. (4) `app/[locale]/error.tsx` + `app/global-error.tsx` (Sentry capture). (5) `OfflineIndicator.tsx`. (6) `BrowserWarning.tsx` (IE + Safari<14 only). (7) `dashboard/loading.tsx` + `tools/loading.tsx`.
- All three banners/notice mounted in `app/[locale]/layout.tsx`. i18n namespaces `PrivacyNotice`/`NotFound`/`ErrorPage`/`OfflineIndicator`/`BrowserWarning` added to en/tr/ru.
- Flagged (not changed): `PostHogProvider` defaults `api_host` to `us.i.posthog.com` while layout preconnects `eu` — assumed overridden by `NEXT_PUBLIC_POSTHOG_HOST` in prod.
- `bun run build` green (Next 16.2.6; `/icon`, `/apple-icon`, `/manifest.webmanifest` prerendered static; only pre-existing Sentry deprecation warnings). Committed `fb7f32c` (19 files, frontend only — no Hetzner), pushed for Vercel testing. **GATE 9I pending user confirmation.**

## [2026-06-17] ✅ GATE 9I PASSED (user-confirmed on Vercel, real device + browser)
Wave 9I (critical pre-launch items) complete. All tests green: branded 404 (localized + root fallback), PWA manifest + icons / add-to-home-screen, first-visit privacy notice + opt-out (no analytics cookie — only auth session cookie), offline banner, old-browser warning, branded error UI + Sentry capture, loading skeletons. Net: gaps-only build over an already-strong base — cookieless PostHog + PrivacyNotice (D9-I1), branded 404 (not-found + catch-all + root fallback), PWA manifest + `next/og` icons (D9-I2), error.tsx/global-error.tsx, OfflineIndicator, BrowserWarning (IE/Safari<14), dashboard/tools skeletons. Email verification left disabled (D9-I3). Frontend only, commit `fb7f32c`. Next: Wave 9J (Final QA + Phase 9 docs complete — full QA pass, real-device testing, perf regression, docs, final commit) — do NOT start until user go-ahead.
