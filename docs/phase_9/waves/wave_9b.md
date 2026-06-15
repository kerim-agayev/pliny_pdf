# Wave 9B — Annotate PDF Mobile Redesign — ✅ DONE (GATE 9B PASSED 2026-06-15)

**Goal:** Bring **Annotate PDF** to Edit PDF's mobile quality (full-screen takeover).

Annotate PDF = `components/tools/EditorTool.tsx` (route `pdf-editor`, `toolId="edit"`),
a local Fabric.js annotation editor. **Not** the cloud `EditPdf/` editor (that was the
reference). The spec's `components/tools/AnnotatePdf/` path does not exist.

## What shipped
- **Mobile detection + full-screen takeover** — `useMediaQuery("(max-width:767px)")`; on
  mobile, EditorTool renders a `position:fixed; inset:0` flex-column overlay that escapes
  ToolShell. Desktop layout unchanged. Background scroll locked while open.
- **New `components/tools/MobileAnnotateToolbar.tsx`** — props/callback-driven (no store,
  unlike Edit PDF's store-driven MobileToolbar). 11 tools, 58×56 cells, horizontal scroll.
  Adaptive option `BottomSheet`: Color always; Stroke width for pen/shapes. 8-color palette
  + 3 stroke presets from the design.
- **Shell:** top bar (back + title + filename + Save w/ unsaved dot), secondary row
  (undo/redo + page nav), scrollable dark canvas, bottom toolbar, Pages FAB → 3-col drawer,
  "pinch to zoom" hint pill.
- **Long-press context menu** — Change color / Duplicate / Edit / Delete (Fabric `mouse:down`
  + 500ms timer, 10px move threshold).
- **Delete** — floating button on selection (mobile red FAB, desktop labelled button) +
  Delete/Backspace key; undoable.
- **Pinch-zoom + pan** — `usePinchZoom`, re-bound on `[file,isMobile]`.
- i18n: `ToolPages.editor.mobile` block (EN/TR/RU).

## Canvas layout — copied from Edit PDF (after 3 GATE rounds)
Final structure mirrors `EditPdf/index.tsx` + `EditorCanvas.tsx`:
- outer content box `flex:1; minHeight:0; overflow:hidden; position:relative` hosts the
  absolute hint + FABs;
- inner scroll surface `flex:1; overflow:auto; justifyContent:center` (NO `alignItems:center`),
  dark `radial-gradient + grid + var(--bg-2)`, padding 28/24;
- **no `touchAction:none` on the scroll container** (only the page overlay blocks touch);
- two-finger pinch+pan via `panTarget = wrapRef`.
- `fitToScreen()` (ResizeObserver-driven) gives an initial whole-page fit; pinch then scrolls.

## GATE 9B — PASSED (2026-06-15, user-confirmed on Vercel)
Top/bottom bars always visible · scrollable dark canvas · pinch-zoom + pan · long-press menu ·
color sheet stays open · undo/redo across many steps · delete (button + Del key) · desktop
unchanged · EN/TR/RU · `bun run build` green.

## Bugs fixed during gate
- **B9-8** Long-press menu never fired — 0px move-cancel + Fabric touch jitter killed the timer.
  Fix: 10px move threshold + start ref, 500ms.
- **B9-9** Undo/redo broke after a step — `snapshot()` pushed post-change states with no baseline,
  so the first undo reloaded the just-popped state (no-op). Fix: baseline + keep-current-on-top.
- **B9-10** Pinch-zoom never bound — `usePinchZoom` ran once at mount when the dropzone (no
  wrapRef) was showing. Fix: added optional deps param to the shared hook; pass `[file,isMobile]`.
- **B9-11** Color sheet closed instantly — the long-press menu tap's trailing `click` hit the
  freshly-mounted BottomSheet backdrop. Fix: defer opening the sheet 120ms.
- **B9-12** Top bar hidden / PDF overflowed / no pan — `alignItems:center` made overflow
  unreachable and `touchAction:none` on the scroller blocked panning. Fix: copy Edit PDF's
  canvas pattern exactly (above).

## Decisions / deviations (re-layout only — Phase 9 adds no new features)
- **D9-B1** No eraser on mobile — deletion via long-press menu / Delete button (matches design).
- **D9-B2** No swipe-to-page — page nav via chevrons + Pages drawer (single-finger is for
  draw/move; the design uses explicit controls). User-accepted.
- **D9-B3** Text/sticky sheets are Color-only; no font/size/bold-italic, no highlight opacity
  slider, no shape fill toggle — the Annotate engine doesn't have those (would be new features).
- **D9-B4** No Find pill in the secondary row — Annotate has no find/replace.
- **D9-B5** Mockup `StatusBar9`/`HomeIndicator` are frame chrome → replaced by real
  `env(safe-area-inset-*)`.

## Files
- `components/tools/EditorTool.tsx` — mobile takeover, long-press menu, delete, fit, history fix.
- `components/tools/MobileAnnotateToolbar.tsx` — new.
- `lib/touch.ts` — `usePinchZoom` optional `deps` param (backward compatible; Edit PDF unaffected).
- `messages/{en,tr,ru}.json` — `ToolPages.editor.mobile`.

Commits: `4b34927` (initial) → `664478b` → `1214c98` → `1412383` (canvas = Edit PDF pattern).
