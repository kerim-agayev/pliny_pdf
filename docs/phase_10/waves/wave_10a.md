# Wave 10A — Compress PDF Removal + Homepage Fixes — DONE ✅

> GATE 10A passed 2026-06-18 (verified on Vercel production). Commit `9cd34b4`.

Issues covered: 1 (remove Compress, 33→32), 4 (v2.4 badge mobile), 6 (Merge preview cloud),
7 (Why card AI→Edit PDF).

## Tasks
- [x] `lib/tools.ts` — compress `available: true` → `false`
- [x] `app/[locale]/compress-pdf/page.tsx` — replace with `redirect("/tools")`
- [x] 33→32 in `messages/{en,tr,ru}.json` (heroBadge, headlineStart, ctaBody)
- [x] 33→32 (+ drop Compress, 8→7 server tools) in `deploy/LAUNCH.md`
- [x] `lib/landing.ts` — delete `compress-pdf-online-free`; strip `compress-pdf` from 4 `related` arrays
- [x] Homepage Why card #2 → Edit PDF (`whyAi*`→`whyEdit*` ×3 locales, IconType)
- [x] Homepage popular grid: compress → pdf-to-jpg
- [x] Hero v2.4 badge: "· No account needed" `hidden sm:inline`
- [x] Merge hero preview: cloud badge + blue dot + cloud `previewProcessed` copy
- [x] `docs/phase_10/` tree created

## GATE 10A — PASSED ✅ (2026-06-18, Vercel production)
- [x] `bun run build` green
- [x] /tools: no Compress card; count = 32; filters work
- [x] Homepage popular grid shows PDF to JPG, no "Soon" card
- [x] Hero badge mobile: no "· No account needed"; desktop full
- [x] Why card #2 = Edit PDF (no "AI"/"200-page" copy on page)
- [x] Merge preview: Cloud badge + "Processed on our server · Deleted within 24h"
- [x] /en/landing/compress-pdf-online-free → 404; no Compress in other "Related" lists
- [x] /compress-pdf → redirects to /tools
- [x] sitemap.xml: no /compress-pdf, no compress landing
- [x] repo grep "33": only historical docs remain
