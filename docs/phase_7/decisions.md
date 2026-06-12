# Phase 7 — Decisions

## D7-1: Pro tier hidden, not deleted
Keep all Lemonsqueezy/Pro backend code. Only hide from UI. Reason: potential re-launch in Phase 8; deleting is irreversible.

## D7-2: effectivePlan() helper for graceful degradation
Added `effectivePlan(plan)` that maps 'pro' → 'free'. Existing Pro accounts get free-tier limits without TypeScript errors. Pro key removed from limit objects.

## D7-3: /pricing redirects to /about (not deleted)
Redirect preserves any inbound links. Deletion would cause 404s.

## D7-4: AI Summary available: false (not deleted)
Server route, checkAi limiter, and i18n keys stay. UI hidden via `available: false` in tools.ts.

## D7-5: "33 PDF tools" in hero text from Wave 7A
Per CLAUDE_7.md §3 spec. Count reflects Phase 7 final state, even though new tools are built in 7B–7D.
