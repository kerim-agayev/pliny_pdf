# Wave 6B — Images & Stamps

**Status**: ✅ COMPLETE (2026-06-10)

## Features shipped

### 7. Add Image to PDF
- Toolbar "Add image" button (ImageIcon) opens native file picker (JPG/PNG/GIF/BMP/WEBP)
- Upload: POST `/api/editor/upload-image` → stored as `img-<uuid>.<ext>` in session dir
- Returns `imageId`; annotation `{ type: "image", imageId, pageNum, x, y, w, h }` added to store
- Initial size: auto aspect ratio, max 150 PDF points on the longer side, centered on page
- Canvas overlay: draggable + resizable (bottom-right handle) + hover ✕ delete + Del key
- Preview: GET `/api/editor/image/:sessionId/:imageId` serves the stored file
- Burn: `_apply_image()` in pdf-editor.py → `page.insert_image(rect, filename=path)`

### 8. Delete existing image
Already possible via the Whiteout tool — documented, no new code needed.

### 9. Stamps (predefined)
- Toolbar "Stamp" dropdown (bolt icon + caret) — 8 stamps: DRAFT, APPROVED, CONFIDENTIAL, COPY, FINAL, VOID, RECEIVED, REVIEWED
- Color: red (DRAFT/VOID/CONFIDENTIAL), green (APPROVED), blue (others)
- Annotation `{ type: "stamp", label, color, pageNum, x, y, w, h }` added to store — no backend call at placement
- Canvas overlay: draggable + resizable + hover ✕ + Del key
- Burn: `_apply_stamp()` → PyMuPDF `draw_rect` + `insert_textbox` (no external PNG assets)

### 10. Date stamp
- Toolbar "Date stamp" dropdown (clock icon + caret) — 3 formats: "June 10, 2026" / "10/06/2026" / "2026-06-10"
- Calls `addText` API at (72, 72) on current page using current font/size/color settings
- No new backend code — reuses existing `add-text` structural op

## Pre-existing bug fixed
**NotoSerif fonts missing** — `NotoSerif-Regular.ttf` and `NotoSerif-Bold.ttf` were referenced in pdf-editor.py but missing from `public/fonts/`. Downloaded from notofonts GitHub repo and committed.

## Files changed
- `public/fonts/` — added NotoSerif-Regular.ttf, NotoSerif-Bold.ttf
- `server/services/pdf-editor.py` — `_apply_stamp()`, `_apply_image()`, dispatch in `cmd_apply`
- `server/services/editor.ts` — `uploadImage()`, `getSessionImage()`, expanded `ANNOT_TYPES`
- `server/routes/editor.ts` — `/upload-image` POST, `/image/:sessionId/:imageId` GET, schema additions (`imageId`, `label`)
- `lib/api/editor.ts` — `AnnotationChange` type additions, `uploadImage()`, `imagePreviewUrl()`
- `lib/stores/editorStore.ts` — `Annotation` type: added `"image" | "stamp"`, `imageId?`, `label?`
- `components/tools/EditPdf/EditorToolbar.tsx` — Image button, Stamp dropdown, Date dropdown
- `components/tools/EditPdf/EditorCanvas.tsx` — `ImageOverlay`, `StampOverlay` components, drag/resize logic, Del key handler
- `components/tools/EditPdf/index.tsx` — `annotationList()` passes `imageId` and `label`
- `messages/en.json`, `tr.json`, `ru.json` — `toolImage`, `toolStamp`, `toolDate` keys

## Architecture decisions
- **Stamps**: PyMuPDF-drawn (draw_rect + insert_textbox) — no external assets
- **Image upload**: Immediate (at picker time), `imageId` reference in annotation, not base64
- **Image/stamp burn**: In `ANNOT_TYPES` → replaced wholesale on save (same pattern as highlight/draw)

## GATE 6B checklist
- [ ] `bun run build` green ✅
- [ ] Upload JPG → overlay appears, drag, resize, save → PDF contains image
- [ ] All 8 stamps work, drag, resize, save → PDF contains stamp
- [ ] Date stamp: all 3 formats insert correct text
- [ ] Undo/redo works for all three features
- [ ] NotoSerif font works in save (no FileNotFoundError)
- [ ] Hetzner deploy with new NotoSerif TTFs
