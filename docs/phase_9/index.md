# Phase 9 — Pre-Launch Polish · Index

> Read `CLAUDE_9.md` first, then this file. Phase 1–8 docs are READ-ONLY.

## Current Status
- Phase: 9 (pre-launch polish)
- Last completed: **Wave 9A — Limit UI Display — ✅ GATE 9A PASSED (2026-06-15)**
- Next step: **Wave 9B (Annotate PDF mobile)** — do NOT start until the user gives the go-ahead.

## Waves
- 9A: Limit UI on all tools — LimitBadge + per-tool getToolLimits + live daily quota — **✅ GATE 9A PASSED (2026-06-15)**
- 9B–9E: mobile redesigns (Annotate, Sign, Organize/Crop/Redact, form-heavy) — not started
- 9F: 23 simple tools responsive audit — not started
- 9G: perf/memory/bundle audit — not started
- 9H: SEO + landing + blog — not started
- 9I: critical pre-launch items — not started
- 9J: final QA + docs — not started

## Key Files (Wave 9A)
- `components/shared/LimitBadge.tsx` — reusable limit indicator (ported from Phase 9 design)
- `lib/limits.ts` — `getToolLimits(toolId, plan)` + `ToolLimits`/`BadgePlan` (single source of truth)
- `lib/ratelimit.ts` — exports `SERVER_DAILY = { anon: 3, free: 10 }`
- `components/tools/FileDropzone.tsx` — renders LimitBadge, inline pre-upload size/page validation
- `app/api/usage/route.ts` + `lib/hooks/useDailyUsage.ts` — live daily quota for cloud tools
- `.design-handoff/phase-9/` — Claude Design bundle (LimitBadge in `project/phase9-kit.jsx`)

## Design Handoff
- Saved to `.design-handoff/phase-9/`. LimitBadge + updated FileDropzone (`Dropzone9`) in `project/phase9-kit.jsx`; tokens in `project/brand.css`; behavior notes in `project/PlinyPDF Design.html`; intent in `chats/chat4.md`.
