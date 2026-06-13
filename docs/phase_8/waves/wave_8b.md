# Wave 8B — Snap / Alignment Guides

## Status: DONE ✅ (GATE 8B passed 2026-06-13)

## Goal
Figma-style snap lines during drag (page center, block-to-block, margins).

## Pre-requisite
Ask user for Claude Design handoff link before starting. — N/A (user confirmed no
handoff for 8B; visual spec from CLAUDE_8.md: indigo #6B5CE7, 1px dashed).

## What shipped
- `lib/editor/snapGuides.ts` — pure snap engine: `calculateSnapTargets`
  (page center + 36/72pt margins + each element's edges/centers, de-duped) and
  `findSnap` (per-axis independent, smallest-delta-within-threshold; zero-size box
  → point snapping). `textSnapBox` / `TEXT_LINE_RATIO = 1.2` gives every text
  block a uniform font-derived line box so tops AND bottoms align consistently.
- `components/tools/EditPdf/SnapGuideOverlay.tsx` — full-length indigo `#6B5CE7`
  1px-dashed guide lines, `pointerEvents: none`, rendered above the page PNG.
- `EditorCanvas.tsx` — shared snap controller (`collectSnapBoxes` / `snapStart` /
  `snapApply` / `snapEnd`); targets cached once per drag, guide render rAF-coalesced,
  position snap synchronous. Hooked `beginAnnotDrag` (image/stamp/mark/whiteout),
  `beginCommentDrag` (point snap), `beginDrag` (shape **creation** corner, rect/circle
  only — arrow/line excluded). Threshold `8 / scale` (zoom-correct).
- `TextBlock.tsx` — 3 optional snap props; `handleMove` snaps the candidate PDF
  position and re-expresses it as the display-px transform; commits snapped position.

## Applies to
Text blocks, images, stamps, marks (✓✗○), comment pins (move-snap); shapes
rect/circle (creation-snap). Skipped: highlight, strike, freehand, arrows, lines.

## Bug fixes during GATE
- Bug 1 — top/bottom snap inconsistency: text blocks now snap by a uniform
  font-derived line box (`TEXT_LINE_RATIO`), decoupled from inconsistent stored
  bbox heights (PyMuPDF vs Add Text).
- Bug 2 — Add Text overflow: widened the placed bbox (`measureTextWidth + 20`) so
  the selectable box contains the server-rendered line; height tightened to
  `fontSize * 1.2` (matches `TEXT_LINE_RATIO`, removes excess bottom padding).
- Bug 3 — margin snap: verified working (36/72/W-36/W-72, 36/72/H-36/H-72).

## Known follow-ups (Wave 8C)
- Multi-line text blocks snap by first-line bottom (single-line is the norm).
- Pixel-perfect Add-Text-vs-original bottom match needs the server to return the
  true text bbox on `addText` — proper fix lands with smart auto-resize (8C).

## See CLAUDE_8.md §4 Wave 8B for full spec.

## Commits
- `6cd9445` feat: snap/alignment guides (page center, block-to-block, margins)
- `cdffb17` fix: consistent text-block bottom snap + Add Text overflow
- `d5314f3` fix: tighten Add Text block height to fontSize*1.2
