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
