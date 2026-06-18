# Phase 10 — Log

Chronological, append-only.

## [2026-06-18] Phase 10 start — docs tree created
- Created `docs/phase_10/` (index, decisions, bugs, log, waves/).

## [2026-06-18] Wave 10A — Compress removal + homepage fixes
- Compress PDF → `available: false`; `compress-pdf` route → `redirect("/tools")`.
- Tool count 33→32 across `messages/{en,tr,ru}.json` (heroBadge, headlineStart, ctaBody) + `deploy/LAUNCH.md`.
- Removed `compress-pdf-online-free` landing entry; stripped `compress-pdf` from 4 `related` arrays.
- "Why PlinyPDF" card #2: AI Summary → Edit PDF (`whyAi*`→`whyEdit*`, IconType).
- Homepage popular grid: compress → pdf-to-jpg.
- Hero v2.4 badge: hide "· No account needed" on mobile.
- Merge hero preview: local → cloud badge + blue dot + "Processed on our server · Deleted within 24h".
- Committed `9cd34b4`, pushed to main.

## [2026-06-18] GATE 10A PASSED ✅
- All checks verified green on Vercel production (user-confirmed).
- Phase 10 now at 32 tools. Next: Wave 10B (/tools tabs mobile fix + compress blog replacement).

## [2026-06-18] Wave 10B — UI fixes
- /tools category tabs (`ToolsCatalog.tsx`): `flex-wrap` → `flex-nowrap overflow-x-auto max-w-full pp-noscroll`; buttons `shrink-0 whitespace-nowrap`. New `.pp-noscroll` hidden-scrollbar utility in `globals.css` (mirrors `.pp-ed-row`). Horizontal scroll chosen — robust for long RU labels (Конвертировать/Редактировать).
- Blog: deleted `how-to-compress-pdf-without-losing-quality.md`; added `how-to-sign-pdf-documents-digitally.md` (EN, links to `/sign-pdf`). Sitemap/index auto-derive — no hardcoded list. Old slug 404s.
- Committed `b2cd85e`, pushed to main.

## [2026-06-18] Wave 10B follow-up — footer fix
- Footer tool links in `components/shared/Footer.tsx` are HARDCODED (not derived from `lib/tools.ts`) — that's why removed Compress PDF still showed. Replaced "Compress PDF" → "Sign PDF".
- `bun run build` green. Committed + pushed to main.

## [2026-06-18] GATE 10B PASSED ✅
- Tabs scroll cleanly on mobile (user-confirmed on real device, EN/TR/RU); new blog post live; footer no longer shows Compress PDF.
- Next: Wave 10C (backend bug fixes — PDF→Word slide-deck 500, PDF→JPG font blocks; Hetzner deploy).
