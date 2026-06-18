# Phase 10 — Launch Polish + Bug Fixes

> Phase 1–9 docs are READ-ONLY. All Phase 10 memory lives here.
> Session bootstrap: read `CLAUDE_10.md` first, then this file.

## Current Status
- Phase: 10 (launch polish, no new tools)
- Active wave: **10D — Lighthouse + final QA** (Issue 9). Not started.
- Last completed: Wave 10C (GATE passed + user-confirmed 2026-06-18; commits `85022c8` + `587d4b8` + `746f976`, deployed to Hetzner).
- After Phase 10: 32 tools, all reported bugs fixed, launch-ready.

## Waves
- **10A** — Compress PDF removal (33→32) + homepage fixes (Issues 1, 4, 6, 7). **COMPLETE ✅ (2026-06-18).**
- **10B** — UI fixes: /tools tabs mobile scroll (Issue 3) + compress blog → Sign PDF post (Issue 8) + footer Compress→Sign. **COMPLETE ✅ (2026-06-18).**
- **10C** — Backend: PDF→Word (Issue 2 — no bug; converts or clean 413/502, orig 500 was pre-deploy) + PDF→JPG blocks (Issue 5 — known limitation). Hardening + Hetzner deploy. **COMPLETE ✅ (2026-06-18).**
- 10D — Lighthouse + final QA (Issue 9).

## Key Files (Phase 10 touched)
- `lib/tools.ts` — tool catalog; `available` flag gates /tools, sitemap, homepage cards.
- `app/[locale]/page.tsx` — homepage (hero badge, popular grid, "Why" cards, Merge hero preview).
- `lib/landing.ts` — EN landing pages (`LANDING` record → `landingSlugs` → sitemap + static routes).
- `messages/{en,tr,ru}.json` — `Home.*` keys (count copy, why-cards, preview).
- `deploy/LAUNCH.md` — launch marketing drafts (tool-count copy).

## Notes
- Removing a tool = `available: false` + gut its route page to `redirect("/tools")` (AI-Summary pattern).
- Backend tool code stays intact when a tool is hidden (re-enableable later).
