# Wave 9H — SEO + Landing Pages + Blog

**Status:** DONE ✅ — GATE 9H PASSED (2026-06-17, user-confirmed on Vercel)

## Scope check first (per CLAUDE_9.md)
Most of Wave 9H's spec was already shipped in earlier Phase 9 work:
- Unique meta for all 33 tools (title/desc/OG/Twitter/canonical/hreflang) — `lib/seo.ts`
- SoftwareApplication schema (`/tools`), FAQPage + HowTo per tool — `lib/structured-data.ts`
- Related-tools internal linking — `ToolShell.tsx`
- Sitemap (tools + static + blog, 3 locales, hreflang) — `app/sitemap.ts`
- robots — `app/robots.ts`
- 5 blog posts live, i18n-rendered, BlogPosting schema

So this wave only built the **gaps** (see decisions D9-H1..H3).

## What shipped
1. **BreadcrumbList schema** (was missing) — `breadcrumbSchema(locale, items)` in
   `lib/structured-data.ts`. Wired into:
   - tool pages: `toolSchemas(slug, locale)` now appends Home → Tools → <tool> (33 call
     sites updated to pass `locale`).
   - blog posts: Home → Blog → <post>.
   - landing pages: Home → <page>.
2. **Organization schema** (was only inline in BlogPosting) — `organizationSchema()` rendered
   once site-wide in `app/[locale]/layout.tsx` (logo = dynamic `/api/og` PNG; no standalone
   logo asset exists yet).
3. **12 EN landing pages** — one template route `app/[locale]/landing/[slug]/page.tsx` + data
   in `lib/landing.ts`. EN-only (`notFound()` for tr/ru). Each = hero + intro + CTA to a primary
   tool + FAQ + related-tools grid + FAQPage/BreadcrumbList JSON-LD.
4. **Sitemap** — EN-only `/en/landing/<slug>` entries (priority 0.7, monthly; x-default = en).
5. **Blog** — verified existing 5 render + now carry BreadcrumbList. No new posts.

## GATE 9H verification (prod server)
- `bun run build` ✅ green (Next 16.2.6, compiled in ~17s).
- `/en/landing/compress-pdf-online-free` → 200; `/tr/landing/...` → 404; unknown slug → 404.
- Landing JSON-LD: FAQPage + BreadcrumbList + Organization. ✅
- Tool page (merge-pdf) JSON-LD: FAQPage + HowTo + BreadcrumbList + Organization; canonical
  `https://www.plinypdf.com/en/merge-pdf`. ✅
- Blog post JSON-LD: BlogPosting + BreadcrumbList + Organization. ✅
- Sitemap: 12 landing slugs, **EN only** (no /tr/ or /ru/ landing URLs); robots unchanged. ✅

## Key files
- `lib/structured-data.ts` — `breadcrumbSchema`, `organizationSchema`, `toolSchemas(slug, locale?)`
- `lib/landing.ts` — NEW; `LANDING` (12 topics), `landingSlugs`, `getLanding`
- `app/[locale]/landing/[slug]/page.tsx` — NEW; EN-only template
- `app/[locale]/layout.tsx` — global Organization JsonLd
- `app/[locale]/blog/[slug]/page.tsx` — BreadcrumbList added
- `app/sitemap.ts` — EN-only landing entries
- 33 tool `app/[locale]/<slug>/page.tsx` — `toolSchemas(slug, locale)`

## Deferred / not done
- 36 landing pages → 12 (D9-H1). 5 new spec blog topics → kept existing 5 (D9-H2).
  Category hub routes → skipped, `/tools?category=` filter is enough (D9-H3).
