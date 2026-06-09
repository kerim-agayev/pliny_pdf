# CLAUDE_6.md — PlinyPDF Phase 6: Edit PDF Final Polish & Features

> Read this file first at the start of every Phase 6 session.
> Phase 1-5 docs are READ-ONLY.
> All Phase 6 memory lives under `docs/phase_6/`.

---

## 1. What this phase is

Phase 6 is the FINAL phase for the Edit PDF tool. After this,
Edit PDF should be production-quality with all features working
correctly, no UI bugs, no logic errors, fast performance.

Phase 6 adds missing Sejda/PDFFiller-level features, fixes all
known UI bugs, and does a comprehensive QA pass on every tool
in the editor. No new tools are added to PlinyPDF — only the
existing Edit PDF (`/edit-pdf`) is improved.

---

## 2. Known bugs to fix (from Phase 4/5 testing)

### Bug A — Shapes render wrong during drag (CRITICAL UX)
Arrow, circle, line, and strikethrough all render as dashed
highlight-like rectangles during drag. Only after releasing the
mouse do they convert to the correct shape.

Expected: shapes should look correct DURING the drag:
- Arrow: arrow line with head while dragging
- Circle: circle/ellipse outline while dragging
- Line: straight line while dragging
- Strikethrough: horizontal line while dragging

Fix in DrawingTool.tsx / EditorCanvas.tsx — the drag preview
must render the actual shape, not a generic dashed rectangle.

### Bug B — Resize: text overflows shrunk box (deferred from 5E)
When resizing a text block smaller, the text overflows outside
the dashed border. Text should wrap or truncate within the box.

Fix in TextBlock.tsx: add `overflow: hidden` or auto text-size
adjustment when the box shrinks.

### Bug C — Resize: minimum width/height swapped (deferred from 5E)
Current: min-width 20px, min-height 50px
Should be: min-width 50px, min-height 20px

Fix in TextBlock.tsx startResize: swap the Math.max values.

---

## 3. Feature list — what ships in Phase 6

### Wave 6A — Text & Movement Improvements

1. **Text Move (drag-and-drop)**
   Drag a selected text block to a new position on the page.
   - Click and hold on selected block → drag → release
   - Backend: redact old position + insert at new position
   - Update store coordinates
   - Works for both existing PDF text and newly added text

2. **Text Duplicate**
   Copy selected text block → paste at offset position.
   - Toolbar "Duplicate" button or Ctrl+D
   - Calls addText with same text/font/size/color at offset x+20, y+20
   - New block immediately selectable

3. **Move existing PDF text**
   Same as #1 but for text already in the PDF (not just added text).
   - Redact original position + insert_text at new position
   - Font substitution: base-14 fonts map correctly; custom fonts
     fall back to closest match (document this limitation)

4. **More fonts**
   Expand font family dropdown from 3 → 6:
   - Helvetica (already)
   - Times (already)
   - Courier (already)
   - Noto Sans (Unicode support — TR/RU)
   - Noto Serif (serif alternative to Times)
   - Noto Sans Mono (monospace alternative to Courier)
   Noto TTFs already in public/fonts/. Map in _base14_code + add
   fontfile parameter for Noto fonts in _insert_text.

5. **Bold/Italic toggle on existing text**
   When editing an existing block, Bold/Italic buttons change the
   font variant:
   - Helvetica → Helvetica-Bold, Helvetica-Oblique
   - Times → Times-Bold, Times-Italic
   - Courier → Courier-Bold, Courier-Oblique
   - Noto Sans → NotoSans-Bold.ttf, NotoSans-Italic.ttf
   Server-side: _base14_code already handles bold/italic variants.
   Frontend: setFormat({ bold/italic }) → include in BlockChange.

6. **Fix resize bugs (Bug B + Bug C from §2)**

### Wave 6B — Images & Stamps

7. **Add Image to PDF**
   Upload an image (JPG/PNG) → place on page → resize → burn into PDF.
   - Upload: image picker or drag-drop onto canvas
   - Placement: drag to position, corner handles to resize
   - Backend: page.insert_image(rect, filename=path)
   - Store as annotation type "image" with {pageNum, x, y, w, h, imageData}
   - Burn on save like other annotations

8. **Delete existing image**
   Select an image area → whiteout (same as existing whiteout tool).
   No special "image detection" needed — whiteout covers any content.
   (Already works, just document it as a feature)

9. **Stamp (predefined)**
   Predefined stamps: DRAFT, APPROVED, CONFIDENTIAL, COPY, FINAL,
   VOID, RECEIVED, REVIEWED.
   - Toolbar dropdown with stamp icons
   - Click → stamp appears on page, draggable + resizable
   - Burns as image annotation on save
   - Red color for DRAFT/VOID/CONFIDENTIAL, green for APPROVED,
     blue for others

10. **Date stamp**
    Click → adds current date as text block.
    - Format options: "June 9, 2026" / "09/06/2026" / "2026-06-09"
    - Uses addText API — just a convenience shortcut
    - Inherits current font/size/color settings

### Wave 6C — Links & Whiteout Improvements

11. **Add URL link to text**
    Select text → "Add Link" → enter URL → text becomes clickable.
    - Backend: page.insert_link({"kind": 2, "uri": url, "from": rect})
    - Visual: linked text gets blue color + underline overlay
    - Burns into PDF as real hyperlink

12. **Change/Remove existing links**
    Detect existing links on parse → show as clickable overlays.
    - Backend parse: extract links with page.get_links()
    - Frontend: show link URL on hover tooltip
    - Click link overlay → edit URL or remove
    - Needs API extension: /api/editor/open returns links[]

13. **Whiteout improvements**
    - Color picker: white (default), custom color
    - Border: optional border around whiteout area
    - Duplicate: copy whiteout to same position on other pages
    - Delete: remove whiteout (undo last whiteout)

14. **Blackout**
    Same as whiteout but black fill.
    - Reuse whiteout tool with color="#000000"
    - Toggle: "Whiteout" / "Blackout" in toolbar or color picker

### Wave 6D — Annotation & Shape Fixes

15. **Fix shape drag preview (Bug A from §2)**
    Arrow/circle/line/strikethrough must show correct shape
    during drag, not dashed rectangle.

16. **Highlight color picker**
    Choose highlight color: yellow (default), green, blue, pink,
    orange, red.
    - Already have color picker from Wave 4B
    - Apply to highlight annotations
    - Burns with chosen color + opacity

17. **Sticky note improvements**
    - Color choice: yellow, green, blue, pink
    - Resize the note bubble
    - Drag to reposition
    - Delete button visible on hover

18. **Shapes fill option**
    Rectangle and circle: filled vs outline toggle.
    - Toolbar toggle: "Fill" checkbox when shape tool active
    - Fill color = selected color with 20% opacity
    - Outline always visible

19. **Checkbox / Cross / Circle marks**
    Quick-stamp overlays for marking documents:
    - ✓ Checkmark (green)
    - ✗ Cross (red)
    - ○ Circle (blue)
    - Toolbar section: "Marks" with 3 buttons
    - Click on page → mark appears, draggable, resizable
    - Burns as drawing annotation on save

### Wave 6E — Comprehensive QA & Performance

20. **Full QA pass — every tool tested**
    Systematic test of EVERY feature in Edit PDF:
    - Text: select, edit, move, duplicate, delete, font, size,
      color, bold, italic, underline, alignment
    - Text+: create with settings, auto-select, re-edit, delete
    - Whiteout/Blackout: drag, color, delete
    - Highlight: drag, color choices
    - Strikethrough: drag, correct rendering
    - Draw: pen, smooth, color, width
    - Shapes: rect, circle, arrow, line — correct preview during
      drag, fill option, color, width
    - Comment: add, edit text, color, reposition, delete
    - Image: add, position, resize, save
    - Stamps: all 8 types, position, resize
    - Links: add, edit, remove
    - Marks: checkbox, cross, circle
    - Find & Replace: live highlight, count, prev/next
    - Undo/Redo: all operations
    - Zoom: +/-, pinch-to-zoom
    - Save: all changes burned correctly into PDF
    - Mobile: all tools work with touch
    - Dark mode: correct rendering
    - /en /tr /ru: all strings present

21. **Performance audit**
    - Test with 20-page PDF (anon limit): <5s to open
    - Test with 100-page PDF (free limit): <10s to open
    - Save with 10+ edits: <5s
    - No memory leaks after open/edit/save cycle
    - Page navigation smooth with 100 pages

22. **Error handling audit**
    - Every API call has proper error handling
    - Network errors → friendly toast
    - Session expired → clear modal with "reopen" option
    - Oversized file → toast before upload
    - Too many pages → toast before upload
    - Server error → toast with retry option

---

## 4. Phase 6 memory — `docs/phase_6/`

Phase 1-5 docs are READ-ONLY. Create a fresh tree:

```
docs/phase_6/
  index.md          # status, current wave, current task
  decisions.md      # Phase 6 decisions
  architecture.md   # new features architecture
  bugs.md           # bugs found this phase
  log.md            # one entry per wave gate-pass
  waves/
    wave_6a.md      # text & movement
    wave_6b.md      # images & stamps
    wave_6c.md      # links & whiteout
    wave_6d.md      # annotation & shape fixes
    wave_6e.md      # QA & performance
```

---

## 5. Per-wave verification (mandatory before commit)

- `bun run build` — green, all routes, no MISSING_MESSAGE.
- Wave 6A: text move/duplicate, more fonts, bold/italic, resize fixes
- Wave 6B: add image + stamps + date stamp burn correctly into PDF
- Wave 6C: links work in downloaded PDF, whiteout improvements
- Wave 6D: shapes render correctly during drag, all annotations polished
- Wave 6E: comprehensive QA pass — zero bugs remaining

---

## 6. Constraints

- **Only Edit PDF changes.** Do not touch other tools, Annotate PDF,
  or any Phase 1-5 code outside of Edit PDF components + backend.
- **No Phase 1-5 doc edits.** All memory under `docs/phase_6/`.
- **Quality over quantity.** If a feature can't work well, skip it.
  No half-broken features shipping.
- **Lemonsqueezy stays test mode.**
- **Stop and ask** on design decisions, new dependencies.
- **bun run build after each sub-task.**
- **Do NOT commit until gate confirmed by user.**
- **Hetzner deploy commands** for any backend/Python changes.

---

## 7. Backend changes expected

Wave 6A: editor.ts saveSession — handle move (update coordinates
in add-text ops); pdf-editor.py — no change (move = redact + insert)

Wave 6B: pdf-editor.py cmd_apply — new annotation type "image"
(page.insert_image); "stamp" type (insert predefined SVG/PNG).
Need stamp assets in public/stamps/ or server/assets/stamps/.

Wave 6C: pdf-editor.py cmd_parse — extract links (page.get_links());
cmd_apply — new "link" change type (page.insert_link()).
server/routes/editor.ts /open — return links[] in response.

Wave 6D: frontend only (drag preview fix)

Wave 6E: no code changes, only testing

---

## 8. Known limitations (document, don't hide)

- **Move existing text:** font substitution on custom fonts.
  Base-14 fonts (Helvetica, Times, Courier) move perfectly.
  PDFs with embedded custom fonts → text moved with closest match.
- **Bold/Italic:** only works with base-14 + Noto fonts.
  Custom embedded fonts don't have bold/italic variants available.
- **Image quality:** inserted images render at upload resolution.
  No server-side image optimization.
- **Links:** only URL links supported (not internal page links).
- **Resize is visual-only:** changing overlay box size doesn't
  change the actual text rendering area in the PDF output.
  Text may overflow in the saved PDF differently than shown.

---

## 9. Session bootstrap — start of every Phase 6 session

1. Read this file (`CLAUDE_6.md`).
2. Read `docs/phase_6/index.md` for current state.
   If doesn't exist → first session → create `docs/phase_6/` tree.
3. Check Hetzner has PyMuPDF: `python3 -c "import pymupdf; print(pymupdf.version)"`
4. Resume at current wave's next un-done task.

---

## 10. Out of scope (do NOT build)

- Form fields (AcroForm/XFA) — PyMuPDF support too fragile
- Invite to sign (multi-user) — completely different product
- Create form — too complex
- Formula fields — impossible in PDF
- Right-side properties panel — too large scope
- Table insertion — simulated quality too low
- Any changes to non-Edit-PDF tools
- Pricing / Lemonsqueezy live mode
