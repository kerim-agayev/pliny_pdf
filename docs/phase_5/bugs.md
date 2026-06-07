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
