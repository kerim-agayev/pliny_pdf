# Wave 4A — Backend: PyMuPDF service (Hetzner) — ✅ DONE

Backend only. No design needed. Tested via curl. **Gate passed 14/14 on
2026-06-06** (PyMuPDF 1.27.2.3 on Hetzner).

## Tasks
- [x] PyMuPDF installed on Hetzner (`python3 -c "import pymupdf; print(pymupdf.version)"` → 1.27.2.3)
- [x] `server/services/pdf-editor.py` — `parse`, `apply` subcommands
- [x] `server/services/editor.ts` — `execFileP` wrapper + session mgmt
- [x] `server/routes/editor.ts` — 7 routes under `/api/editor`
- [x] `lib/limits.ts` — `editorMaxBytes` / `editorMaxPages` / `editorSessionTtlMs`
- [x] `server/index.ts` — `.use(editor)`
- [x] `bun run build` green + `tsc --noEmit` clean

## GATE 4A (curl on Hetzner) — ALL PASSED
- [x] open → sessionId + pageCount=3 + textBlocks; page PNG served
- [x] save (edit a block) → old replaced, new present
- [x] find-replace → 3 replacements across 3 pages
- [x] whiteout → area covered in output
- [x] add-text → new block visible (`add-*` blockId)
- [x] compose (add-text + find-replace persisted on re-save)
- [x] close → page GET → 410 after session removed
- [x] limits: 16MB → 413, 25 pages → tooManyPages, anon 4th open → 429

## DONE — next
Wave 4B (frontend) BLOCKED on the Claude Design handoff. Do NOT start without it.
