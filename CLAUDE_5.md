# CLAUDE_5.md — PlinyPDF Phase 5: Performance, Cloud Migration & Polish

> Read this file first at the start of every Phase 5 session.
> Phase 1 docs (`docs/index.md`, `docs/decisions.md`, etc.) are READ-ONLY.
> Phase 2 docs (`docs/phase_2/*`) are READ-ONLY.
> Phase 3 docs (`docs/phase_3/*`) are READ-ONLY.
> Phase 4 docs (`docs/phase_4/*`) are READ-ONLY.
> All Phase 5 memory lives under `docs/phase_5/`.

---

## 1. What this phase is

Phases 1-4 shipped 29 tools (24 local + 5 cloud), a real PDF editor,
and production deploy. Real-world testing with a 26MB / 800-page PDF
exposed performance problems: many local tools take 30-120 seconds on
large files. Some tools are unusable at this scale.

Phase 5 fixes this with three strategies:
1. **Cloud migration** — move 4 heavy tools to PyMuPDF on Hetzner
2. **Local optimization** — lazy loading, Web Workers, preview limits
3. **Limit enforcement** — realistic per-plan limits so no tool exceeds
   ~30 seconds for any user tier

Additionally: mobile touch support for both editors, Edit PDF
improvements, a global download filename bug fix, and a full limit
revision across all 29 tools.

---

## 2. Performance test results (baseline)

Test file: 26MB / 800 pages PDF. All times are from user testing.

### Good (no changes needed)
| Tool | Time | Status |
|------|------|--------|
| Password Protect | Fast | ✅ Local, keep |
| Remove Password | Fast | ✅ Local, keep |
| Add Watermark | Fast | ✅ Local, keep |
| Remove Metadata | Fast | ✅ Local, keep |
| Edit Metadata | Fast | ✅ Local, keep |
| Flatten PDF | Fast | ✅ Local, keep |
| Text to PDF | Fast | ✅ Local, keep |
| Markdown to PDF | Fast | ✅ Local, keep |
| Split PDF | Fast | ✅ Local, keep |
| Annotate PDF | 7s | ✅ Local, keep |

### Slow (optimize locally)
| Tool | Time | Root cause |
|------|------|------------|
| Sign PDF | 45s | Renders all pages for preview |
| Rotate PDF | 30s | Processes all pages |
| Crop PDF | 45s | Processes all pages |
| Redact Content | 45s | Processes all pages |
| Delete Pages | 60-120s | Thumbnail loading for all pages |
| Organize Pages | 80s | Thumbnail loading for all pages |
| Add Page Numbers | 85s | Processes all pages |
| Header/Footer | Hung | Live preview renders all 800 pages |
| Extract Pages | Hung | Live preview loads all pages |

### Move to cloud
| Tool | Time | Why cloud |
|------|------|-----------|
| Compress PDF | Very slow | Canvas rasterization per page |
| Grayscale PDF | Very slow | Canvas rasterization + inflation |
| PDF→JPG | 35s (108pg) | Canvas rasterization, 800pg impossible |
| Merge PDF | Hung | Large file processing in browser |

### Already cloud (don't touch in Phase 5)
| Tool | Status |
|------|--------|
| Edit PDF | ✅ Cloud, Phase 4 complete |
| PDF to Word | ✅ Cloud, Gotenberg |
| Word to PDF | ✅ Cloud, Gotenberg |
| OCR PDF | ✅ Cloud, ocrmypdf |
| AI Summary | ✅ Cloud, OpenAI |

---

## 3. Limit tables (user-approved)

### Local tools (20 tools)

| | Anonim | Free | Pro |
|---|---|---|---|
| File size | 10 MB | 25 MB | 50 MB |
| Pages | 50 | 150 | 300 |
| Expected time | <5s | <10s | <15s |

Applies to: Password Protect/Remove, Watermark, Metadata tools,
Flatten, Text/Markdown to PDF, Split, Annotate PDF, Sign, Rotate,
Crop, Redact, Delete Pages, Organize, Page Numbers, Header/Footer,
Extract Pages, JPG to PDF.

### Cloud tools (4 migrated + existing 4)

| | Anonim | Free | Pro |
|---|---|---|---|
| File size | 25 MB | 100 MB | 250 MB |
| Pages | 50 | 300 | 1000 |
| Daily uses | 3/day | 15/day | Unlimited |
| Expected time | <10s | <20s | <30s |

Applies to: Compress, Grayscale, PDF→JPG, Merge, PDF↔Word, OCR, AI.

### Edit PDF (unchanged from Phase 4)

| | Anonim | Free | Pro |
|---|---|---|---|
| File size | 15 MB | 50 MB | 200 MB |
| Pages | 20 | 100 | 500 |
| Daily uses | 3/day | 10/day | Unlimited |
| Timeout | 15 min | 30 min | 60 min |

---

## 4. Waves

### Wave 5A — Global fixes + limit enforcement

Foundational work that affects all tools. Do this first.

**5A-1: Download filename bug fix (global)**

When user renames the file in the Save dialog, the `.pdf` extension
is lost and the file type becomes "file" instead of PDF.

Fix in `lib/format.ts` `downloadBlob()`:
- Always append `.pdf` extension if not already present
- Set the correct MIME type: `application/pdf`
- When using File System Access API (`showSaveFilePicker`): set
  `types: [{ description: "PDF", accept: { "application/pdf": [".pdf"] } }]`
- When using anchor download: ensure `download` attribute always
  ends with `.pdf`
- Also handle `.jpg`, `.zip`, `.docx` for other tools

**5A-2: New local limits**

Update `lib/limits.ts`:
- `LOCAL_MAX_MB` = { anon: 10, free: 25, pro: 50 } (was: 100 flat)
- `LOCAL_MAX_PAGES` = { anon: 50, free: 150, pro: 300 } (new)
- Keep `cloudMaxBytes` for existing cloud tools
- Add `localMaxBytes(plan)`, `localMaxPages(plan)` functions

Update `FileDropzone` to use plan-aware local limits (badge + validation).

Add page count check after file loads (before processing starts)
in each local tool. Use `readPageCount()` from `lib/pdf/common.ts`.
If over limit → toast error with friendly message:
"This PDF has X pages. Your plan allows up to Y pages."

**5A-3: New cloud limits for migrated tools**

Update `lib/limits.ts`:
- `CLOUD_MAX_MB` = { anon: 25, free: 100, pro: 250 } (was: 25/50/200)
- `CLOUD_MAX_PAGES` = { anon: 50, free: 300, pro: 1000 } (new for cloud)
- Add `cloudMaxPages(plan)` function
- Update daily rate limits: anon 3, free 15, pro unlimited

Backend routes for migrated tools enforce these server-side.

**5A-4: Limit table for Claude Code to present to user**

After implementing all limits, generate a complete table of ALL 29
tools with their exact limits per tier and present to the user for
final confirmation.

GATE 5A: bun run build green. All tools show correct badges
(10 MB local, 25 MB cloud for anon). Oversized file rejected
before processing. Download filename bug fixed (rename in Save
dialog keeps .pdf extension).

---

### Wave 5B — Cloud migration (4 tools)

Move Compress, Grayscale, PDF→JPG, and Merge from local (browser)
to cloud (Hetzner PyMuPDF). Same pattern as Edit PDF's backend.

**5B-1: PyMuPDF backend for migrated tools**

New file: `server/services/pdf-tools.py` — PyMuPDF CLI script:
- `compress <input> <output> <quality>` — compress using PyMuPDF
  image optimization (not canvas rasterization)
- `grayscale <input> <output>` — convert to grayscale using
  PyMuPDF color space conversion
- `pdf-to-jpg <input> <output-dir> <dpi>` — render each page to
  JPG using PyMuPDF `page.get_pixmap()` (much faster than canvas)
- `merge <output> <input1> <input2> ...` — merge PDFs using
  PyMuPDF `doc.insert_pdf()`

**5B-2: Backend routes**

New routes in `server/routes/tools.ts`:
- `POST /api/tools/compress` — multipart, returns compressed PDF
- `POST /api/tools/grayscale` — multipart, returns grayscale PDF
- `POST /api/tools/pdf-to-jpg` — multipart, returns ZIP of JPGs
- `POST /api/tools/merge` — multipart (multiple files), returns
  merged PDF

Each route: auth-optional, plan-aware limits (CLOUD_MAX_MB,
CLOUD_MAX_PAGES), rate limiting (checkServerTool), proper error
codes (413, 429, 502).

**5B-3: Frontend — switch tools to cloud mode**

For each migrated tool:
- `lib/tools.ts`: change `mode: "local"` → `mode: "cloud"`
- Update the component to upload file to new API endpoint instead
  of processing locally
- Show Cloud badge instead of Local badge
- Use cloud limits in FileDropzone (25/100/250 MB instead of
  10/25/50 MB)
- Keep the same UI (preset selector for Compress, etc.)
- Progress: show "Processing on server..." with spinner
- Error handling: map 413/429/502 to friendly toasts

**Compress PDF specifics:**
- Remove the 3 presets (Maximum/Balanced/High Quality) — user
  feedback said they're unnecessary
- Single "Compress" button, server picks optimal settings
- PyMuPDF compression is genuinely different quality levels
  (not just DPI/quality like canvas approach)

**Grayscale PDF specifics:**
- Remove the Wave 3C caps (GRAYSCALE_MAX_MB/PAGES) — cloud
  handles large files
- Use cloud limits instead

**PDF→JPG specifics:**
- Server returns ZIP of JPG files
- Much faster than canvas rendering

**Merge PDF specifics:**
- Multi-file upload → server merges → returns single PDF
- PyMuPDF `insert_pdf` is extremely fast even for large files

GATE 5B: Each migrated tool works via cloud. Compress a 50MB PDF
(free tier) → fast result (<20s). Grayscale 200-page PDF → no
inflation. PDF→JPG 200 pages → ZIP download. Merge 3 large PDFs
→ fast merge. Old local code paths removed.

---

### Wave 5C — Local tool optimizations

Fix the slow local tools without moving them to cloud.

**5C-1: Header/Footer — single page preview**

Current: renders all 800 pages in live preview → hangs.

Fix: Live preview shows ONLY page 1 (or user-selected page).
"Apply to all pages" happens on download, not preview.
- Render only 1 page in preview
- "Preview page: [1] [2] [3] ... [last]" selector
- On download: apply header/footer to all pages (still fast
  because pdf-lib just adds text, no rendering)

**5C-2: Extract Pages — remove live preview**

Current: loads all page thumbnails → hangs.

Fix: Remove thumbnail preview entirely. Replace with:
- Text input: "Enter page numbers (e.g. 1, 3, 5-10)"
- "Extract" button
- No preview needed — user knows which pages they want

**5C-3: Sign PDF — render only signature page**

Current: renders all pages for signature placement.

Fix: Don't render all pages. Instead:
- Page selector dropdown: "Place signature on page: [1 ▼]"
- Render only the selected page for signature placement
- On download: embed signature on that page only

**5C-4: Thumbnail lazy loading (Delete Pages, Organize Pages)**

Current: renders ALL page thumbnails before showing UI.

Fix: Lazy load thumbnails:
- Show page numbers immediately (placeholder boxes)
- Render thumbnails on-demand as user scrolls (IntersectionObserver)
- Load 10 pages at a time (batch rendering)
- Use lower DPI for thumbnails (72 DPI instead of 150)

**5C-5: Web Worker improvements (Rotate, Crop, Redact, Page Numbers)**

These tools process every page sequentially on the main thread.

Fix: Move pdf-lib operations to Web Worker (reuse the Wave 3G
worker infrastructure):
- Rotate: worker rotates all pages → returns result
- Crop: worker applies crop to all pages → returns result
- Redact: worker processes redactions → returns result
- Page numbers: worker adds numbers to all pages → returns result
- Real progress bar: "Processing page X of Y..."
- UI stays responsive during processing

**5C-6: JPG to PDF — limit check**

Works fine with 10 images but unknown with hundreds.

Fix: Add limit — max 50 images (anon), 100 (free), 200 (pro).
Show count in dropzone: "0 / 50 images"

GATE 5C: Header/Footer shows single page preview, processes
instantly. Extract Pages has simple input, no hanging. Sign PDF
renders one page. Delete/Organize load thumbnails lazily. Rotate
a 300-page PDF → <15s, UI responsive, progress bar shows.

---

### Wave 5D — Mobile touch support (both editors)

Add touch event support to Annotate PDF and Edit PDF.

**5D-1: Shared touch event utilities**

Create `lib/touch.ts`:
- `useTouchDraw(canvasRef)` hook — converts touch events to the
  same coordinate system as mouse events
- Handles: `touchstart` → `mousedown`, `touchmove` → `mousemove`,
  `touchend` → `mouseup`
- Prevents default scroll/zoom during drawing
- Pinch-to-zoom support (two-finger gesture → zoom state)
- Single touch = draw/select, two fingers = scroll/zoom

**5D-2: Annotate PDF touch support**

In `EditorTool.tsx` (the fabric.js annotation tool):
- Add touch event listeners alongside mouse events
- fabric.js has some touch support built-in — verify and enhance
- Test: highlight, draw, shapes, text on mobile
- Test: scroll and zoom with two fingers

**5D-3: Edit PDF touch support**

In `components/tools/EditPdf/`:
- `EditorCanvas.tsx`: add touch handlers for text selection,
  whiteout, highlight, draw, shapes, comment
- `TextBlock.tsx`: touch to select, double-tap to edit
- `EditorToolbar.tsx`: already responsive (Wave 4B), verify
  touch targets ≥44px
- Test all tools with touch on 375px viewport

GATE 5D: On mobile (or DevTools touch simulation):
Annotate PDF — draw, highlight, add text with touch.
Edit PDF — select text, whiteout, draw with touch.
Pinch to zoom in both editors.

---

### Wave 5E — Edit PDF improvements

Improvements deferred from Phase 4.

**5E-1: New text block — font/color/size on creation**

Currently Text+ creates blocks with default Helvetica 12px black.

Fix: When Text+ tool is active, toolbar shows font/size/color
options. New block inherits these settings.

**5E-2: New text block — selectable after adding**

Currently added text blocks can't be selected/edited in same session.

Fix: After addText API returns, add the block to the local
`pages[].textBlocks[]` array with the returned blockId. The block
becomes tıklanabilir like any other block.

**5E-3: Text block resize polish**

Corner handles exist but may be rough. Polish:
- Smooth drag resize (no jitter)
- Maintain aspect ratio with Shift held
- Minimum size enforced (50×20px)
- Visual feedback during resize (dashed outline)

GATE 5E: Text+ with custom font/color → Save → correct in PDF.
Added text block selectable and editable in same session.
Resize handles smooth with Shift aspect-ratio lock.

---

## 5. Phase 5 memory — `docs/phase_5/`

Phase 1/2/3/4 docs are READ-ONLY. Create a fresh tree:

```
docs/phase_5/
  index.md          # status, current wave, current task
  decisions.md      # Phase 5 decisions
  architecture.md   # cloud migration details, limit system
  bugs.md           # bugs found this phase
  log.md            # one entry per wave gate-pass
  waves/
    wave_5a.md      # global fixes + limits
    wave_5b.md      # cloud migration
    wave_5c.md      # local optimizations
    wave_5d.md      # mobile touch
    wave_5e.md      # edit pdf improvements
```

---

## 6. Per-wave verification (mandatory before commit)

- `bun run build` — green, all routes, no MISSING_MESSAGE.
- Wave 5A: limits enforced, download bug fixed, badge shows correct limit.
- Wave 5B: 4 migrated tools work via cloud, fast, old local code removed.
- Wave 5C: slow local tools optimized (header/footer, extract, sign,
  thumbnails, web workers).
- Wave 5D: both editors work with touch on mobile.
- Wave 5E: Edit PDF text creation + selection + resize improved.

---

## 7. Constraints

- **Do NOT touch existing cloud tools** (Edit PDF, PDF↔Word, OCR, AI).
  They are complete from Phase 4.
- **Do NOT modify Phase 1/2/3/4 docs.** All memory under `docs/phase_5/`.
- **Lemonsqueezy stays in test mode.**
- **Compress presets:** Remove the 3 presets (user feedback: unnecessary).
  Single compress button, server picks optimal settings.
- **Stop and ask** on any design decisions, new dependencies.
- **bun run build after each sub-task.**

---

## 8. Known considerations

- **Cloud migration cost:** 4 more tools hitting Hetzner = more CPU.
  Monitor with Sentry + PostHog after deploy. If needed, add
  concurrency limits (max 5 simultaneous compress jobs etc.)
- **Local→Cloud transition:** Users who liked privacy-first local
  processing will see 4 tools move to cloud. The Cloud badge makes
  this visible. Privacy page needs updating to reflect 9 cloud tools.
- **Rate limiting:** Cloud tools share the same Upstash rate limiter.
  With 9 cloud tools (was 5), check the limits don't conflict.
  Each tool should have its own rate limit key prefix.

---

## 9. Session bootstrap — what to do at the start of every Phase 5 session

1. Read this file (`CLAUDE_5.md`).
2. Read `docs/phase_5/index.md` to learn current state. If it doesn't
   exist yet, this is the first Phase 5 session — create the
   `docs/phase_5/` tree and stub all files plus `waves/`.
3. For Wave 5B (cloud migration): check Hetzner has PyMuPDF
   (`python3 -c "import pymupdf; print(pymupdf.version)"`).
4. Resume at the current wave's next un-done task.

---

## 10. Out of scope (do NOT touch in Phase 5)

- Image editing in PDF (add/move/delete images) — Phase 6
- Form filling in PDF — Phase 6
- Edit PDF session management changes — working fine
- Pricing page / Lemonsqueezy live mode — launch day decision
- ProductHunt / HN / Reddit launch — separate task
- Any Phase 1/2/3/4 doc edits
