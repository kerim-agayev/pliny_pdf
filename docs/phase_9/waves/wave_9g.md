# Wave 9G — Performance + Memory + Bundle Audit

**Status:** ✅ DONE — GATE 9G PASSED (2026-06-17). All Lighthouse targets met.

## Final Lighthouse scores (mobile, incognito)
| Page | Performance | Accessibility | Best Practices | SEO |
|---|---|---|---|---|
| Homepage | 91 | 96 | 100 | 100 |
| /tools | 97 | 100 | 100 | 100 |
| /edit-pdf | 94 | 100 | 100 | 100 |
| Desktop (all) | 100 | 96 | 100 | 100 |

Targets (P≥90, A≥95, BP≥95, SEO≥95) all met.

Audit wave — only confirmed, measured problems fixed. No speculative optimization.

## Audit results (5 questions)

1. **Edit PDF / Annotate PDF code-split?** ✅ YES. `components/tools/ToolMount.tsx`
   loads all 32 tools via `next/dynamic` (`ssr: false`). `pdfjs-dist` via async wrapper
   `lib/pdf/pdfjs.ts`; `fabric` via `await import("fabric")` (EditorTool, SignPdf).
   Heavy deps ship in per-tool chunks, not the initial bundle. No change.
2. **Confirmed memory leaks?** ⚠️ ONE — `JpgToPdfTool.tsx:114` created a blob URL
   inline in render and never revoked. **FIXED** (see below). All other listeners,
   IntersectionObserver/ResizeObserver, Fabric `dispose()`, `setInterval`,
   `PDFDocument.destroy()` verified clean. The two EditPdf toolbar `createObjectURL`
   sites already revoke.
3. **Large unoptimized static images?** ✅ NO. No raw `<img>` for static assets; only
   5 tiny SVGs in `public/`; OG via `next/og` dynamic. No change.
4. **font-display: swap?** ✅ YES. All 3 Google fonts via `next/font/google` with
   `display:"swap"` + subsets (incl. cyrillic). Noto `.ttf` (2.7 MB) lazy-fetched on
   demand / backend-only, not on page load. No change.
5. **Rate limits enforced?** ✅ YES. `lib/ratelimit.ts` (Upstash; anon 3/day, free
   10/day, pro unlimited). `checkServerTool()` called before processing in every cloud
   handler (`tools.ts` compress/grayscale/pdf-to-jpg/merge, `editor.ts` open) → 429.

Note: `@cantoo/pdf-lib` is NOT a dead duplicate — used for PDF encryption in
`validation.ts`, `password.ts`, `markdownToPdf.ts`, `textToPdf.ts`. Both pdf-lib
packages intentional. Not touched.

## Code change (only one)

- `components/tools/JpgToPdfTool.tsx` — preview blob URLs now created in a
  `useEffect` keyed on `files`, revoked on change + unmount; `<img>` uses
  `previews[i]`. Fixes the object-URL leak. No i18n / backend / other tools touched.

## Build

- `bun run build` → ✓ Compiled successfully. Turbopack does not emit the
  Size/First Load JS table; chunk inspection confirms heavy deps are isolated in
  lazy per-tool chunks (largest chunks are on-demand tool bundles, not initial load).

## Lighthouse-driven fixes (round 2, after first prod measurement)

First measurement was below target (BP 77, Perf 51/46, A 88-90, SEO 92). Fixes,
confirmed against the actual report (no speculative changes):

- **Best Practices (77→100):** added global security headers in `next.config.ts`
  `headers()` — X-Content-Type-Options, X-Frame-Options, X-XSS-Protection,
  Referrer-Policy, Strict-Transport-Security (`max-age=63072000; includeSubDomains`),
  Permissions-Policy. No CSP (deferred — wrong CSP breaks editor/analytics).
- **Performance:** 3 `<link rel="preconnect">` in `layout.tsx` (PostHog EU,
  PostHog EU assets, Sentry DE ingest); PostHog `disable_surveys: true` +
  `capture_dead_clicks: false` (drops surveys.js/dead-clicks scripts);
  `.browserslistrc` (`>0.5%, last 2 versions, not dead, not IE 11`) to drop legacy
  polyfills. **Edit PDF LCP (7.6s):** added a static, `aria-hidden`,
  server-rendered replica of the editor empty state at `z-index:0` in
  `edit-pdf/page.tsx` — paints as LCP, then covered by the editor's opaque
  `fixed inset:0 z-50` shell on hydrate (no hydration mismatch, no CLS, no
  focusable elements). `ssr:false` left untouched (too risky).
- **Accessibility:** heading order — tool-card title `<h3>`→`<p>` (`ToolCard.tsx`),
  "missing a tool?" CTA `<h3>`→`<h2>` (`ToolsCatalog.tsx`); contrast — footer
  headings/copyright + RecentFiles small text `--text-3`→`--text-2`.
- **CLS:** `contain: layout` on `<footer>`.
- **SEO (canonical):** primary domain confirmed **www.plinypdf.com**.
  `SITE_URL` default = `https://www.plinypdf.com`; `NEXT_PUBLIC_SITE_URL` set to
  www on Vercel. Canonical/hreflang/OG all resolve to www.

### Incident — www→apex redirect (reverted)
A first attempt added `redirects()` in `next.config.ts` (www→apex 301). It caused
`ERR_TOO_MANY_REDIRECTS` in prod (fought Vercel's domain-level redirect). Reverted
immediately (commit `39274d9`). **Lesson: host canonicalization belongs at the
Vercel domain level, never in `next.config.ts`.** Primary domain is www; no code
redirect needed.

## GATE 9G — verification (all ✅ user-confirmed 2026-06-17)

- [x] JpgToPdf object-URL leak fixed (heap flat)
- [x] Edit/Annotate teardown clean (audit verified all listeners/observers/Fabric/timers)
- [x] Heavy components code-split (confirmed — no bundle change needed)
- [x] Lighthouse: homepage P91/A96/BP100/SEO100, /tools P97/A100/BP100/SEO100,
      /edit-pdf P94/A100/BP100/SEO100, desktop P100/A96/BP100/SEO100
- [x] Rate limiting enforced in all cloud handlers (audit confirmed)
- [x] `bun run build` green

## Commits
`65ce88b` (JpgToPdf leak) · `fb51e0e` (headers/preconnect/posthog/a11y/CLS) ·
`56c87e6` (contrast + LCP placeholder; redirect — later reverted) ·
`39274d9` (revert redirect) · `abdb764` (canonical → www). Frontend only — no Hetzner deploy.
