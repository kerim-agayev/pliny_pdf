# Phase 4 — Index (Real PDF Editor)

## Current Status
- Phase: 4
- Active wave: **Wave 4C — burn annotations into the saved PDF**
- Status: **Wave 4B COMPLETE — GATE 4B passed 2026-06-06** (text+, whiteout, edit text, find&replace, save → correct PDF, all features verified after two bug-fix rounds).
- Next step: Wave 4C — server-side burn-in of highlight/strike/underline/draw/shapes (+ comment/link return).

## Waves
- **4A — Backend** (PyMuPDF parse/render/edit via `execFileP`, Elysia routes) — ✅ COMPLETE (gate 14/14)
- **4B — Frontend editor UI** — ✅ COMPLETE (GATE 4B passed 2026-06-06)
- 4C — Annotation features burned into PDF (highlight/strike/underline/draw/shapes; re-add comment/link) — pending
- 4D — Polish & rename (`/pdf-editor` → "Annotate PDF", new `/edit-pdf`) — pending

## Deferred to later (noted at GATE 4B)
- New text block: no font/color/size picker at creation (uses toolbar defaults); not re-selectable/editable in the same session (baked into the page PNG on add).
- Annotations are client overlays only until Wave 4C.

## Key Files (Wave 4A)
- `server/services/pdf-editor.py` — PyMuPDF CLI engine (`parse`, `apply`)
- `server/services/editor.ts` — `execFileP` wrapper + session management
- `server/routes/editor.ts` — Elysia routes (`/api/editor/*`)
- `lib/limits.ts` — editor-specific size/page/session limits (appended)
- `server/index.ts` — route wired with `.use(editor)`

## Key Files (Wave 4B)
- `app/[locale]/edit-pdf/page.tsx` — new cloud editor page (full-screen, no ToolShell)
- `app/[locale]/pdf-editor/page.tsx` — relocated annotation editor
- `components/tools/EditPdf/` — index + EditorCanvas/Toolbar/StatusBar/PageThumbnails/TextBlock/Whiteout/Highlight/Drawing/Comment/FindReplaceModal/ContextMenu/SessionWarning
- `lib/stores/editorStore.ts` — Zustand store; `lib/api/editor.ts` — typed `/api/editor/*` client
- i18n: `messages/{en,tr,ru}.json` → `ToolPages.editPdf`

## Reminders
- Phase 1/2/3 docs are READ-ONLY. All Phase 4 memory lives here.
- 4B Save persists text/add-text/whiteout/find-replace only; annotations burn in at 4C.
- Editor limits are real again (anon 15 MB / 20 pages); the GATE-4B temp raise was reverted. Hetzner CORS localhost allow-origin to be removed post-deploy.
