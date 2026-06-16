# Wave 9F — 23 Simple Tools Responsive Audit

**Status:** ✅ DONE — GATE 9F PASSED (2026-06-16, user-confirmed on real device). Commit `bcca2b8`.

See CLAUDE_9.md for the full spec.

## Audit result

The codebase is mobile-first already (flex-col baselines, `sm:`/`lg:` prefixes, full-width
`pp-input`, `useMediaQuery("(max-width:767px)")` convention, responsive Wave 9A/9D shared
components, mobile-first `ToolShell`). Verified real widths against a ~335px content area at 375px.

Patterns that looked risky but are **self-responsive (not broken)** — left untouched:
- `repeat(auto-fill, minmax(120px,1fr))` thumbnail grids (Rotate, Delete) → collapse to 2 cols.
- `grid-cols-3` / `grid-cols-2` toggle & thumb grids (JPG→PDF, N-up buttons) → ~100px cells.
- `flex-wrap … justify-end` + `min-w-[180px]` buttons (Cloud Convert, OCR) → wrap, 180<335.
- `max-w-[200px]` NumberField (Repeat) → caps width, not overflow.
- `minHeight:460` textareas (Markdown→PDF, PDF→Text) → tall but vertical-scroll only; not broken
  (optional UX polish, left out per surgical/no-redesign).

## Fixes (2 tools — only genuine horizontal-overflow breaks)

1. **N-up Layout** (`components/tools/NupLayoutTool.tsx`): `NupSheet` preview was fixed `longSide=380`
   with `flexShrink:0` → 380px box overflowed the ~335px mobile column. Added `useMediaQuery` and
   `longSide = isMobile ? 300 : 380` (desktop 380 → pixel-identical).
2. **Reverse Pages** (`components/tools/ReversePagesTool.tsx`): two side-by-side strips of fixed
   52px `PageTile`s overflowed at 375px. Mobile-only changes (desktop reset via `sm:`):
   - Comparison row: `flex items-center … gap-4 sm:gap-6` → `flex flex-col items-center … gap-4 sm:flex-row sm:gap-6` (stack on mobile).
   - Token row: added `max-w-full overflow-x-auto py-3` + `sm:overflow-x-visible sm:py-0`
     (`py-3` reserves room so the `bottom:-8` number badge isn't clipped by the scroll container's
     forced `overflow-y:auto`).

All other 21 tools: already responsive (per-tool table in the approved plan). `bun run build` green.
