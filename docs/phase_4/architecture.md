# Phase 4 — Architecture (Real PDF Editor)

## Two editors (don't confuse them)
- **Annotate PDF** — `/pdf-editor`, `EditorTool.tsx`, **local** (fabric/canvas overlay in the
  browser, Phase 1). Local badge. Renamed from "PDF Editor" in Wave 4D.
- **Edit PDF** — `/edit-pdf`, `components/tools/EditPdf/*`, **cloud** (server-side PyMuPDF,
  Phase 4). Cloud badge. The pipeline below describes this one.

## Pipeline
```
Upload PDF → /api/editor/open
  ↳ editor.ts: validate, make session dir, write original.pdf + meta.json
  ↳ python parse original.pdf → render page-N.png (150 DPI) + blocks JSON
  ↳ return { sessionId, pageCount, pages:[{pageNum,width,height,textBlocks}], scanned }

Edit inline → /api/editor/save { sessionId, changes, annotations }
  ↳ editor.ts: write changes.json (idempotent — drops prior edit + annotation
    changes, re-adds the current set, keeps live add-text/whiteout/find-replace)
  ↳ python apply → rebuild working.pdf from original + changes (Wave 4C burns
    highlight/strike/draw/shape/comment overlays into the PDF)
  ↳ return working.pdf (application/pdf)

add-text / whiteout / find-replace
  ↳ editor.ts: append change to changes.json
  ↳ python apply → rebuild working.pdf + re-render affected page PNGs
  ↳ return { blockId } / { ok } / { replacements, pages }

GET /api/editor/page/:sessionId/:pageNum → serve page-N.png (read from disk)
DELETE /api/editor/close/:sessionId → rm session dir
```

## Session directory layout
```
<EDITOR_ROOT>/<sessionId>/      # EDITOR_ROOT = EDITOR_DIR env or tmpdir()/plinypdf-editor
  original.pdf                  # pristine upload — never mutated
  working.pdf                   # rebuilt on every apply (replay of changes)
  changes.json                  # cumulative, append-only change set
  meta.json                     # { createdAt, plan, pageCount }
  page-1.png ... page-N.png     # 150 DPI renders of working.pdf
```
`sessionId` is a UUID; the service rejects any non-UUID before touching the FS
(path-traversal guard). Sessions are swept (best-effort) at the top of each
request when older than the plan TTL.

## Coordinate system
- get_text bboxes are PDF points, origin top-left.
- PNG render scale = renderDPI/72 = 150/72 ≈ 2.083 → PNG_px = points × scale.
- The engine reports points + page width/height (points) + DPI; the frontend
  (Wave 4B) scales to PNG pixels for overlay positioning.

## change.json schema (one of)
```jsonc
{ "type": "edit", "blockId": "p-b-l-s", "text": "...", "fontSize": 11,
  "fontName": "Helvetica", "color": "#000000", "bold": false, "italic": false }
{ "type": "edit", "blockId": "p-b-l-s", "deleted": true }
{ "type": "add-text", "blockId": "add-<uuid>", "pageNum": 0, "x": 72, "y": 700,
  "text": "...", "fontSize": 12, "fontName": "Helvetica", "color": "#000000" }
{ "type": "whiteout", "pageNum": 0, "x": 50, "y": 50, "w": 120, "h": 20 }
{ "type": "find-replace", "find": "foo", "replace": "bar",
  "caseSensitive": false, "wholeWord": false }
// Wave 4C annotations (burned into working.pdf on save):
{ "type": "highlight", "pageNum": 0, "x": 50, "y": 50, "w": 120, "h": 14, "color": "#FACC15" }
{ "type": "strike", "pageNum": 0, "x": 50, "y": 60, "w": 120, "h": 6, "color": "#F43F5E" }
{ "type": "draw", "pageNum": 0, "x": 0, "y": 0, "w": 612, "h": 792,
  "path": "M 10 10 L 20 24 L 35 18", "color": "#000000", "strokeWidth": 3 }
{ "type": "shape", "shapeType": "arrow", "pageNum": 0, "x": 50, "y": 50,
  "w": 80, "h": 40, "x2": 130, "y2": 90, "color": "#3B82F6", "strokeWidth": 3 }
{ "type": "comment", "pageNum": 0, "x": 60, "y": 60, "text": "note body" }
```
`blockId = "<page>-<block>-<line>-<span>"` from get_text("dict") span indices on
the pristine original; geometry for an edit is resolved by re-parsing original.pdf.

## API endpoints
| Method | Path | Body | Returns |
|---|---|---|---|
| POST | `/api/editor/open` | multipart `file` | `{ sessionId, pageCount, pages, scanned }` |
| GET | `/api/editor/page/:sessionId/:pageNum` | — | PNG |
| POST | `/api/editor/save` | `{ sessionId, changes, annotations }` | PDF |
| POST | `/api/editor/add-text` | `{ sessionId, pageNum, x, y, text, fontSize, fontName, color }` | `{ blockId }` |
| POST | `/api/editor/whiteout` | `{ sessionId, pageNum, x, y, w, h }` | `{ ok }` |
| POST | `/api/editor/find-replace` | `{ sessionId, find, replace, caseSensitive, wholeWord }` | `{ replacements, pages }` |
| DELETE | `/api/editor/close/:sessionId` | — | `{ ok }` |

## Fonts
Base14 mapping: Helvetica→helv/hebo/heit/hebi, Times→times/tibo/tiit/tibi,
Courier→cour/cobo/coit/cobi. Non-latin-1 text (TR/RU) embeds Noto Sans from
`public/fonts/NotoSans-{Regular,Bold}.ttf`.

## Env vars
- `PYTHON_BIN` (default `python3`)
- `EDITOR_DIR` (default `tmpdir()/plinypdf-editor`)
