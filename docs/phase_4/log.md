# Phase 4 — Log

## [2026-06-06] Wave 4A started
Created `docs/phase_4/` tree. Building PyMuPDF engine (`pdf-editor.py`),
`execFileP` service wrapper (`editor.ts`), Elysia routes (`editor.ts`), editor
limits, and wiring into `server/index.ts`. Gate 4A pending PyMuPDF install
verification on Hetzner.

## [2026-06-06] Wave 4A GATE PASSED ✅
PyMuPDF 1.27.2.3 confirmed on Hetzner. Deployed (git pull + bun install +
restart) and ran the Gate 4A suite against the live backend — **14/14 checks
passed**:
- Parse + render: sessionId, pageCount=3, textBlocks, page-0 PNG ✅
- Save (edit first block): old text replaced, new text present ✅
- Find & replace FINDME→REPLACED: 3 replacements across 3 pages ✅
- Whiteout: region covered ✅
- Add-text: `add-*` blockId returned ✅
- Compose (add-text + find-replace persisted on re-save) ✅
- Close: page GET → 410 after session deleted ✅
- Limits: 16 MB → 413, 25 pages → tooManyPages, anon 4th open → 429 ✅

Wave 4A complete. Wave 4B (frontend) BLOCKED on the Claude Design handoff.

## [2026-06-06] Wave 4B built — awaiting GATE 4B
Fetched the Claude Design handoff (22 screens → `.design-handoff/edit-pdf/`).
Resolved the route collision (annotation tool was already at `/edit-pdf`, not
`/pdf-editor`): relocated annotation → `/pdf-editor`, built the new cloud editor at
`/edit-pdf`. Built the editor: `lib/stores/editorStore.ts` (Zustand), `lib/api/editor.ts`
(typed client for the 7 routes), 13 `components/tools/EditPdf/*` components matching the
handoff's 17 states, 13 new editor icons, editor CSS, 3 PostHog events, i18n `editPdf`
namespace in en/tr/ru. `bunx tsc --noEmit` clean; `bun run build` green (both new routes
generated). Annotation export deferred to 4C. Awaiting user GATE 4B browser test.

## [2026-06-06] Wave 4B — Real PDF editor frontend — GATE 4B PASSED
New cloud "Edit PDF" tool at /edit-pdf (annotation editor relocated to /pdf-editor).
Zustand store + typed /api/editor client + EditPdf component set (canvas, toolbar,
thumbnails, status bar, text blocks, whiteout/highlight/draw/find-replace/context menu).
Wired ops: open, page render, edit text, add-text, whiteout, find & replace, save,
undo/redo, zoom. Two browser-test bug-fix rounds (see decisions D4.13/D4.14); the
critical Text+ fix was a focus-race blur clearing the draft box (ref-focus + ready guard).
Temp anon-limit raise reverted to real values (anon 15 MB / 20 pages).
Annotations remain client overlays — burned into the PDF in Wave 4C.

## [2026-06-07] Wave 4C — Burn annotations into saved PDF — GATE 4C PASSED
Highlight (translucent fill), strikethrough (mid-line), freehand (polyline), shapes
(rect/circle/line + computed arrowhead), and comment (interactive sticky note) now burn
into the downloaded PDF server-side via PyMuPDF. Comment returned to the toolbar; Link
removed permanently; underline skipped. Save sends an annotations[] payload; saveSession
is idempotent (drops prior edit+annotation changes, re-adds current set). First gate
failed because only pdf-editor.py was redeployed (Bun route/service silently dropped the
unknown annotations field) — fixed by deploying all three backend files.
