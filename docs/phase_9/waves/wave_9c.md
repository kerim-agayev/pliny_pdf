# Wave 9C — Sign PDF Mobile Redesign — DONE ✅

**Status:** ✅ GATE 9C PASSED (2026-06-16, user-confirmed on Vercel).

## What shipped
Full-screen mobile takeover for Sign PDF, matching Edit/Annotate mobile quality. Desktop unchanged.

- **2-screen takeover** (Create → Place) in new `components/tools/SignPdfMobile.tsx`; desktop `SignPdf.tsx` renders it via `useMediaQuery("(max-width: 767px)")` once a file is loaded.
  - **Create:** segmented Draw / Type / Upload; full-width Fabric draw pad (200px), large vertical font list, 30px ink chips, Clear; sticky bottom "Next · place on page" / "Add to page".
  - **Place:** dark grid canvas with rendered PDF page; each signature instance is touch drag / corner-resize / delete; per-instance This page / All pages scope; page nav in header; sticky "Save & download" + "Add another signature".
- **Multiple signatures:** `signPdf` engine refactored to take `PlacedSignature[]` (one `embedPng` pass per item; desktop passes a single-element array → desktop UI unchanged).
- **i18n:** 14 new keys under `ToolPages.signPdf` (EN/TR/RU).

## Decisions
- **D9-C1:** Mobile uses a streamlined 2-screen takeover, not the literal 4-step Phone9 wizard from the design (`screen-p9-sign.jsx`). Reuses the shipped Wave 9B pattern.
- **D9-C2:** "Add date" / "Add initials" from the design Place step were skipped (not in GATE; Simplicity First).
- **D9-C3:** Type mode reuses the existing `SIG_FONTS` families rather than loading the design's Google handwriting fonts (avoids new web-font weight).
- **D9-C4:** Pressure sensitivity (CLAUDE_9 mention) not implemented — Fabric `PencilBrush` doesn't expose pointer pressure; out of scope.

## Bug fixed during gate
- **B9-13 (Place-screen crash):** Tapping Next unmounted the Create screen — including the Fabric-wrapped `<canvas>` — while disposing fabric. Fabric v6 wraps the canvas in its own DOM node, so React's subsequent `removeChild` during the create→place transition threw in the commit phase (uncatchable) and crashed Place (100% repro).
  - **Fix:** Keep the Create layer mounted (hidden via `visibility`, never unmounted); the Place layer overlays it. Init Fabric once, dispose only on full unmount — matches desktop `SignPdf`'s invariant. Mobile takeover now owns its own thumbnail loader; parent render effect skipped on mobile.

## Key files
- `components/tools/SignPdfMobile.tsx` (new) — Create/Place takeover, multi-placement
- `components/tools/SignPdf.tsx` — mobile branch + array-form sign call; parent render effect mobile-guarded
- `lib/pdf/signPdf.ts` — `signPdf(file, PlacedSignature[])` + `PlacedSignature` type
- `messages/{en,tr,ru}.json` — `ToolPages.signPdf` mobile keys
- Design ref: `.design-handoff/phase-9/plinypdf/project/screen-p9-sign.jsx`

## Commits
- `ae1f039` — feat: Wave 9C Sign PDF mobile redesign, multi-placement, 2-screen takeover
- `aecc578` — fix: keep fabric canvas mounted to stop Place crash (B9-13)
