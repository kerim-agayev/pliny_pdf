# Phase 9 — Decisions

## D9-1 — Limits stay centralized in `lib/limits.ts`; add `getToolLimits` lookup
The audit confirmed `lib/limits.ts` is imported by **both** the Next.js frontend and the
Bun/Elysia server routes, so front/back limit values can never diverge. Rather than scatter
per-tool `localMaxMB`/`officeMaxMB`/… calls, Wave 9A adds one `getToolLimits(toolId, plan)`
returning `{ mb, count, unit, cloud, dailyLimit? }`. Both the LimitBadge and the dropzone
pre-upload check read it → display always matches enforcement.

## D9-2 — Live daily quota via new `/api/usage` (user-approved)
The design badge shows "Today 7/10". `remainingServerTool()` existed but was server-only
(dashboard SSR). Added `app/api/usage/route.ts` (App Router, same origin) + `useDailyUsage()`
hook. Pro → no daily line. Anon keyed by `clientIp` (mirrors backend; best-effort bucket
alignment across Vercel/Hetzner proxies). Fails silently → badge omits the daily line, never
blocks. (User chose this over a static "Up to X/day".)

## D9-3 — Inline pre-upload errors replace toasts (when a badge is present)
Size violations now flip the LimitBadge to its red `over` state + a red dropzone border
*before* any upload, instead of a post-selection toast. Page violations show an inline red
line. Toast path retained as a fallback for any toolId-less dropzone.

## D9-4 — Free-tier sub-line + anon upsell use real per-tool limits
The design prototype hardcoded "Anonymous tier: 10 MB · 30 pages". We compute both tiers
via `getToolLimits(toolId, "anon"|"free")` so cloud tools (e.g. office 15/50 MB) show correct
numbers instead of the local hardcode. Faithful to design intent, corrected for accuracy.

## D9-5 — jpg-to-pdf shows "images"; nup/repeat show input limits
`getToolLimits` returns `unit: "images"` for jpg-to-pdf (image count, not pages). N-up and
Repeat Pages display their **input** local MB·pages in the badge; their **output** page caps
(`NUP_/REPEAT_MAX_OUTPUT_PAGES`) remain separate in-tool validation, unchanged.

## D9-6 — `maxSizeMB` kept as harmless fallback at call sites
`checkPages` is retained (it still gates whether page validation runs). `maxSizeMB` is now
superseded by `getToolLimits().mb` but left in place to avoid touching each tool's `maxMB`
computation (surgical; no behavior change since `limits.mb` takes precedence).

## D9-7 — Live FileMeter not wired from FileDropzone
The badge supports a live "4.2 / 25 MB" meter, but the dropzone hands valid files off
immediately (parent unmounts it), so there's no persistent loaded file to meter. Component
supports it for future use; not triggered in 9A. Over-limit (rejection) IS wired.

---

# Wave 9D decisions
> Numbered D9-D* to match the per-wave scheme (9B → D9-B*, 9C → D9-C*) and avoid colliding
> with the Wave 9A globals D9-1..D9-7. (User shorthand "D9-1/2/3" = these three.)

## D9-D1 — Organize Pages: blank-page feature + FAB skipped
The design (mobile FAB + desktop "Add blank" button) implied adding a blank-page insert, but
that's a NEW feature requiring new pdf-lib logic — and Phase 9 is "no new tools/features". User
chose to skip it. The mobile Organize redesign is layout-only, reusing the existing operations
(reorder / rotate / duplicate / move / delete / select). No FAB rendered.

## D9-D2 — Redact: permanent-action confirm modal on BOTH platforms
Redaction is irreversible and previously had only warning banners + a red button (no confirm) on
either platform. User chose to add a confirmation modal on desktop AND mobile. Implemented as one
shared `RedactConfirmModal` (centered modal on desktop, bottom-sheet on mobile); the Apply button
now opens the confirm, whose primary action calls the existing `apply()`.

## D9-D3 — Crop mobile: simplified controls (exact-box stays desktop-only)
The Crop tool has aspect presets, All/Current/Range scope, a unit selector, and exact mm/in/px
box inputs. The mobile pull-up panel surfaces only presets + All/This-page scope + reset + apply
(matching the design). The exact-box inputs, unit selector, and page-range scope remain
desktop-only — avoids cramming + touching the unit-conversion logic on phones.

---

# Wave 9E decisions

## D9-E1 — "Sign PDF Form Fields" skipped — tool does not exist
CLAUDE_9.md Wave 9E listed 5 tools, but `lib/tools.ts` registers no AcroForm form-field
fill/detect tool. Only `sign-pdf` (draw/type/upload a signature) exists — already mobile-done in
Wave 9C — which is a different tool. Form fill/create is an explicit **Phase-2 do-not-build** item
(CLAUDE.md §13). A design mock (`screen-p9-form-fields.jsx`) exists but was never implemented.
User confirmed: skip it, build NO new feature. Wave 9E shipped mobile for the 4 existing
form-heavy tools only.

## D9-E2 — All controls inline on mobile (no BottomSheet) — minimal-safe
The Phase-9 mocks tuck secondary style options (font/size/color) into a BottomSheet ("Font, size
& color"). User chose the lowest-risk path instead: every existing control stays stacked inline in
the scrollable area (preview on top, sticky Apply at bottom). Fewer moving parts, faster to verify,
nothing new to wire — `useMediaQuery`, `NumberField`, `ScaledPreview`, and the safe-area pattern
are reused, but `BottomSheet` is not used in this wave.

---

# Wave 9H decisions

## D9-H1 — 12 EN landing pages (template), not 36 × 3 locales
CLAUDE_9.md says "36 landing pages, full list in design handoff" — but no list exists anywhere
(the design handoff holds only the 10-tool mobile component designs). User chose the
template-+-fewer-pages path: **one** dynamic route `app/[locale]/landing/[slug]/page.tsx` driven by
`lib/landing.ts`, with **12** keyword-targeted topics (each mapped to a high-value tool for internal
linking), **English only**. EN-only avoids thin machine-translated content and is the primary global
SEO market; non-en locales `notFound()` and are excluded from the sitemap. 36 hand-written pages and
TR/RU translations can come in Phase 10 if the 12 prove out. GATE 9H's "36 landing pages live" line is
superseded by this decision.

## D9-H2 — Keep the existing 5 blog posts; do not write the 5 spec topics
5 posts already ship (`best-free-pdf-editor-2026`, `gdpr-and-pdf-tools`,
`how-plinypdf-protects-your-privacy`, `how-to-compress-pdf-without-losing-quality`,
`why-you-should-never-upload-pdfs`) — different titles than CLAUDE_9.md's 5 ("How PDF compression
works", "PlinyPDF vs Sejda vs iLovePDF", …) but the same count and overlapping themes. User chose to
treat the existing 5 as satisfying the gate (verify-only). This wave just confirmed they render in
en/tr/ru and added BreadcrumbList. No new posts written.

## D9-H3 — No dedicated category hub routes
The spec floats "Convert PDF to ___" / "Edit ___" hub pages. User chose to skip them — the existing
`/tools?category=X` filtered catalog already groups tools by category, and the new landing pages each
carry a related-tools grid. Avoids new routes for marginal SEO clustering gain.

## D9-H4 — Most of Wave 9H was already done; only gaps built
The mandated scope check found unique 33-tool meta, SoftwareApplication/FAQPage/HowTo schemas,
related-tools linking, sitemap, and robots already shipped. Only genuinely missing: BreadcrumbList
(added via `breadcrumbSchema`, wired into tool/blog/landing pages) and a standalone Organization schema
(added via `organizationSchema`, rendered once in the locale layout; logo points at the dynamic
`/api/og` PNG since no standalone logo asset exists). `summarize` (available:false) keeps its dormant
SEO/FAQ data — harmless, left as-is.

---

# Wave 9B decisions (re-layout only — Phase 9 adds no new features)
> Full detail in `waves/wave_9b.md`. Backfilled here in Wave 9J for a single decisions index.

## D9-B1 — No eraser on mobile
Deletion is via the long-press context menu / Delete button (matches the design); the eraser tool
is not surfaced on the mobile Annotate toolbar.

## D9-B2 — No swipe-to-page
Page navigation uses chevrons + the Pages drawer. Single-finger touch is reserved for draw/move;
the design uses explicit page controls. User-accepted.

## D9-B3 — Text/sticky option sheets are Color-only
No font/size/bold-italic, no highlight-opacity slider, no shape-fill toggle on mobile — the Annotate
engine doesn't have those, and adding them would be new features.

## D9-B4 — No Find pill on mobile
Annotate has no find/replace, so no Find control in the mobile secondary row.

## D9-B5 — Real safe-area insets replace mockup chrome
The mockup's `StatusBar9`/`HomeIndicator` are device-frame chrome → implemented with real
`env(safe-area-inset-*)`.

---

# Wave 9C decisions

## D9-C1 — Streamlined 2-screen takeover, not the literal 4-step wizard
Mobile Sign PDF uses a Create→Place 2-screen takeover (reusing the Wave 9B pattern) rather than the
4-step Phone9 wizard in `screen-p9-sign.jsx`.

## D9-C2 — No "Add date" / "Add initials"
Those Place-step extras from the design were skipped (not in the gate; Simplicity First).

## D9-C3 — Reuse existing `SIG_FONTS`
Type mode reuses the shipped signature font families rather than loading the design's Google
handwriting fonts (avoids new web-font weight).

## D9-C4 — No pressure sensitivity
Fabric's `PencilBrush` doesn't expose pointer pressure; out of scope.

---

# Wave 9I decisions

## D9-I1 — Cookie consent = cookieless + light notice (not a GDPR consent wall)
PostHog uses `persistence: "localStorage"` only → no tracking cookie → the privacy page's
"no analytics cookies" claim is true. A first-visit dismissible `PrivacyNotice` (Got it / Opt out)
covers transparency. Lowest risk to analytics capture.

## D9-I2 — PWA icons generated via `next/og` (no binary PNG assets)
`app/icon.tsx` (512) + `app/apple-icon.tsx` (180) render a "P" mark on indigo, consistent with the
OG route — no standalone image files to maintain.

## D9-I3 — Email verification left disabled
Intentional Phase 1 decision (`requireEmailVerification:false`). Wave 9I item 9 treated as a no-op.
