# Phase 9 — Pre-Launch Polish · Index

> Read `CLAUDE_9.md` first, then this file. Phase 1–8 docs are READ-ONLY.

## Current Status
- Phase: 9 (pre-launch polish)
- Last completed: **Wave 9C — Sign PDF mobile redesign — ✅ GATE 9C PASSED (2026-06-16)**
- Next step: **Wave 9D (Organize / Crop / Redact mobile)** — do NOT start until the user gives the go-ahead. Ask for the Phase 9 design handoff link at 9D start (design screens: `screen-p9-organize.jsx`, `screen-p9-crop.jsx`, `screen-p9-redact.jsx`).

## Waves
- 9A: Limit UI on all tools — LimitBadge + per-tool getToolLimits + live daily quota — **✅ GATE 9A PASSED (2026-06-15)**
- 9B: Annotate PDF mobile — full-screen takeover (MobileAnnotateToolbar + Edit-PDF canvas pattern) — **✅ GATE 9B PASSED (2026-06-15)**
- 9C: Sign PDF mobile — 2-screen takeover (Create→Place) + multi-placement (`signPdf` array engine) — **✅ GATE 9C PASSED (2026-06-16)**
- 9D–9E: mobile redesigns (Organize/Crop/Redact, form-heavy) — not started
  - NOTE: Wave 9D–9E design screens use `screen-p9-*.jsx` naming (e.g. `screen-p9-organize.jsx`), not `screen-*-mobile.jsx`. All present in `.design-handoff/phase-9/`.
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

## Key Files (Wave 9B)
- `components/tools/EditorTool.tsx` — Annotate PDF (route `pdf-editor`); mobile full-screen takeover
- `components/tools/MobileAnnotateToolbar.tsx` — new, props/callback-driven bottom toolbar + option sheets
- `lib/touch.ts` — `usePinchZoom` now takes an optional `deps` param (re-bind on mount)
- Design screen: `.design-handoff/phase-9/.../project/screen-annotate-mobile.jsx` (+ `-core`, `-desktop`)

## Key Files (Wave 9C)
- `components/tools/SignPdfMobile.tsx` — new mobile takeover (Create→Place, multi-placement); Create layer stays mounted so fabric/React never race
- `components/tools/SignPdf.tsx` — `useMediaQuery` mobile branch; array-form sign call; render effect mobile-guarded
- `lib/pdf/signPdf.ts` — `signPdf(file, PlacedSignature[])` (multi-signature engine; desktop passes single-element array)
- Design screen: `.design-handoff/phase-9/.../project/screen-p9-sign.jsx`

## Design Handoff
- Saved to `.design-handoff/phase-9/`. LimitBadge + updated FileDropzone (`Dropzone9`) in `project/phase9-kit.jsx`; tokens in `project/brand.css`; behavior notes in `project/PlinyPDF Design.html`; intent in `chats/chat4.md`.
