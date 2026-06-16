# Phase 9 — Log

## [2026-06-15] Phase 9 started; docs/phase_9 tree created
Created index/decisions/architecture/bugs/log + waves/wave_9a..9j.

## [2026-06-15] Wave 9A — Limit UI Display implemented (gate pending)
- Fetched Phase 9 Claude Design handoff → `.design-handoff/phase-9/`.
- Added `getToolLimits(toolId, plan)` + `ToolLimits`/`BadgePlan` to `lib/limits.ts`; exported `SERVER_DAILY` from `lib/ratelimit.ts`.
- New `components/shared/LimitBadge.tsx` (all states, EN/TR/RU).
- New `app/api/usage/route.ts` + `lib/hooks/useDailyUsage.ts` (live daily quota).
- `FileDropzone`: `toolId` prop, renders LimitBadge, inline pre-upload size (red badge) + page errors; fixed B9-1 / B9-2.
- Added `toolId` to all 30 FileDropzone call sites (31 tools; text-to-pdf / markdown-to-pdf have no input → no badge).
- Added `LimitBadge` i18n namespace to en/tr/ru.json (real translations).
- `bun run build` green (exit 0). **GATE 9A pending user confirmation; not committed.**

## [2026-06-15] Wave 9A — GATE 9A round 1: 3 bugs fixed (gate still pending)
- B9-3: cloud tools (PDF→JPG etc.) now page-check client-side before upload; size+page violations show unified red badge + red border (no more post-upload toast).
- B9-4: fixed mis-tagged Annotate (`EditorTool` → `toolId="edit"`); added LimitBadge + inline over-limit to the cloud Edit PDF custom uploader (`EditPdf/index.tsx`) — now shows 10/30 MB · 15/50 pages · daily.
- B9-5: `useDailyUsage` fetches with `cache: "no-store"`; verified `/api/usage` mapping (`used = total − remaining`) is correct.
- `LimitBadge` gained `overUnit`/`filePages` + `overPages` i18n key (EN/TR/RU).
- `bun run build` green (exit 0). **GATE 9A still pending user confirmation.**

## [2026-06-15] Wave 9A — GATE 9A round 2: full 33-tool audit + 2 fixes
- Audited all 33 tools (4 checks each: FileDropzone/toolId, MB, pages, badge). Table in waves/wave_9a.md.
- B9-6: jpg-to-pdf image-count now inline (was toast); removed unused sonner import.
- B9-7: merge now guards TOTAL size + TOTAL pages client-side (inline ErrorBanner + disabled button) — EN/TR/RU keys added.
- Result: every tool enforces limits inline before processing (word-to-pdf pages remain server-side — docx can't be parsed client-side; documented).
- `bun run build` green (exit 0). **GATE 9A still pending user confirmation.**

## [2026-06-15] ✅ GATE 9A PASSED (user-confirmed on Vercel)
Wave 9A (Limit UI) complete: LimitBadge on all 33 tools, live daily quota, inline pre-upload size+page validation, full 33-tool audit. Next: Wave 9B (Annotate mobile) — awaiting user go-ahead.

## [2026-06-15] Wave 9B — Annotate PDF mobile redesign implemented (gate pending)
- Re-fetched Phase 9 design → `.design-handoff/phase-9/`; verified all 10 wave screens (9C–9E use `screen-p9-*` naming).
- Mobile full-screen takeover in `EditorTool.tsx` (route `pdf-editor`); desktop unchanged. New `MobileAnnotateToolbar.tsx` (props-driven). i18n `ToolPages.editor.mobile` EN/TR/RU.
- `bun run build` green. Committed `4b34927`, pushed for Vercel device testing.

## [2026-06-15] Wave 9B — GATE 9B rounds (5 bugs fixed)
- B9-8 long-press menu (move threshold + 500ms); B9-9 undo/redo (baseline + keep-current-on-top); B9-10 pinch-zoom binding (`usePinchZoom` deps param); B9-11 color sheet instant-close (defer open 120ms); B9-12 top bar hidden / no pan → copied Edit PDF canvas pattern exactly (outer overflow:hidden + inner overflow:auto, no alignItems:center, no touchAction:none on scroller).
- Added Delete button (mobile FAB + desktop) + Delete/Backspace key, undoable.
- Commits `664478b`, `1214c98`, `1412383`. `bun run build` green each round.

## [2026-06-15] ✅ GATE 9B PASSED (user-confirmed on Vercel)
Wave 9B (Annotate PDF mobile) complete: full-screen takeover matching Edit PDF mobile (scrollable dark canvas, pinch-zoom+pan, fixed bars), MobileAnnotateToolbar + option sheets, long-press menu, delete button + Del key, fixed undo/redo. Deviations D9-B1..B5 (no eraser/swipe-page/font-size/find on mobile) documented in waves/wave_9b.md. Next: Wave 9C (Sign PDF mobile) — awaiting user go-ahead; ask for design link (`screen-p9-sign.jsx`).

## [2026-06-16] Wave 9C — Sign PDF mobile redesign implemented (gate pending)
- Reused Phase 9 design (`screen-p9-sign.jsx`, already in `.design-handoff/phase-9/`).
- Refactored `lib/pdf/signPdf.ts` to `signPdf(file, PlacedSignature[])` (multi-signature engine, single doc load); desktop passes a one-element array → desktop UI unchanged.
- New `components/tools/SignPdfMobile.tsx`: full-screen 2-screen takeover (Create→Place). Create = Draw/Type/Upload + Fabric pad + ink/fonts; Place = dark canvas, touch drag/resize/delete per signature, per-instance scope, page nav, add-another. `SignPdf.tsx` renders it via `useMediaQuery("(max-width: 767px)")`.
- Added 14 `ToolPages.signPdf` mobile keys (EN/TR/RU) via minimal targeted edits (reverted an accidental full-file JSON reformat first).
- `bun run build` green. Committed `ae1f039`, pushed for Vercel device testing.

## [2026-06-16] Wave 9C — GATE 9C round 1: B9-13 Place-screen crash fixed
- B9-13: tapping "Next" crashed the Place screen (browser-level error, no React boundary). Root cause: create→place transition unmounted the Create screen + its Fabric-wrapped `<canvas>` while disposing fabric → React `removeChild` on a fabric-moved node threw in the commit phase (uncatchable, 100% repro).
- Fix: keep the Create layer mounted (hidden via `visibility`, never unmounted), overlay the Place layer; init Fabric once, dispose only on full unmount (matches desktop `SignPdf`). Mobile takeover now owns its own thumbnail loader; parent render effect skipped on mobile.
- Commit `aecc578`. `bun run build` green.

## [2026-06-16] ✅ GATE 9C PASSED (user-confirmed on Vercel)
Wave 9C (Sign PDF mobile) complete: 2-screen takeover (Create→Place), multi-signature placement (drag/resize/delete, per-instance scope), Draw/Type/Upload, EN/TR/RU. Decisions D9-C1..C4 (streamlined takeover not 4-step wizard; no add date/initials; reuse existing fonts; no pressure) in waves/wave_9c.md. Next: Wave 9D (Organize/Crop/Redact mobile) — awaiting user go-ahead; ask for design link (`screen-p9-organize.jsx`, `screen-p9-crop.jsx`, `screen-p9-redact.jsx`).

## [2026-06-16] Wave 9D — Organize/Crop/Redact mobile redesign implemented (gate pending)
- Design screens already local (`screen-p9-organize/crop/redact.jsx`). User scope decisions D9-D1 (skip Organize blank-page/FAB), D9-D2 (Redact confirm on both platforms), D9-D3 (Crop mobile simplified).
- Single-source-of-truth `useMediaQuery("(max-width:767px)")` branch in each component; full-screen mobile chrome; reused `BottomSheet`, dnd-kit, `createThumbLoader`.
- Organize: `SortableRow` vertical list + `verticalListSortingStrategy` + press-hold sensor; 3-dot BottomSheet (uid-scoped rotate/duplicate/move/delete); select mode + bulk; sticky Apply. Crop: shared `CropCanvas`, 44×44 handle hit-areas, pull-up panel. Redact: shared `RedactCanvas` + shared `RedactConfirmModal` (desktop+mobile) + bottom toolbar/sheets.
- i18n `mobile` + `confirm*` keys for organizePages/cropPdf/redactContent (en/tr/ru, key parity verified).
- `bun run build` green. Committed `a3a55b7`, pushed for Vercel device testing.

## [2026-06-16] Wave 9D — GATE 9D bug fixes (2 shared-level fixes)
- B9-14: success "Download" button overflowed at 375px → shared `SuccessPanel` (`ResultPanels.tsx`) actions now stack full-width on mobile, hide keyboard chips, `break-all` filename. Fixes all 23 SuccessPanel tools.
- B9-15: numeric inputs lacked touch steppers / values felt stuck → new shared `components/tools/NumberField.tsx` (`[−][input][+]`, 44×44 steppers, native spinners hidden via `.pp-number`, focus-gated value re-sync). Adopted in Split (From/To), Add Page Numbers (start/first), Repeat Pages (count); `ToolUI.decrease/increase` i18n (en/tr/ru). Crop manual inputs left as-is (desktop-only on mobile).
- `bun run build` green. Committed `22ca88f`, pushed.

## [2026-06-16] ✅ GATE 9D PASSED (user-confirmed on Vercel)
Wave 9D (Organize/Crop/Redact mobile) complete: touch-friendly mobile redesigns matching the Edit-PDF bar — Organize list+press-hold reorder+action sheet, Crop 44×44 handles+pull-up panel, Redact draw+find/color sheets+confirm modal (desktop too). Decisions D9-D1..D3 in decisions.md; GATE-9D bug fixes B9-14/B9-15 (success-button overflow, shared NumberField steppers). EN/TR/RU complete. Next: Wave 9E (form-heavy tools mobile — Edit Metadata, Add Watermark, Header & Footer, Add Page Numbers, Sign PDF Form Fields) — do NOT start until user go-ahead; ask for Phase 9 design handoff link at 9E start.

## [2026-06-16] Wave 9E — Form-heavy tools mobile redesign implemented (gate pending)
- Scope: **4 tools, not 5.** D9-E1: "Sign PDF Form Fields" does not exist (only `sign-pdf` draw-signature tool, done in 9C; no AcroForm fill tool; Phase-2 do-not-build per CLAUDE.md §13). Skipped, no new feature built. D9-E2: all controls inline, no BottomSheet (minimal-safe).
- Design screens already local (`screen-p9-metadata/watermark/header-footer/page-numbers.jsx`). Mirrored the shell only (preview-on-top + scroll + sticky Apply); did NOT add mock-only features (Text/Image tabs, rotation, font picker, number-style segments).
- Per tool: added `useMediaQuery("(max-width:767px)")` mobile branch **before** the existing desktop `return`, reusing all state/handlers/preview-effects/`lib/pdf` calls verbatim. Full-screen takeover (`fixed inset:0 z-60`), safe-area header (back=reset + title + filename), shrinkable live preview on top, scrollable inline controls (≥44–48px), sticky bottom Apply. Dropzone + SuccessPanel states left shared/unchanged.
- WatermarkTool: only preview-sizing change — `previewW = isMobile ? min(300, round(300·w/h)) : PREVIEW_W` so overlay math stays correct at 375px; desktop `previewW === PREVIEW_W` (identical). Header & Footer + Add Page Numbers reuse `ScaledPreview` (width-200 wrapper) — already responsive.
- i18n: added `ToolUI.removeFile` + per-tool `mobileTitle` to en/tr/ru via minimal targeted edits (namespace-anchored, no full-file reformat); JSON parse + key parity verified.
- `bun run build` green (exit 0; 156 static pages; only pre-existing Sentry deprecation warnings). Committed `d4946de` (10 files, frontend only — no Hetzner), pushed for Vercel device testing.

## [2026-06-16] ✅ GATE 9E PASSED (user-confirmed on Vercel)
Wave 9E (form-heavy tools mobile) complete: 4 tools (Edit Metadata, Add Watermark, Header & Footer, Add Page Numbers) get a full-screen mobile takeover (safe-area header → shrinkable live preview on top → scrollable inline controls → sticky Apply), reusing all existing state/handlers/preview/`lib/pdf` — desktop unchanged. Watermark gained a responsive mobile preview width (desktop `=== PREVIEW_W`). i18n `ToolUI.removeFile` + per-tool `mobileTitle` (en/tr/ru). Decisions D9-E1 (Sign PDF Form Fields skipped — tool doesn't exist, Phase-2 do-not-build) + D9-E2 (all controls inline, no BottomSheet) in decisions.md. EN/TR/RU complete. Next: Wave 9F (23 simple tools CSS responsive audit — CSS-only, no design needed) — do NOT start until user go-ahead.
