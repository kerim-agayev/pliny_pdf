# Wave 4D — Polish & rename — ✅ DONE (GATE 4D passed 2026-06-07) → Phase 4 COMPLETE

Final Phase 4 wave: disambiguate the two editors and polish the cloud editor's edges.
Build green; e2e verified (Annotate local + Edit cloud independent, en/tr/ru). Also added a
one-line blog pointer from "Annotate PDF" → "Edit PDF" for real in-place text editing.

## Built
- **Rename** local annotation tool "PDF Editor" → **"Annotate PDF"** (keeps Local badge +
  `/pdf-editor`). String-only — the H1/breadcrumb/`/tools` card derive from `Tools.edit.name`,
  the schema name from `seo.title`:
  - `lib/tools.ts` (entry name), `lib/seo.ts` (`pdf-editor.title`), `components/shared/Footer.tsx`
    (link label), `content/blog/best-free-pdf-editor-2026.md` (link labels),
    `messages/{en,tr,ru}.json` (`Tools.edit.name`: EN "Annotate PDF" / TR "PDF'e Açıklama Ekle" /
    RU "Аннотировать PDF").
  - No sitemap or structured-data edits (both auto-derive). `EditorTool.tsx` logic untouched.
- **`/tools` distinction**: "Annotate PDF" (Local, `/pdf-editor`) vs "Edit PDF" (Cloud, `/edit-pdf`).
- **`deploy/LAUNCH.md`**: counts 28 → 29 (cloud now 5: pdf-to-word, word-to-pdf, ocr-pdf, summarize,
  edit-pdf); "four" → "five" server tools; gallery shot renamed + Edit PDF shot added.
- **Session-expired modal**: when the countdown hits 0 while active, an explicit
  "Session expired — re-open your PDF" modal appears (i18n `expiredTitle`/`expiredDesc`/`reopen` ×3)
  instead of letting edits silently 410. (`components/tools/EditPdf/index.tsx`.)
- **Cleanup**: removed the 4C debug logging — frontend `console.debug` (EditorCanvas text-draft/
  addText/draft-px, index handleSave, api saveEditor) and the per-annotation `[pdf-editor] burn`
  stderr lines (kept the one-line apply summary + `[editor] saveSession` ops log).

## GATE 4D (pending)
1. `bun run build` green (done locally).
2. `/en/tools`: both cards present + distinct + correct routes.
3. `/en/pdf-editor` (Annotate, local) and `/en/edit-pdf` (Edit, cloud) work independently.
4. SEO title "Annotate PDF — PlinyPDF"; session-expired modal at 0:00; en/tr/ru labels.
