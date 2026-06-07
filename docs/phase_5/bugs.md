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
