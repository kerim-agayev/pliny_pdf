# Phase 5 — Bugs

## 5A-1 — Download filename loses `.pdf` extension (FIXED)
**Symptom:** Renaming the file in the OS Save dialog dropped the `.pdf` extension;
the file saved as a generic "file" type instead of a PDF.
**Root cause:** `lib/format.ts` `streamSave` called `showSaveFilePicker({ suggestedName })`
with no `types` array, so the dialog allowed an extension-less save.
**Fix:** Pass a `types` entry (MIME + accepted extensions) derived from the
filename's extension; the browser then keeps/re-appends the extension. Added an
anchor-fallback safety net that appends `.pdf` when no extension is present.
Handles `.pdf` / `.jpg` / `.zip` / `.docx`.

## GATE 5B production testing — 5 bugs (fixed in working tree, pending deploy)

### Bug 1 (UI) — "Processing locally…" shown on cloud tools — FIXED
Root cause: the 4 migrated components used `ToolUI.processing` ("Processing
locally…") as the in-flight button label. Fix: use `ToolUI.converting`
("Converting…"); the `CloudProgress` "Converting on our server…" panel already rendered.

### Bug 2 (compress slow: 800 pg >2 min) — FIXED (needs deploy verify)
Root cause: `doc.save(garbage=4, clean=True)`. `garbage=4` joins duplicate objects
(~O(n²)) → 500pg=10s but 800pg=>2min cliff. Fix: `garbage=3`, dropped `clean=True`,
kept all `deflate*`. No rasterization (was already absent).

### Bug 4 (PDF→JPG 500 on "notebook slides") — FIXED (needs deploy verify)
Root cause: JPEG can't encode CMYK/alpha pixmaps → `pix.tobytes("jpeg")` throws.
Fix: `get_pixmap(alpha=False)` + convert `pix.n >= 4` (CMYK) → RGB before JPEG.
Added a top-level `try/except` in `main()` logging `{"error":"failed",detail,
traceback}` to stderr + exit 1; moved route file-reads inside `try` so failures
return 502 (never an uncaught 500).

### Bug 3 (merge rejected 1400 pg) — FIXED (decision: size-only)
User chose: Merge enforces total file SIZE only, no page cap (insert_pdf doesn't
render). Removed the page arg from `cmd_merge`/`mergePdfs`/the merge route.

### Bug 5 (PDF→JPG slow at 500 pg) — FIXED (decision: own lower cap)
User chose PDF→JPG-specific page caps: anon 20 / free 50 / pro 200
(`PDF_TO_JPG_MAX_PAGES` + `pdfToJpgMaxPages`). Size still uses `CLOUD_MAX_MB`.
Other cloud tools keep the general 50/300/1000 page cap.

**Verified locally:** `bun run build` green, `tsc` 0 errors, `pdf-tools.py`
py_compile OK. **Pending:** Hetzner deploy + real-file re-test of the GATE 5B
checks; do not commit until the user confirms the gate passes.

## GATE 5E production testing — 4 bugs (FIXED, deployed — commit d0a5d79)

### Bug 1/2 (CRITICAL) — add-text + Save 502 on Times blocks — FIXED
Root cause: `_BASE14["times"]` regular code was `"times"`, not a valid PyMuPDF
Base-14 name → `insert_text` raised "need font file or buffer" and `apply` crashed,
502-ing add-text and save once 5E-1 let users pick the Times font. Fix → `"tiro"`
(Times-Roman). Helvetica/Courier and the Times bold/italic codes were already correct.

### Bug 3 — Underline button had no effect — FIXED
Was throwaway local toolbar state. Added `s.underline` + per-block `blockStyles`;
U button → `setFormat({ underline })`; TextBlock applies `text-decoration`. Visual-only.

### Bug 4 — Text alignment had no effect — FIXED
Toolbar already called `setFormat({ textAlign })` but it was never applied. Now
persisted per block in `blockStyles` and applied via `text-align` in TextBlock. Visual-only.

## Deferred to Phase 6 (design decisions, NOT bugs — surfaced during GATE 5E)

### Resize — text overflows when the box is shrunk
The 5E-3 corner-handle resize is **visual-only** (no `w`/`h` in `BlockChange`; the
server ignores block width). Shrinking the box smaller than the text doesn't reflow or
clip the content — it overflows. By design for Phase 5. A real fix needs server-side
bounding-box support (text reflow / clip on save).

### Resize — minimum width/height values look swapped
Current min in `TextBlock.startResize` is width ≥ 50px, height ≥ 20px. User noted these
read backwards for the intended feel (suggested 20/50 — i.e. min width 20, min height 50).
Left as-is for Phase 5; revisit alongside the overflow fix in Phase 6.
