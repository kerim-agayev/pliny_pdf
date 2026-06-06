# Phase 4 — Index (Real PDF Editor)

## Current Status
- Phase: 4
- Active wave: **Wave 4A COMPLETE — awaiting design handoff for Wave 4B**
- Status: Gate 4A passed 14/14 on Hetzner (2026-06-06)
- Next step: provide the Claude Design handoff link → fetch to `.design-handoff/edit-pdf/` → build Wave 4B frontend.

## Waves
- **4A — Backend** (PyMuPDF parse/render/edit via `execFileP`, Elysia routes) — ✅ COMPLETE (gate 14/14)
- 4B — Frontend editor UI — BLOCKED on Claude Design handoff (`.design-handoff/edit-pdf/`)
- 4C — Annotation features in new editor — pending
- 4D — Polish & rename (`/pdf-editor` → "Annotate PDF", new `/edit-pdf`) — pending

## Key Files (Wave 4A)
- `server/services/pdf-editor.py` — PyMuPDF CLI engine (`parse`, `apply`)
- `server/services/editor.ts` — `execFileP` wrapper + session management
- `server/routes/editor.ts` — Elysia routes (`/api/editor/*`)
- `lib/limits.ts` — editor-specific size/page/session limits (appended)
- `server/index.ts` — route wired with `.use(editor)`

## Reminders
- Phase 1/2/3 docs are READ-ONLY. All Phase 4 memory lives here.
- Wave 4B must NOT start without the design handoff.
