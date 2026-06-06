# Phase 4 — Index (Real PDF Editor)

## Current Status
- Phase: 4 — **COMPLETE** 🎉 (all waves 4A–4D shipped; GATE 4D passed 2026-06-07)
- Active wave: none. Phase 4 delivered the real cloud PDF editor ("Edit PDF") + renamed the local annotator ("Annotate PDF").
- Next step: Phase 5 backlog (image editing, form filling — see CLAUDE_4 §10 out-of-scope).

## Waves
- **4A — Backend** (PyMuPDF parse/render/edit via `execFileP`, Elysia routes) — ✅ COMPLETE (gate 14/14)
- **4B — Frontend editor UI** — ✅ COMPLETE (GATE 4B passed 2026-06-06)
- **4C — Annotations burned into PDF** (highlight=translucent fill, strike=line, draw=polyline, shapes incl. arrow, comment=sticky note; Link removed permanently, underline skipped) — ✅ COMPLETE (GATE 4C passed 2026-06-07)
- **4D — Polish & rename** (local tool "PDF Editor" → "Annotate PDF" at `/pdf-editor`; cloud "Edit PDF" at `/edit-pdf`; counts 28 → 29; session-expired modal; debug-log cleanup) — ✅ COMPLETE (GATE 4D passed 2026-06-07)

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
