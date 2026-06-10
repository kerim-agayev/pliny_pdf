# Wave 6C — Links & Whiteout Improvements

**Status**: ✅ GATE 6C PASSED (2026-06-10)

## Features shipped

### 11. Add URL link to text
- Select a text block → "Link" button (row 2, enabled when a block is selected) → `LinkDialog` for URL.
- URL normalized (prepends `https://` if no scheme; basic validation) in `normalizeUrl()`.
- Stored as annotation `{ type:"link", pageNum, x, y, w, h, uri, color:"#2563EB" }` over the block's rect (honors a moved-block position override at creation time).
- Canvas: `LinkOverlay` — blue underline overlay, hover tooltip (URL via `title`), hover ✕ + Del/Backspace delete.
- Burn: `_apply_link()` → `page.insert_link({kind: LINK_URI, from: rect, uri})` — a real clickable hyperlink.

### 13. Whiteout improvements (re-architected)
Whiteout changed from an **immediate, permanent** structural op into an **editable client annotation** (same model as image/stamp from 6B):
- Drag creates `{ type:"whiteout", x,y,w,h, color, border, borderColor }` — selectable, draggable, resizable, deletable, undoable.
- **Color picker** (toolbar cluster when whiteout tool active): White (default), Black (= blackout), two presets + custom color input.
- **Border**: toggle + border-color picker.
- **Duplicate to all pages**: button on a selected whiteout → copies the rect+style to every other page in one undo step (`addAnnotations`).
- **Delete**: hover ✕ or Del/Backspace.
- Burn: `_apply_whiteout()` → `add_redact_annot(rect, fill=color)` + `apply_redactions()` (TRUE removal of underlying text/images), then `draw_rect` border if enabled.

### 14. Blackout
- Just a whiteout annotation with `color:"#000000"` (Black swatch in the picker). Redaction fill is black → underlying text genuinely removed (verified: text no longer extractable).

### 12. Edit/remove EXISTING links — DEFERRED
Deferred to a later wave per user decision (D6-8). Existing PDF links are preserved automatically (cmd_apply rebuilds from original.pdf) but are not yet editable. Feasibility verified (`get_links()` returns `xref`, `delete_link()` works).

## Files changed
- `lib/stores/editorStore.ts` — `Annotation.type` += `"whiteout"`,`"link"`; fields `border?`,`borderColor?`,`uri?`; state `whiteoutColor/whiteoutBorder/whiteoutBorderColor` + `setWhiteout`; batched `addAnnotations()`.
- `lib/api/editor.ts` — `AnnotationChange` type union + `border?`,`borderColor?`,`uri?`.
- `components/tools/EditPdf/EditorCanvas.tsx` — removed immediate-whiteout path + `whiteoutOverlays`; new `WhiteoutOverlay` + `LinkOverlay`; `commitDrag` whiteout → annotation; `duplicateWhiteoutAllPages`; Del/Backspace incl whiteout+link.
- `components/tools/EditPdf/EditorToolbar.tsx` — whiteout color/border cluster (when tool=whiteout); Add-Link button (row 2) + `addLink`; `LinkDialog` render.
- `components/tools/EditPdf/LinkDialog.tsx` — **new** URL modal + `normalizeUrl()`.
- `components/tools/EditPdf/index.tsx` — `annotationList()` serializes `border`,`borderColor`,`uri`.
- `server/services/editor.ts` — `ANNOT_TYPES` += `"whiteout"`,`"link"`.
- `server/routes/editor.ts` — `/save` annotations schema += `border`,`borderColor`,`uri`.
- `server/services/pdf-editor.py` — rewrote `_apply_whiteout` (color fill + border); new `_apply_link`; two-pass (links after redactions) in `cmd_apply`.
- `messages/{en,tr,ru}.json` — `whiteoutColor`,`whiteoutBorder`,`whiteoutBorderColor`,`whiteoutDuplicateAll`,`blackout`,`linkDialogTitle`,`linkUrlLabel`,`linkUrlPlaceholder`,`linkSave`,`linkInvalidUrl`.

## Architecture decisions
- **Whiteout = editable annotation, burned as redaction on save** — enables color/border/duplicate/delete/undo while keeping true content removal (privacy). D6-8.
- **Blackout = black whiteout color** (no separate tool/type).
- **Links: two-pass** in `cmd_apply` (all redactions first, links last) so an overlapping whiteout's `apply_redactions` can't strip a freshly inserted link.
- **Legacy `/whiteout` route + `whiteout()` client/service fns** left in place unused (back-compat, removable later).

## Known limitations
- A link's rect is captured when the link is created; it does NOT follow a text block moved *afterward*.
- Existing-link edit/remove deferred (feature 12).

## GATE 6C checklist — ✅ PASSED (2026-06-10)
- [x] `bun run build` green
- [x] Python smoke test: blackout removes underlying text; link inserted + survives redaction (two-pass)
- [x] Add link → clickable in downloaded PDF (with visible blue underline)
- [x] Whiteout color/custom in saved PDF
- [x] Duplicate to all pages (behind a confirmation dialog)
- [x] Whiteout/link select + ✕/Del + undo
- [x] Blackout: copy/extract over box yields no text
- [x] i18n en/tr/ru, no MISSING_MESSAGE
- [x] Hetzner deploy

## GATE feedback applied (D6-9)
- Border feature removed (not useful).
- Duplicate-to-all-pages now requires a confirmation dialog.
- Links draw a blue underline in the PDF so the hyperlink is visually obvious.
