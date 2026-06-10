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
