# Wave 9E — Form-Heavy Tools Mobile Redesign

Status: **implemented; GATE 9E pending user confirmation (not committed).**

See `CLAUDE_9.md` for the full spec.

## Scope finding — 4 tools, not 5

The 5th listed tool, **"Sign PDF Form Fields", does not exist in the codebase.**
`lib/tools.ts` registers only `sign-pdf` ("Sign PDF" — draw/type/upload signature, already
mobile-done in Wave 9C). There is no AcroForm form-field fill tool; CLAUDE.md §13 lists
"form fill/create" as a Phase-2 do-not-build item. A design mock (`screen-p9-form-fields.jsx`)
exists but was never implemented. **Decision D9-E1: skip it** (per user; no new feature built).

Wave 9E ships mobile for the **4 existing form-heavy tools**.

## Approach (all 4 tools — one shared pattern)

User decisions: **D9-E1** skip Form Fields; **D9-E2** all controls inline (no BottomSheet) —
lowest-risk, minimal-safe. Additive only: a `useMediaQuery("(max-width: 767px)")` mobile
branch added **before** the existing desktop `return`, reusing every handler, state, preview
effect, and `lib/pdf/*` call. Desktop code paths untouched. Mobile chrome mirrors Waves 9B–9D:
full-screen takeover (`position:fixed; inset:0; zIndex:60`), safe-area header (back/remove +
title + filename), shrinkable live preview at top, scrollable controls (≥44–48px targets),
sticky bottom Apply bar.

Mobile branch is active only while editing (`file` set, `status !== "done"`); the
dropzone (`FileDropzone`) and success (`SuccessPanel`) states stay shared/unchanged.

## Files touched

- `components/tools/EditMetadata.tsx` — mobile branch (no preview): header + scrollable
  single-column metadata form (existing `META_FIELDS` inputs, ≥48px) + sticky Save.
- `components/tools/WatermarkTool.tsx` — mobile branch; new responsive preview width
  (`previewW = isMobile ? min(300, 300·(w/h)) : PREVIEW_W`) so the overlay math stays correct
  at 375px (desktop unchanged: `previewW === PREVIEW_W`). Preview-on-top + existing controls
  (text / size / opacity / position / color) + sticky Apply.
- `components/tools/HeaderFooter.tsx` — mobile branch; `ScaledPreview` (width-200 wrapper) +
  band overlays + page nav on top; existing `BandConfig` header/footer + Skip-First + sticky Apply.
- `components/tools/AddPageNumbers.tsx` — mobile branch; `ScaledPreview` preview + nav on top;
  existing 3×3 position grid, format dropdown, `NumberField` start/first, Skip-First, size/
  margin sliders, color swatches; sticky Apply.
- `messages/{en,tr,ru}.json` — added `ToolUI.removeFile` (header back-button aria-label) and a
  per-tool `mobileTitle` (4 tools). Key parity verified across all 3 locales.

No backend changes. No shared-component changes (reused `useMediaQuery`, `NumberField`,
`ScaledPreview`, safe-area pattern as-is; `BottomSheet` not used per D9-E2).

## Verification

- `bun run build` green (exit 0; 156 static pages).
- Desktop paths unmodified (mobile branch inserted before the desktop `return`; same state/handlers).

## GATE 9E (pending user confirmation, per tool @ 375px)

1. No horizontal overflow; header/preview/controls/Apply all reachable.
2. Live preview renders + updates live (Watermark overlay aligned; H/F + Page Numbers scaled;
   page nav works).
3. Apply produces the correct output PDF (handlers unchanged).
4. Touch targets ≥44px; inputs full-width ≥48px.
5. Desktop unchanged at ≥1024px.
6. EN/TR/RU render with no missing keys.
7. `bun run build` green.
