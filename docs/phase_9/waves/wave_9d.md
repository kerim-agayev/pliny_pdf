# Wave 9D — Organize / Crop / Redact Mobile Redesign

**Status: DONE ✅ — GATE 9D PASSED (2026-06-16, user-confirmed on Vercel).**

Made the three page-management tools touch-usable on phones, matching the Edit-PDF mobile
quality bar (Phase 8). Local/in-browser tools — **no backend changes**. Desktop unchanged
except Redact gains a confirm step. All UI text EN/TR/RU. `bun run build` green.

## Approach (all three)
Single source of truth: state/handlers stay in each existing component; a
`useMediaQuery("(max-width: 767px)")` branch swaps in a full-screen mobile chrome (same
precedent as SignPdfMobile / EditorTool). Crop handles and Redact draw already use pointer
events + percentage math, so they work under touch as-is — only chrome + hit-area sizes change.
Reused shared infra: `BottomSheet` (EditPdf), `useMediaQuery`, `createThumbLoader`, dnd-kit,
44×44 + `env(safe-area-inset-*)` patterns.

## What shipped
- **Organize Pages** (`OrganizePages.tsx`): mobile vertical card list via new module-level
  `SortableRow` + `verticalListSortingStrategy`; press-and-hold reorder (`PointerSensor`
  `{delay:180, tolerance:8}` so list scroll isn't hijacked); 3-dot → `BottomSheet`
  (rotate / duplicate / move-start / move-end / delete via new uid-scoped helpers); Select mode +
  bulk actions; pending-change badge; bottom-fixed Apply. **No FAB / no add-blank** (D9-D1).
- **Crop PDF** (`CropPdf.tsx`): extracted shared `CropCanvas`; handles keep 12px visual but gain a
  **44×44 touch hit area** on mobile; full-width preview + hint chip; persistent bottom pull-up
  panel = aspect presets + All/This-page scope + reset + Apply. Exact-box/unit/range desktop-only
  (D9-D3).
- **Redact Content** (`RedactContent.tsx`): extracted shared `RedactCanvas` (resize nub 22px on
  touch); new shared `RedactConfirmModal` — centered on desktop, bottom-sheet on mobile — wired on
  **both** platforms before the irreversible apply (D9-D2); mobile bottom toolbar (Draw / Find /
  color / undo) with Find & color `BottomSheet`s.
- i18n: `mobile` sub-objects + `confirm*` keys added to `organizePages` / `cropPdf` /
  `redactContent` in en/tr/ru (full key parity verified).

Commit: `a3a55b7`.

## Decisions
- **D9-D1** — Organize: blank-page feature + FAB skipped (honors "no new features").
- **D9-D2** — Redact: permanent-action confirm modal added on desktop AND mobile.
- **D9-D3** — Crop mobile: simplified to presets + scope + reset + apply; exact-box mm/in/px
  inputs, unit selector, and page-range scope remain desktop-only.
(See `decisions.md`.)

## GATE 9D bug fixes (post-implementation, found in device testing)
- **B9-14** — Success "Download" button overflowed at 375px. Fixed in shared `SuccessPanel`
  (`ResultPanels.tsx`): actions stack full-width on mobile, hide keyboard chips, `break-all` on
  filename. Fixes all 23 SuccessPanel tools at once.
- **B9-15** — Numeric inputs had no touch steppers / values felt stuck on the auto-filled default.
  New shared `components/tools/NumberField.tsx` (`[−] [input] [+]`, 44×44 steppers, native
  spinners hidden via `.pp-number`, focus-gated value re-sync). Adopted in Split (From/To),
  Add Page Numbers (start/first), Repeat Pages (count). `ToolUI.decrease/increase` i18n (en/tr/ru).
  Crop manual inputs left as-is (desktop-only on mobile). Commit `22ca88f`.

## GATE 9D checklist — all green
- Organize: press-hold reorder, 3-dot sheet actions, select+bulk, Apply downloads. No FAB. ✅
- Crop: touch handles (44×44), presets/scope/reset/apply from pull-up panel, Apply downloads. ✅
- Redact: touch draw, Find sheet, color sheet, Apply→confirm→redact (confirm on desktop too). ✅
- Desktop unchanged (except Redact confirm); EN/TR/RU complete; `bun run build` green. ✅
