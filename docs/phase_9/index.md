# Phase 9 — Pre-Launch Polish · Index

> Read `CLAUDE_9.md` first, then this file. Phase 1–8 docs are READ-ONLY.

## Current Status
- Phase: 9 (pre-launch polish)
- Last completed: **Wave 9D — Organize / Crop / Redact mobile redesign — ✅ GATE 9D PASSED (2026-06-16)**
- In progress: **Wave 9E (form-heavy tools mobile) — implemented; GATE 9E pending user confirmation (not committed).** Mobile redesign of 4 tools (Edit Metadata, Add Watermark, Header & Footer, Add Page Numbers). **Sign PDF Form Fields skipped (D9-E1) — tool does not exist** (no AcroForm fill tool; Phase-2 do-not-build item). All controls inline, no BottomSheet (D9-E2). `bun run build` green.
- Next step: user device-test the 4 tools @ 375px → confirm GATE 9E → commit. Then Wave 9F (23 simple tools CSS responsive audit, no design needed).

## Waves
- 9A: Limit UI on all tools — LimitBadge + per-tool getToolLimits + live daily quota — **✅ GATE 9A PASSED (2026-06-15)**
- 9B: Annotate PDF mobile — full-screen takeover (MobileAnnotateToolbar + Edit-PDF canvas pattern) — **✅ GATE 9B PASSED (2026-06-15)**
- 9C: Sign PDF mobile — 2-screen takeover (Create→Place) + multi-placement (`signPdf` array engine) — **✅ GATE 9C PASSED (2026-06-16)**
- 9D: Organize/Crop/Redact mobile — full-screen branches; Organize list+press-hold reorder, Crop 44×44 handles+pull-up panel, Redact draw+confirm modal (both platforms) — **✅ GATE 9D PASSED (2026-06-16)**
- 9E: form-heavy tools mobile (Edit Metadata, Add Watermark, Header & Footer, Add Page Numbers) — **implemented, GATE 9E pending**. 4 tools (not 5: Sign PDF Form Fields skipped, D9-E1 — no such tool). Full-screen mobile branch per tool; all controls inline (D9-E2).
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

## Key Files (Wave 9D)
- `components/tools/OrganizePages.tsx` — mobile vertical-list branch; module-level `SortableRow` (`verticalListSortingStrategy`); press-hold `PointerSensor` `{delay:180,tolerance:8}`; 3-dot `BottomSheet` (uid-scoped helpers); select mode + sticky Apply
- `components/tools/CropPdf.tsx` — shared `CropCanvas` (44×44 handle hit-area on mobile); mobile pull-up panel (presets + scope + reset + apply)
- `components/tools/RedactContent.tsx` — shared `RedactCanvas` + shared `RedactConfirmModal` (desktop centered / mobile sheet, both platforms); mobile bottom toolbar + Find/color `BottomSheet`s
- Shared reuse: `components/tools/EditPdf/BottomSheet.tsx`, `lib/hooks/useMediaQuery.ts`, dnd-kit, `lib/pdf/thumbnailLoader.ts`
- Design screens: `.design-handoff/phase-9/.../project/screen-p9-organize.jsx`, `screen-p9-crop.jsx`, `screen-p9-redact.jsx`

## Key Files (GATE 9D bug fixes)
- `components/tools/NumberField.tsx` — NEW shared touch number stepper (`[−][input][+]`, 44×44, native spinners hidden); used by Split / Add Page Numbers / Repeat Pages
- `components/tools/ResultPanels.tsx` — `SuccessPanel` actions stack full-width on mobile (download no longer overflows)
- `app/globals.css` — `.pp-number` spinner-hide rules

## Key Files (Wave 9E)
- `components/tools/EditMetadata.tsx` — mobile branch (no preview): header + scroll form + sticky Save
- `components/tools/WatermarkTool.tsx` — mobile branch + responsive `previewW` (mobile fits 375px; desktop `=== PREVIEW_W`, unchanged); preview-top + inline controls + sticky Apply
- `components/tools/HeaderFooter.tsx` — mobile branch; `ScaledPreview` (width-200) + band overlays + page nav on top; inline `BandConfig` ×2 + Skip-First + sticky Apply
- `components/tools/AddPageNumbers.tsx` — mobile branch; `ScaledPreview` + nav on top; inline position grid / format dropdown / `NumberField` / sliders / swatches + sticky Apply
- Shared reuse (as-is): `lib/hooks/useMediaQuery.ts`, `components/tools/NumberField.tsx`, `components/tools/ScaledPreview.tsx`, safe-area inline pattern
- i18n: `ToolUI.removeFile` + per-tool `mobileTitle` (en/tr/ru, parity verified)
- Design screens: `.design-handoff/phase-9/.../project/screen-p9-metadata.jsx`, `screen-p9-watermark.jsx`, `screen-p9-header-footer.jsx`, `screen-p9-page-numbers.jsx`

## Design Handoff
- Saved to `.design-handoff/phase-9/`. LimitBadge + updated FileDropzone (`Dropzone9`) in `project/phase9-kit.jsx`; tokens in `project/brand.css`; behavior notes in `project/PlinyPDF Design.html`; intent in `chats/chat4.md`.
