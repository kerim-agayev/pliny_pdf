# Wave 7A — Pro Removal + Limit Revision

## Status: COMPLETE — awaiting GATE 7A confirmation from user

## Tasks
- [x] docs/phase_7/ tree created
- [x] lib/limits.ts — 2-tier values + new constants + effectivePlan helper
- [x] lib/ratelimit.ts — free daily 15→10
- [x] lib/tools.ts — AI Summary available:false, remove AI category
- [x] Navbar.tsx + MobileNav.tsx + Footer.tsx — Pricing→About
- [x] pricing/page.tsx — redirect to /about
- [x] app/[locale]/page.tsx — new hero text, remove pricing section
- [x] privacy/page.tsx — remove Lemonsqueezy, update retention text
- [x] terms/page.tsx — remove billing & refunds section
- [x] support/page.tsx — remove refunds section
- [x] dashboard/page.tsx — remove Pro badges/CTAs/AI category (full rewrite ~250 lines)
- [x] messages/en+tr+ru.json — hero text, nav labels, remove Pro/billing keys
- [x] deploy/LAUNCH.md — tool counts updated (29→33, cloud 9→8, local 20→25)
- [x] bun run build — exit 0, no MISSING_MESSAGE warnings, 141 static pages

## Gate 7A Checklist
- [ ] `/` homepage: hero text "33 PDF tools, all free.", no Pro mentions, no pricing preview
- [ ] `/tools`: AI Summary not visible, no AI category tab
- [ ] `/about` accessible from header nav
- [ ] `/pricing` redirects to `/about`
- [ ] `/privacy`: no Lemonsqueezy mention, no "30 days (Pro)" text
- [ ] `/terms`: no billing/refund section
- [ ] `/support`: no refunds section
- [ ] `/dashboard`: no Pro badge, no upgrade CTA, no AI category
- [ ] lib/limits.ts: LOCAL_MAX_PAGES anon=30/free=100, CLOUD_MAX_MB anon=20/free=75, EDITOR_MAX_PAGES anon=15/free=50
- [ ] lib/ratelimit.ts: free daily = 10
- [ ] User confirms → commit

## Key Decisions
- `effectivePlan()` maps legacy pro → free (graceful degradation, no 404/break for existing pro accounts)
- AI Summary: available:false (server route intact, just hidden from UI)
- Lemonsqueezy/Pro billing code: untouched backend, UI-only removal
- dashboard/page.tsx: full rewrite (429→250 lines) — simpler than surgical removal of isPro branches
- pricing/page.tsx: redirect stub kept (avoids 404 on inbound links)
