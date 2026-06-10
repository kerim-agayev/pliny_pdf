# Phase 6 — Log

## 2026-06-09 — Phase 6 session 1 started

- Read CLAUDE_6.md, docs/phase_6/ did not exist → created tree
- Code-read all key files: EditorCanvas, TextBlock, EditorToolbar, editorStore,
  lib/api/editor, server/routes/editor, server/services/editor, pdf-editor.py
- Confirmed Bug C already fixed in TextBlock.tsx (Math.max(50,w), Math.max(20,h))
- Identified bold/italic text-erasure bug in _apply_edit (geo map lacks text)
- Confirmed newText→text mapping in server/routes/editor.ts (line 124)
- User chose "Download NotoSerif fonts" for Wave 6A fonts decision
- Wave 6A plan approved; implementation started

## 2026-06-09 — GATE 6A PASSED ✅

All 10 gate criteria confirmed green after multiple re-test rounds. Final commits:

- `3f7ebbb` — Wave 6A main implementation (text move/duplicate, 6 fonts, bold/italic, shape drag preview)
- `b2472d4` — Bug fix round 1 (move feedback, resize clip, strike width, whiteout z-index, F&R removal)
- `49043be` — Bug fix round 2 (ghost mask for move, resize removed, underline persists)
- `47a63c1` — Bug fix round 3 (moved block visible after drop, bold/italic UI persist, underline in PDF)
- `e1d1ab2` — Italic fix (Noto/unicode path now synthesizes oblique via shear matrix)
- `19eb2d9` — Small move z-index fix (ghost no longer covers new position for tiny moves)

Wave 6B starts next session.

## 2026-06-10 — Wave 6B implementation complete (GATE pending)

- Downloaded NotoSerif-Regular.ttf + NotoSerif-Bold.ttf (pre-existing bug fix — files were missing)
- Python: `_apply_stamp()` (PyMuPDF draw_rect + insert_textbox), `_apply_image()` (page.insert_image), dispatch in cmd_apply
- Backend: `uploadImage()`, `getSessionImage()` in editor.ts; `ANNOT_TYPES` expanded to include "image" and "stamp"
- Routes: POST `/api/editor/upload-image`, GET `/api/editor/image/:sessionId/:imageId`, save schema additions (imageId, label)
- Frontend: `AnnotationChange` type extended, `uploadImage()` + `imagePreviewUrl()` client functions
- Store: `Annotation` type extended with "image" | "stamp", imageId?, label?
- Toolbar: Image button (file picker, auto aspect ratio), Stamp dropdown (8 labels, colored), Date dropdown (3 formats)
- Canvas: `ImageOverlay` + `StampOverlay` components with drag, resize, hover ✕ + Del key delete
- index.tsx: annotationList passes imageId and label on save
- All 3 locales (en/tr/ru) updated with toolImage, toolStamp, toolDate keys
- `bun run build` ✅ green

## 2026-06-10 — GATE 6B PASSED ✅

Verified after several post-implementation bug-fix rounds:
- Image: add (auto aspect), drag, resize, ✕/Del delete, PDF burn ✅
- Stamps (8): correct colors, drag, resize, PDF burn — fixed empty-rectangle bug
  for long labels (insert_textbox silently dropped CONFIDENTIAL/RECEIVED; now
  width-measured insert_text) ✅
- Delete: hover ✕ + Del/Backspace key (added Backspace + input-focus guard) ✅
- NotoSerif: no FileNotFoundError on save ✅
- Undo: multi-step for image + stamp ✅
- Date stamp: built then REMOVED from UI per user (D6-7) — clipping/overlap issues
  + not needed.

Commits: 0cd4a45, ed87e7a, 3cfd591, 5a3cb69 (date fixes), fa6e8f8 (date removal).
Wave 6C (Links & Whiteout Improvements) starts next.

## 2026-06-10 — Wave 6C implemented (GATE pending)

- Whiteout re-architected: immediate structural op → editable client annotation
  (color picker incl. black=blackout, border toggle+color, duplicate-to-all-pages,
  select/✕/Del, undo). Burned on save as redaction (true removal) + optional border.
- Blackout = black whiteout color (no separate tool).
- Add URL link (feature 11): "Link" button on a selected block → LinkDialog → link
  annotation → page.insert_link on save (real clickable hyperlink). LinkOverlay with
  hover URL tooltip + delete.
- Python: rewrote _apply_whiteout (color fill + border), added _apply_link, two-pass
  (links after redactions) in cmd_apply.
- Backend: ANNOT_TYPES += whiteout/link; /save schema += border/borderColor/uri.
- i18n en/tr/ru added. `bun run build` ✅ green.
- Python smoke test ✅: blackout removes underlying text; link inserted + survives.
- Feature 12 (edit/remove existing links) DEFERRED (D6-8).
- NOT committed — awaiting GATE 6C confirmation.

## 2026-06-10 — Wave 6C GATE feedback round 1

- Removed whiteout border feature (D6-9) — store/API/route/Python/i18n.
- Duplicate-to-all-pages now requires confirmation (new ConfirmDialog.tsx).
- Links now draw a blue underline in the saved PDF (visible hyperlink look).
- `bun run build` ✅; Python smoke test ✅ (link + blue underline drawing present).
- NOT marking GATE passed — awaiting re-test.

## 2026-06-10 — GATE 6C PASSED ✅

Links & Whiteout Improvements verified:
- Add link → clickable hyperlink + visible blue underline in downloaded PDF ✅
- Whiteout: color/custom, select/drag/resize/✕/Del, undo ✅
- Blackout: true redaction (underlying text removed) ✅
- Duplicate-to-all-pages behind confirmation dialog ✅
- Border feature removed (D6-9) ✅
Feature 12 (edit/remove existing links) deferred (D6-8).
Commits: 084142e (impl), 351df0d (GATE feedback). Wave 6D next.

## 2026-06-10 — Wave 6D implemented (GATE pending)

- #15 Shape drag preview (Bug A): VERIFIED already fixed in Wave 6A
  (EditorCanvas.tsx per-tool drag preview). No code change.
- #16 Highlight color: dedicated 6-color pastel palette (#FBBF24/#34D399/#60A5FA/
  #F472B6/#FB923C/#FCA5A5) shown when highlight tool active; new `highlightColor`
  store state; commitDrag uses it. Existing highlights now selectable + recolorable
  (HighlightTool recolor menu wired); ~40% on-screen opacity. Backend already honored
  change.color @ 0.35.
- #17 Sticky note: toolbar 4-color palette + `commentColor` state; pin uses chosen
  color; pin drags to reposition (>4px = move, else toggle bubble); hover-✕ on pin +
  Del key delete; color burned into PDF (annot.set_colors). Bubble resize SKIPPED
  (user decision — textarea keeps vertical resize).
- #18 Shapes fill: `shapeFill` store state + "Fill" toggle (rect/circle only);
  fill = stroke color @ 20% (FE overlay + drag preview); backend _apply_shape
  draw_rect/draw_oval fill=rgb, fill_opacity=0.2.
- #19 Marks: new `mark` annotation type + `markType` (check/cross/circle) + `mark`
  tool. Toolbar "Marks" dropdown (✓ green / ✗ red / ○ blue). Click-to-place at click
  point, 24×24, draggable + resizable (MarkOverlay) + Del. Backend _apply_mark
  (draw_polyline / two diagonals / draw_oval) + cmd_apply dispatch.
- Plumbing: AnnotationChange + Annotation types gain fill?/markType?; index.tsx
  serializes them; editor.ts ANNOT_TYPES += "mark".
- i18n en/tr/ru: toolMark, markCheck, markCross, markCircle, fill, highlightColor,
  commentColor. `bun run build` ✅ green (no MISSING_MESSAGE). Python py_compile ✅.
- NOTE: CLAUDE_6 §7 said 6D is "frontend only" — incorrect; pdf-editor.py changed
  (#17/#18/#19) → Hetzner backend deploy required.
- Committed 90411bd + pushed (user testing on Vercel).

## 2026-06-10 — Wave 6D GATE feedback round 1 (3 bugs)

- Bug 1 (comment can't type): bubble lived inside canvas; only stopped onMouseDown,
  so onPointerDown bubbled to canvas → placed a new note. Fixed: bubble now stops
  onPointerDown/onMouseDown/onClick (CommentTool.tsx).
- Bug 2 (marks all render as ✓ in PDF): ROOT CAUSE = Elysia /save annotation schema
  (server/routes/editor.ts) whitelisted fields and lacked `markType`+`fill`, so Elysia
  stripped them → markType undefined → default "check" for all (and shape fill silently
  dropped too). Added markType+fill to the schema. Added [mark] stderr logging.
- Bug 3 (highlight recolor): selectedAnnotId was local to EditorCanvas, so the toolbar
  couldn't react. Promoted to store (selectedAnnotId + selectAnnot); toolbar now shows
  the highlight palette when a highlight is selected and recolors it via updateAnnotation.
- `bun run build` ✅ green; py_compile ✅.
- Python changed (Bug 2) → Hetzner deploy required.
- Commits: b05910e (round 1 fixes), pushed; Hetzner backend redeployed.

## 2026-06-10 — GATE 6D PASSED ✅

Annotation & Shape Fixes verified green:
- #15 Shape drag preview (regression) — correct shape during drag ✅
- #16 Highlight — 6-color palette for new highlights + toolbar recolor of selected ✅
- #17 Sticky note — color choice, drag-reposition, hover-✕ + Del, color burned in PDF ✅
- #18 Shapes fill — Fill toggle (rect/circle), 20% fill in overlay + downloaded PDF ✅
- #19 Marks — ✓/✗/○ render as correct shapes in the downloaded PDF ✅

Commits: 90411bd (impl), b05910e (GATE round 1: comment typing, mark types/fill in PDF
via /save schema, highlight recolor via store-backed selection). Backend deployed to
Hetzner. Wave 6E (comprehensive QA & performance) starts next session.

## 2026-06-11 — Wave 6E code audit + pre-QA fixes (GATE pending)

- 3-pass code audit (frontend / store+API / backend): code in strong shape, no
  critical bugs. Full results in waves/wave_6e.md.
- Two scope-gap decisions confirmed by user: re-enable Find & Replace; full undo.
- Fixes (no backend/Python changes → no Hetzner redeploy):
  - A1 Find & Replace re-enabled: Row-3 toolbar button + ⌘H (EditorToolbar.tsx,
    index.tsx). Fixed FindReplaceModal: missing `bumpRender()` after replace (stale
    PNG) + consolidated duplicate Replace/Replace-All buttons into one "Replace All".
  - A2 Full undo: Snapshot now carries blockPositions + blockStyles; moveBlock +
    underline/align-only setFormat push snapshots; undo/redo restore them
    (editorStore.ts). Supersedes D6-5.
  - A3 CommentTool "You" → commentAuthorYou i18n (en/tr/ru), passed from EditorCanvas.
  - A4 setTimeout cleanup already present — no change.
- `bun run build` ✅ green, no MISSING_MESSAGE.
- Perf to measure in QA: 100-page open may exceed <10s (A5). 500-page Pro open
  exceeds 120s subprocess timeout → known limitation (out of QA scope).
- NOT committed — awaiting user QA pass (B1–B3) + GATE 6E confirmation.

## 2026-06-11 — GATE 6E PASSED ✅ — Phase 6 COMPLETE

Comprehensive QA pass done. Pre-QA fixes verified + two ghost-layering bugs found
during QA and fixed:
- A1 Find & Replace re-enabled (button + ⌘H); F&R full QA **deferred to Phase 7**
  (D6-10) — may be reworked/removed then.
- A2 Full undo coverage (move + underline/align) ✅.
- A3 comment author i18n ✅.
- Ghost bug round 1 (D6-11): moved-text ghost mask had zIndex:99 → covered all
  annotation overlays at the OLD position. Lowered ghost to `auto` (masks PNG by DOM
  order, paints below annotations). Kept (not deleted) — deleting would expose
  duplicate stale text until save.
- Ghost bug round 2 (D6-12): settled moved block kept zIndex:100 → blocked tools at
  the NEW position. Now `moveOffset ? 100 : undefined` (100 only during active drag,
  `auto` once settled). Annotations always paint above text blocks via DOM order.

Commits: 6550822 (A1/A2/A3 impl), b40e495 (ghost z-index D6-11), eedd14c (settled
block z-index D6-12). All frontend-only → Vercel auto-deploy, no Hetzner redeploy.
`bun run build` ✅ green throughout.

Phase 6 (Edit PDF Final Polish & Features) is complete — all waves 6A–6E gate-passed.
