# CLAUDE_4.md — PlinyPDF Phase 4: Real PDF Editor

> Read this file first at the start of every Phase 4 session.
> Phase 1 docs (`docs/index.md`, `docs/decisions.md`, etc.) are READ-ONLY.
> Phase 2 docs (`docs/phase_2/*`) are READ-ONLY.
> Phase 3 docs (`docs/phase_3/*`) are READ-ONLY.
> All Phase 4 memory lives under `docs/phase_4/`.

---

## 1. What this phase is

Phases 1-3 shipped 28 tools, hardening, and production deploy. The
existing "PDF Editor" tool is an **annotation tool** (fabric.js overlay,
local/browser-side) — it can add text boxes, shapes, highlights, and
drawings ON TOP of a PDF, but cannot modify the actual PDF content.

Phase 4 builds a **real PDF editor** — cloud-based, server-side
processing via PyMuPDF on Hetzner. Users can click on existing text,
modify it, change fonts/colors, add new text, delete content, whiteout
areas, and find & replace — like Sejda or PDFFiller.

The existing annotation editor stays as-is (renamed "Annotate PDF" with
local badge). The new tool is "Edit PDF" with cloud badge.

---

## 2. Architecture

### How it works (request flow)

```
User uploads PDF
    ↓
Hetzner: PyMuPDF parses PDF
    ↓
API returns to frontend:
  - Per-page PNG render (background image)
  - Text blocks JSON: [{x, y, w, h, text, fontSize, fontName, color, blockId}, ...]
    ↓
Frontend: PNG background + positioned contenteditable divs
    ↓
User clicks text → edits inline
    ↓
"Save" → sends changed blocks to server
    ↓
Hetzner: PyMuPDF redacts old text + inserts new text
    ↓
New PDF → user downloads
```

### Technology stack

| Component | Technology | Why |
|-----------|-----------|-----|
| PDF parse + render + edit | PyMuPDF (pymupdf) on Hetzner | Single library does everything. C-based MuPDF engine = very fast. Extracts text with exact coordinates, font, size, color. Renders pages to PNG. Modifies text via redaction annotations. |
| Backend API | Python script called via Bun.spawn | Same pattern as ocrmypdf (Wave 2C). Bun/Elysia calls Python, returns JSON/files. No need for a separate Python server. |
| Frontend editor | React + Canvas/DOM overlay | PNG background rendered on canvas or img. Text blocks as positioned contenteditable divs. Toolbar for font/size/color. |
| Page rendering | PyMuPDF page.get_pixmap() | High-res PNG per page. Resolution: 150 DPI (good balance of quality vs size). |
| Text extraction | PyMuPDF page.get_text("dict") | Returns blocks → lines → spans with bbox, font, size, color, text. |
| Text modification | PyMuPDF redaction annotations | Remove old text via page.add_redact_annot(bbox) + page.apply_redactions(). Insert new text via page.insert_text(point, text, fontsize, fontname, color). |
| Font handling | PyMuPDF built-in fonts + Noto Sans | PyMuPDF supports: Helvetica, Times, Courier (built-in). For Unicode (TR/RU): embed Noto Sans TTF (already in public/fonts/ from Phase 2). |

### Hetzner setup

```bash
pip install pymupdf --break-system-packages
```

New files on Hetzner (via git pull):
- `server/services/pdf-editor.py` — Python script for parse/render/edit
- `server/routes/editor.ts` — Elysia routes calling the Python script
- `server/services/editor.ts` — Bun.spawn wrapper

### API endpoints

```
POST /api/editor/open
  Body: multipart (file: PDF)
  Returns: { sessionId, pageCount, pages: [{ pageNum, width, height, textBlocks: [...] }] }
  Side effect: saves PDF to temp dir, renders page PNGs

GET /api/editor/page/:sessionId/:pageNum
  Returns: PNG image of that page (background render)

POST /api/editor/save
  Body: { sessionId, changes: [{ blockId, newText, fontSize, fontName, color, deleted }] }
  Returns: modified PDF file (application/pdf)

POST /api/editor/add-text
  Body: { sessionId, pageNum, x, y, text, fontSize, fontName, color }
  Returns: { blockId } (new block added)

POST /api/editor/whiteout
  Body: { sessionId, pageNum, x, y, w, h }
  Returns: { ok }

POST /api/editor/find-replace
  Body: { sessionId, find, replace, caseSensitive, wholeWord }
  Returns: { replacements: number, pages: [...updated text blocks...] }

DELETE /api/editor/close/:sessionId
  Cleans up temp files for this session
```

### Session management

- Each editor session creates a temp directory on Hetzner: `/tmp/plinypdf-editor/<sessionId>/`
- Contains: original PDF + rendered page PNGs
- Auto-cleanup: sessions older than timeout are deleted via cron or on-demand
- Timeout: anon 15 min, free 30 min, pro 60 min

---

## 3. Limits

| | Anonim | Free | Pro |
|---|---|---|---|
| Pages | 20 | 100 | 500 |
| File size | 15 MB | 50 MB | 200 MB |
| Daily uses | 3/day | 10/day | Unlimited |
| Session timeout | 15 min | 30 min | 60 min |

Limits enforced at:
- Frontend: FileDropzone validates size before upload
- Backend: `/api/editor/open` checks page count + file size per plan
- Rate limit: reuses existing Upstash `checkServerTool` pattern
- Session timeout: Python script checks session age on every request

---

## 4. Features — what ships in Phase 4

### Wave 4A — Backend: PyMuPDF service (Hetzner)

Build the Python script + Elysia routes. No frontend yet — test via
curl/httpie.

1. `server/services/pdf-editor.py` — single Python script with CLI:
   - `parse <input.pdf> <output-dir>` → extracts text blocks JSON + renders PNGs
   - `save <session-dir> <changes.json>` → applies edits, outputs new PDF
   - `add-text <session-dir> <params.json>` → adds new text block
   - `whiteout <session-dir> <params.json>` → covers area with white rect
   - `find-replace <session-dir> <params.json>` → bulk find & replace

2. `server/services/editor.ts` — Bun.spawn wrapper for the Python script

3. `server/routes/editor.ts` — Elysia routes:
   - POST /api/editor/open (multipart, auth-optional, rate-limited)
   - GET /api/editor/page/:sessionId/:pageNum (serves PNG)
   - POST /api/editor/save (returns modified PDF)
   - POST /api/editor/add-text
   - POST /api/editor/whiteout
   - POST /api/editor/find-replace
   - DELETE /api/editor/close/:sessionId

4. Session management: temp dir creation, cleanup, timeout check

5. Wire routes into `server/index.ts`

GATE 4A: curl tests on Hetzner:
- Upload PDF → get text blocks JSON + page PNGs
- Modify a text block → get correct modified PDF
- Find & replace → correct replacements
- Whiteout → area covered in output PDF

### Design handoff — required before Wave 4B

The PDF Editor has a complex, custom UI that does NOT fit ToolShell.
A Claude Design handoff is **mandatory** before starting Wave 4B.

**When you reach Wave 4B:**
1. STOP and ask the user for the Claude Design handoff link.
2. The user will provide a URL (e.g. `https://api.anthropic.com/v1/design/h/...`)
3. Fetch the design file from the handoff URL.
4. Save screens to `.design-handoff/edit-pdf/`
5. Confirm: "Fetched N screens for Edit PDF, saved to .design-handoff/edit-pdf/"
6. Build the frontend to match the handoff exactly.

**Do NOT start Wave 4B without the handoff.** Do NOT invent the UI.
The design covers 17 states including: empty, loading, editor active,
text editing, add text, whiteout, highlight, drawing, shapes, comments,
find & replace, context menu, session expiry, scanned PDF warning,
error states, mobile 375px, and dark mode.

### Wave 4B — Frontend: Editor UI

Build the interactive editor page. This is the largest wave.
**Requires design handoff — see above.**

6. `app/[locale]/edit-pdf/page.tsx` — server component with metadata
   (This is a NEW route. The existing `/pdf-editor` stays as "Annotate PDF".)

7. `components/tools/EditPdf.tsx` — main editor component:

   **Layout:**
   ```
   ┌─────────────────────────────────────────────────────┐
   │ ← Back to tools    Edit PDF    [Save] [Download]    │
   ├─────────────────────────────────────────────────────┤
   │ Row 1 — Tools:                                      │
   │ [Select][Text+][Whiteout][Highlight][Strikethrough]  │
   │ [Draw][Shapes ▼][Comment][Link]                      │
   │ Row 2 — Text formatting (when text selected):        │
   │ Font ▼ | Size ▼ | [B][I][U] | Color ■ | Align [◀▬▶]│
   │ Row 3 — Actions:                                     │
   │ [Undo][Redo] | [Find & Replace] | Zoom [-]100%[+]   │
   ├──────────┬──────────────────────────────────────────┤
   │ Pages    │                                          │
   │          │  PDF Page (PNG background image)          │
   │ [1] ■    │  + editable text blocks overlaid          │
   │ [2] □    │  + annotation overlays                    │
   │ [3] □    │                                          │
   │ ...      │  Selected block: blue border +            │
   │          │  4 corner resize handles                  │
   ├──────────┴──────────────────────────────────────────┤
   │ Page 1/10 | ● Cloud — Secure | 15:00 left           │
   └─────────────────────────────────────────────────────┘
   ```

   **Components to build:**
   - `EditorCanvas.tsx` — main editing area (PNG bg + text overlays)
   - `EditorToolbar.tsx` — 3-row toolbar (tools, formatting, actions)
   - `PageThumbnails.tsx` — sidebar with page previews
   - `EditorStatusBar.tsx` — page info, zoom, session timer, save
   - `TextBlock.tsx` — single editable text block (contenteditable div)
   - `WhiteoutTool.tsx` — draw white rectangle overlay
   - `HighlightTool.tsx` — drag-to-highlight text
   - `DrawingTool.tsx` — freehand pen + shapes (rect, circle, arrow, line)
   - `CommentTool.tsx` — sticky note overlay
   - `FindReplaceModal.tsx` — find & replace dialog
   - `ContextMenu.tsx` — right-click menu (cut/copy/paste/delete)
   - `SessionWarning.tsx` — expiry warning toast

   **State management (Zustand store):**
   ```ts
   interface EditorState {
     sessionId: string | null
     pages: PageData[]
     currentPage: number
     zoom: number
     selectedBlock: string | null
     changes: Map<string, BlockChange>
     undoStack: Change[]
     redoStack: Change[]
     tool: "select" | "text" | "whiteout" | "highlight" |
           "strikethrough" | "draw" | "shape" | "comment" | "link"
     shapeType: "rectangle" | "circle" | "arrow" | "line"
     fontFamily: string
     fontSize: number
     fontColor: string
     bold: boolean
     italic: boolean
     textAlign: "left" | "center" | "right"
     strokeColor: string
     strokeWidth: number
     annotations: Annotation[]
     hasUnsavedChanges: boolean
     sessionExpiresAt: number | null
   }
   ```

   **Key interactions:**
   - Click text block → select it (blue border), show in toolbar
   - Double-click → enter edit mode (contenteditable)
   - Change toolbar setting → applies to selected block
   - Click empty area with "text+" tool → add new text block
   - Drag with "whiteout" tool → draw white rectangle
   - Drag with "highlight" tool → yellow highlight on text
   - Drag with "draw" tool → freehand pen strokes
   - Select "shapes" → click+drag to draw rect/circle/arrow/line
   - Click with "comment" tool → add sticky note
   - Right-click text block → context menu
   - Ctrl+Z / Ctrl+Y → undo/redo
   - Ctrl+H → open find & replace
   - Ctrl+S → save changes
   - Ctrl+D → download PDF

8. `lib/tools.ts` — add "edit-pdf" entry (mode: cloud, cat: Edit)

9. `lib/seo.ts`, `lib/structured-data.ts` — SEO entries

10. `messages/{en,tr,ru}.json` — i18n keys for editor UI

11. PostHog events: `editor_opened`, `editor_saved`, `editor_text_edited`

GATE 4B: browser test:
- Upload PDF → pages render with text blocks
- Click text → edit inline
- Change font size/color
- Add new text block
- Whiteout an area
- Find & replace
- Save → download modified PDF → verify changes
- Undo/redo works
- Mobile (375px) — responsive layout
- Dark mode
- /en /tr /ru

### Wave 4C — Annotation features in new editor

Migrate useful annotation features from the old editor into the new one.
These run client-side (overlay on the canvas) and get burned into the
PDF on save (server-side).

12. Highlight text (yellow overlay)
13. Strikethrough
14. Underline
15. Comment/sticky note
16. Freehand drawing (pen tool)
17. Shapes: rectangle, circle, arrow, line
18. Link insertion (URL hyperlink on text)

These reuse existing fabric.js patterns from the annotation editor where
possible, adapted to the canvas-overlay architecture.

GATE 4C: all annotation tools work on the new editor, save correctly
into the output PDF.

### Wave 4D — Polish & rename

19. Rename existing `/pdf-editor` tool to "Annotate PDF" (keep local badge)
20. New `/edit-pdf` is "Edit PDF" (cloud badge)
21. Update tools index, sitemap, blog references
22. Update deploy/LAUNCH.md tool counts (28 → 29 tools)
23. Loading states, error handling, toast messages
24. Session timeout warning ("Your session expires in 5 minutes")

GATE 4D: full e2e test, both old annotator and new editor work
independently.

---

## 5. Phase 4 memory — `docs/phase_4/`

Phase 1/2/3 docs are READ-ONLY. Create a fresh tree:

```
docs/phase_4/
  index.md          # status, current wave, current task
  decisions.md      # Phase 4 decisions
  architecture.md   # editor pipeline, session management, API
  bugs.md           # bugs found this phase
  log.md            # one entry per wave gate-pass
  waves/
    wave_4a.md      # backend
    wave_4b.md      # frontend
    wave_4c.md      # annotations
    wave_4d.md      # polish & rename
```

Memory token discipline: read `docs/phase_4/index.md` first at session
start. Phase 1/2/3 docs referenced by path only.

---

## 6. Per-wave verification (mandatory before commit)

- `bun run build` — green, all routes, no MISSING_MESSAGE.
- Wave 4A: curl tests pass on Hetzner (parse, edit, find-replace, whiteout).
- Wave 4B: browser test — edit text, change font, add text, whiteout,
  find-replace, undo/redo, save → correct PDF output.
- Wave 4C: annotations save into PDF correctly.
- Wave 4D: both old annotator and new editor accessible, no regressions.

---

## 7. Constraints

- **Simplicity first.** Python script called via Bun.spawn — no Flask,
  no FastAPI, no separate Python server. One script, CLI interface,
  JSON in/out. Same pattern as ocrmypdf.
- **Surgical.** Do not modify the existing PDF Editor (annotation tool).
  It stays as-is until Wave 4D renames it. Don't touch any Phase 1-3
  tool code.
- **No Phase 1/2/3 doc edits.** All memory under `docs/phase_4/`.
- **Lemonsqueezy test mode.** Do not switch to live.
- **Stop and ask.** Design decisions for the editor UI (toolbar layout,
  mobile behavior), any new dependencies, any ambiguity in text
  editing behavior.

---

## 8. Known limitations (document, don't hide)

- **Font matching is imperfect.** If the PDF uses a proprietary font
  not available on the server, PyMuPDF substitutes with the closest
  available font (Noto Sans for Unicode, Helvetica for Latin). The
  text position may shift slightly. This is the same limitation
  Adobe Acrobat has.
- **Layout doesn't reflow.** Editing text doesn't push other text
  down. If you add more text than the original, it overflows the
  block. This matches Sejda's behavior.
- **Tables are individual text blocks.** Each cell is a separate text
  block. You can edit cell content but can't resize columns/rows.
- **Scanned PDFs.** Image-only PDFs have no text blocks to edit. Show
  a message: "This PDF is scanned — use OCR first to make it
  editable, then try again." Link to the OCR tool.
- **Some PDFs have complex text rendering** (ligatures, kerning,
  right-to-left) that may not round-trip perfectly.

---

## 9. Session bootstrap — what to do at the start of every Phase 4 session

1. Read this file (`CLAUDE_4.md`).
2. Read `docs/phase_4/index.md` to learn current state. If it doesn't
   exist yet, this is the first Phase 4 session — create the
   `docs/phase_4/` tree and stub all files plus `waves/`.
3. For Wave 4A: check Hetzner has PyMuPDF installed
   (`python3 -c "import pymupdf; print(pymupdf.version)"`).
   If not, ask user to run:
   `ssh root@49.13.119.27 && pip install pymupdf --break-system-packages`
4. For Wave 4B: check `.design-handoff/edit-pdf/` exists.
   If not, STOP and ask the user for the Claude Design handoff link.
   Fetch the design, save to `.design-handoff/edit-pdf/`, confirm
   screen count, then proceed. Do NOT start coding Wave 4B without
   the design handoff — the editor UI is too complex to invent.
5. Resume at the current wave's next un-done task.

---

## 10. Out of scope (do NOT touch in Phase 4)

- Image editing (add/move/delete images in PDF) — Phase 5
- Form filling — Phase 5
- Domain/deploy changes — already done
- Lemonsqueezy LIVE mode — launch day decision
- Any Phase 1/2/3 tool logic modifications
- Pricing page changes (Pro tier stays as-is)
