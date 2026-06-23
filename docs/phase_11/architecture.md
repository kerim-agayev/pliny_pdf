# Phase 11 — Edit PDF Architecture (Investigation)

> Filled BEFORE Wave 11A coding (CLAUDE_11 §3). Source of truth for how Edit
> PDF text editing works.

## High level

Edit PDF = a PyMuPDF (fitz) engine driven from the Bun/Elysia backend. The
browser never edits the real PDF directly — it shows server-rendered PNGs of
each page and overlays DOM elements, then POSTs a change list on save.

```
upload → POST /api/editor/open → pdf-editor.py parse
       → renders every page to page-<n>.png (150 DPI) + returns textBlocks JSON
browser shows <img> PNG + DOM text-block / annotation overlays
edit   → store changes (Zustand)
save   → POST /api/editor/save → pdf-editor.py apply
       → redact old text, draw new, re-render affected pages, return PDF
```

## Frontend — `components/tools/EditPdf/`

18 files. Key ones:

- `index.tsx` — editor shell; upload, session, save/download, shortcuts.
- `EditorCanvas.tsx` — page surface. Page background is a PNG:
  `<img src={pagePngUrl(sessionId, pageNum)}>` (lines ~768-778). Text blocks &
  annotations are DOM overlays on top.
- `TextBlock.tsx` — one editable text block. Double-click → contentEditable.
  **Draws a client-side white mask div (`background:#fff`) over the original
  text bbox while editing** (lines ~266-281, `zIndex:-1`) to hide the stale
  baked text in the PNG. This is a *live approximation* of the server redaction.
- `WhiteoutTool.tsx` — the separate user "whiteout" annotation (already
  supports a chosen color; not the text-edit mask).
- `lib/api/editor.ts` — `saveEditor()` POSTs `{ sessionId, changes[],
  annotations[] }` to `/api/editor/save` (lines ~132-146), returns the PDF Blob.

The editor shows a **rendered image**, not the live PDF. No pixel/background
sampling exists on the frontend.

## Backend — `server/`

- `routes/editor.ts` — `POST /api/editor/save` (115-191) maps the body to a
  `Change[]` and calls `saveSession()`. `GET /api/editor/page/:sid/:n` serves
  the PNGs.
- `services/editor.ts` — shells out to Python (`pdf-editor.py`) via execFile.
- `services/pdf-editor.py` — the engine (single-file CLI, `parse` / `apply`):
  - `cmd_apply` (602-661): opens pristine `original.pdf`, replays
    `changes.json`, saves `working.pdf`, re-renders only affected pages.
  - `_apply_edit` (264-305): `_redact_rect(bbox)` removes old text →
    `_insert_text(...)` draws new text at the original baseline.
  - **`_redact_rect` (215-218): `add_redact_annot(rect, fill=(1,1,1))` +
    `apply_redactions()` — the hardcoded WHITE mask. The bug.**
  - `_insert_text` (171-199): Noto (unicode) or base-14 font; color default
    `#000000`.
  - `_render_page` (150-152): `page.get_pixmap(dpi=150)` → PNG. Only used for
    preview, never for sampling.

## Investigation Q&A (CLAUDE_11 §Step 1)

1. Editing existing text = **(b)** redact old text (true removal) then draw new.
2. Mask fill color set at **`pdf-editor.py:217`**.
3. Hardcoded **white `(1, 1, 1)`** (normalized float RGB).
4. No background sampling anywhere today.
5. Pages rendered server-side via **PyMuPDF pixmap → PNG**; editor shows the
   PNG (pdf.js is used by *other* tools, not Edit PDF).
6. Editor shows a **rendered image** of the page, not the actual PDF.

## Wave 11A fix location

`_redact_rect`'s `fill=(1,1,1)` is the single point to change. Sample the real
background behind the edited bbox (Option B, backend PyMuPDF) and pass it as
the fill; fall back to white when the background isn't a flat color.
