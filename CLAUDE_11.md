# CLAUDE_11.md — PlinyPDF Phase 11: Edit PDF Fidelity & Robustness

> Read this file first at the start of every Phase 11 session.
> Phase 1-10 docs are READ-ONLY.
> All Phase 11 memory lives under `docs/phase_11/`.

---

## 1. What this phase does

Phase 11 fixes Edit PDF's text-editing fidelity. When users edit
existing text, the output must blend seamlessly with the original
page — no white patches on colored backgrounds, no font mismatches,
no misaligned text, and clear handling of PDFs that genuinely can't
be edited.

The root problem: when editing existing text, the editor places a
fixed-white mask ("whiteout") behind the new text. On any non-white
background (gray zebra rows, images, gradients, watermarks) this
white box cuts an ugly rectangle into the page.

Reference: competitors solved this — Pi7 "reconstructs the page
background", PDFgear lets users "choose redaction colors to blend
naturally", Super Tool uses an eyedropper to "sample colors with
pixel-level accuracy", Sejda "maintains the document's original
look and feel."

No new tools. Edit PDF only. After Phase 11, Edit PDF produces
professional-quality output across diverse real-world PDFs.

---

## 2. Problem Inventory (User + Analysis)

Grouped into 4 families, each → one wave.

### Family A — Background / Whiteout (Wave 11A)
1. **Colored background mismatch** (the reported bug) — gray/colored
   row gets a white mask → ugly rectangle
2. **Gradient/patterned background** — flat-color mask cuts the gradient
3. **Text over image** — white box punches a hole in the image
4. **Table borders** — mask box erases table gridlines
5. **Text over watermark** — mask cuts the watermark

### Family B — Fonts (Wave 11B)
6. **Font mismatch** — original font not embedded → new text in wrong font
7. **Font width difference** — new text wider/narrower → alignment breaks
8. **Bold/italic loss** — original style not preserved
9. **Special characters** (AZ/TR: ə, ç, ğ, ı, ö, ş, ü; RU Cyrillic) —
   fail to render
10. **CID/subset font** — embedded subset lacks the new characters

### Family C — Color / Alignment (Wave 11C)
11. **Text color mismatch** — new text black, original gray/colored
12. **Alignment shift** — edited text moves from original position
13. **Line height** — multi-line text spacing changes
14. **Baseline shift** — text vertically misaligned

### Family D — Structural / Uneditable (Wave 11D)
15. **Multi-column layout** — column structure breaks
16. **Rotated page** — editing lands in wrong position on rotated PDF
17. **Encrypted/protected PDF** — editing fails
18. **Scanned PDF** — text is an image, not editable

---

## 3. Investigation First (before any wave)

Edit PDF's architecture must be understood before fixing. The
backend likely renders the page, lets the user edit, then composites
edits via PyMuPDF. Where the white mask is generated is the key.

Before Wave 11A, read and document:
- `components/tools/EditPdf/` — all files (frontend editor)
- `server/routes/editor.ts` — edit session, save logic
- `server/services/pdf-tools.py` (or equivalent) — how text edits
  are applied to the PDF
- How is the "whiteout"/mask drawn? Fixed white? Where in code?
- How is replacement text rendered? Which font? Which color?
- Is the original text's font/color/size extracted at all?

Document findings in `docs/phase_11/architecture.md` before coding.

---

## 4. Waves

### Wave 11A — Smart Background Sampling (Whiteout Fix)

**Goal:** The mask behind edited text matches the real page
background instead of being fixed white.

**This is the reported bug + the highest-impact fix.**

**Approach:**
1. When a text block is edited, before drawing the mask:
   - Sample the background color at the text's location
   - Sample from the rendered page pixels around the text bounds
     (e.g. median/dominant color of the margin just outside the
     glyph baseline, avoiding the glyphs themselves)
2. Use the sampled color as the mask fill instead of white
3. Edge cases:
   - **Solid color** (gray zebra row) → sample → exact match ✅
   - **Gradient/pattern** → flat color won't match perfectly;
     detect variance, fall back to Wave 11B manual color OR
     redact-the-text-only approach (cover just glyph pixels)
   - **Image/watermark under text** → high variance detected →
     warn or use the manual-color fallback (Wave 11B)

**Implementation options to evaluate:**
- **Option A — Pixel sampling (frontend):** render page to canvas,
  sample pixels around the edited text bbox, pass color to backend.
- **Option B — PyMuPDF sampling (backend):** use
  `page.get_pixmap()` then sample the pixel region behind the text
  bbox to derive the fill color server-side.
- **Option C — Glyph-only redaction:** instead of a rectangular
  mask, cover only the glyph shapes (tighter), reducing visible
  patch area. More complex.

Recommend Option B (backend sampling) for consistency with the
final rendered output. Evaluate during investigation.

**Files (likely):**
- `server/services/pdf-tools.py` — mask fill color logic
- `server/routes/editor.ts` — pass sampled color through
- `components/tools/EditPdf/` — if frontend sampling chosen

**GATE 11A:**
- Edit text on a gray zebra-row PDF → mask matches the gray,
  no white patch (use the user's account-requisites PDF)
- Edit text on a white background → still works (white mask)
- Edit text on a solid colored block → mask matches
- Gradient/image background → graceful fallback (no worse than
  today, ideally a warning or manual color)
- Desktop + mobile both work
- `bun run build` green
- Hetzner deployed (if backend changed)

---

### Wave 11B — Manual Color Fallback + Font/Character Support

**Goal:** Where auto-sampling can't match (gradient, image), let
the user pick the mask color. Also guarantee fonts and special
characters render correctly.

**Part 1 — Manual mask color picker:**
1. When editing text, add a "background color" control in the
   edit toolbar/bottom sheet
2. Default = auto-sampled color (from 11A)
3. User can override with a color picker + eyedropper
   (eyedropper samples a clicked pixel from the page)
4. Mobile: bottom sheet color picker (reuse existing pattern)

**Part 2 — Font matching:**
5. Extract the original text's font when a block is selected
   - Font family, size, weight (bold), style (italic), color
6. Pre-fill the editor with these so the replacement matches
7. If the original font isn't available, pick the closest
   system/bundled font and tell the user

**Part 3 — Special character support (AZ/TR/RU):**
8. Ensure the rendering font covers: ə, ç, ğ, ı, İ, ö, ş, ü
   (Azerbaijani/Turkish) and full Cyrillic (Russian)
9. If the chosen font lacks a glyph, fall back to a font that
   has it (e.g. Noto Sans) — never render a ▯ tofu box
10. Test with Azerbaijani text specifically (user's market)

**Files (likely):**
- `server/services/pdf-tools.py` — font selection, glyph coverage
- `components/tools/EditPdf/` — color picker, eyedropper, font
  prefill UI
- `lib/pdf/fonts.ts` — font fallback chain
- i18n EN/TR/RU for new UI strings

**GATE 11B:**
- Edit text with Azerbaijani characters (ə, ğ, ş) → renders
  correctly, no tofu boxes
- Edit text → original font/size/color pre-filled in editor
- Manual color picker + eyedropper work (desktop + mobile)
- Bold/italic preserved
- `bun run build` green
- Hetzner deployed (if backend changed)

---

### Wave 11C — Color & Alignment Fidelity

**Goal:** Edited text matches the original's color, position,
baseline, and line spacing.

**Approach:**
1. **Text color match:** extract original text color, apply to
   replacement (depends on 11B font extraction)
2. **Alignment:** preserve the original text's x/y anchor; the
   replacement starts at the same baseline origin, not a new box
3. **Baseline:** align replacement text to the original baseline,
   not the top of a bounding box
4. **Line height:** for multi-line edits, preserve original
   leading/line spacing
5. **Width handling:** when new text is wider/narrower than
   original:
   - Don't stretch the mask arbitrarily
   - Keep the anchor, let text flow naturally
   - Optionally warn if the new text overflows the original
     column width

**Files (likely):**
- `server/services/pdf-tools.py` — text placement math
  (baseline, anchor, leading)
- `components/tools/EditPdf/` — preview alignment

**GATE 11C:**
- Edit a gray-row label (e.g. "ValyutaGFFS") → new text same
  color, same baseline, no vertical/horizontal shift
- Multi-line edit → line spacing preserved
- Shorter/longer replacement → anchored correctly, no drift
- `bun run build` green
- Hetzner deployed (if backend changed)

---

### Wave 11D — Uneditable Detection + Performance + Final QA

**Goal:** Detect PDFs that can't be safely edited, warn the user
clearly, and fix the Edit PDF performance regression.

**Part 1 — Uneditable detection:**
1. **Scanned PDF:** detect pages that are a single image with no
   text layer → on open, warn "This looks like a scanned PDF.
   Text can't be edited — you can still annotate, sign, etc."
2. **Text over image:** when the selected text sits over an image,
   warn that the background can't be matched (offer manual color)
3. **Encrypted/protected:** if the PDF restricts editing, surface
   a clear message (already partly handled — verify)
4. **Rotated page:** ensure edits land correctly on rotated pages
   (test 90/180/270)
5. **Multi-column:** can't fully solve; at minimum don't corrupt
   the layout — edits stay local to the selected block

**Part 2 — Performance (Lighthouse 84 → 90+):**
6. Edit PDF page LCP is slow (ssr:false, fabric+pdfjs load).
   Options:
   - Lazy-load fabric only when editing starts
   - Defer pdfjs worker init
   - Add a static SSR placeholder (already done in 9I — verify
     it's the LCP element)
   - Code-split the editor bundle further
7. Target: Performance ≥ 90 on /edit-pdf

**Part 3 — Final QA:**
8. Test the full Edit PDF flow on diverse PDFs:
   - The account-requisites zebra PDF (11A)
   - Azerbaijani-text PDF (11B)
   - A scanned PDF (detection)
   - A rotated PDF
   - An image-heavy PDF
9. Desktop + mobile
10. Phase 11 docs complete

**Files (likely):**
- `server/services/pdf-tools.py` — scan/image detection
- `components/tools/EditPdf/` — warnings, lazy-load
- `app/[locale]/edit-pdf/page.tsx` — performance

**GATE 11D:**
- Scanned PDF → clear warning on open
- Text-over-image → manual-color warning
- Rotated PDF → edits land correctly
- Lighthouse /edit-pdf Performance ≥ 90
- All Phase 11 issues verified fixed
- Phase 11 docs complete
- Site remains launch-quality

---

## 5. Phase 11 memory — `docs/phase_11/`

Phase 1-10 docs are READ-ONLY. Create:

```
docs/phase_11/
  index.md
  decisions.md
  architecture.md   (fill during investigation, BEFORE 11A)
  bugs.md
  log.md
  waves/
    wave_11a.md
    wave_11b.md
    wave_11c.md
    wave_11d.md
```

---

## 6. Constraints

- Do NOT touch Phase 1-10 docs (read-only)
- Do NOT add new tools — Edit PDF only
- Do NOT regress the working Edit PDF features (Phase 6+8):
  add text, whiteout, highlight, sign, shapes, links, mobile UX
- All UI text in EN/TR/RU
- `bun run build` green after each sub-task
- Do NOT commit until gate confirmed by user
- Hetzner deploy when backend changes (likely 11A, 11B, 11C)
- Test with REAL diverse PDFs — the user provides samples
  (zebra-row account PDF, Azerbaijani PDF, scanned PDF)
- Investigation BEFORE coding — fill architecture.md first

---

## 7. Test PDFs needed from user

To verify gates properly, the user should provide:
1. The zebra-row / colored-background PDF (account requisites) — 11A
2. A PDF with Azerbaijani/Turkish text (ə, ğ, ş, ç) — 11B
3. A scanned/image PDF (no text layer) — 11D detection
4. A rotated PDF (optional) — 11D
5. An image-heavy PDF (text over photo) — 11A/11D

Claude Code should ask for each when starting the relevant wave.

---

## 8. Session bootstrap

1. Read this file (`CLAUDE_11.md`)
2. Read `docs/phase_11/index.md` — if missing, create the tree
3. If `docs/phase_11/architecture.md` is empty → do the
   investigation (section 3) FIRST and fill it
4. Resume at the current wave's next un-done task
5. Ask the user for the relevant test PDF when starting a wave
6. Backend changes → Hetzner deploy in that wave

---

## 9. Known good baseline (Phase 10 ended here)

- 32 tools, launch-ready
- Edit PDF: add text (auto-commit), whiteout, highlight, sign,
  shapes, links, snap guides, auto-resize, mobile takeover
- BUT: whiteout is fixed-white → the bug Phase 11 fixes
- Lighthouse: Homepage P96, /tools P97, /edit-pdf P84
  (edit-pdf perf is the regression 11D addresses)
- Backend: Hetzner PyMuPDF, deployed at Phase 10 HEAD
- Production: www.plinypdf.com (primary), apex redirects

After Phase 11: Edit PDF produces professional output across
colored backgrounds, diverse fonts, special characters, and
clearly handles uneditable PDFs.

---

## 10. Priority note

If time is limited, the priority order is:
1. **Wave 11A** (the reported bug — colored background) — MUST
2. **Wave 11B** (manual fallback + AZ/TR/RU characters) — HIGH
   (special characters matter for the user's market)
3. **Wave 11C** (alignment fidelity) — MEDIUM
4. **Wave 11D** (uneditable detection + perf) — MEDIUM

11A alone fixes the most visible, most common problem. Each
subsequent wave adds robustness. Ship and verify each wave
independently.
