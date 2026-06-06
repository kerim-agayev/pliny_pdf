# Wave 4A — Backend: PyMuPDF service (Hetzner)

Backend only. No design needed. Test via curl/httpie.

## Tasks
- [ ] PyMuPDF installed on Hetzner (`python3 -c "import pymupdf; print(pymupdf.version)"`)
- [ ] `server/services/pdf-editor.py` — `parse`, `apply` subcommands
- [ ] `server/services/editor.ts` — `execFileP` wrapper + session mgmt
- [ ] `server/routes/editor.ts` — 7 routes under `/api/editor`
- [ ] `lib/limits.ts` — `editorMaxBytes` / `editorMaxPages` / `editorSessionTtlMs`
- [ ] `server/index.ts` — `.use(editor)`
- [ ] `bun run build` green

## GATE 4A (curl on Hetzner)
- [ ] open → sessionId + pageCount + textBlocks; page PNG served
- [ ] save (edit a block) → modified PDF correct
- [ ] find-replace → correct count
- [ ] whiteout → area covered in output
- [ ] add-text → new block visible
- [ ] close → session dir removed
- [ ] limits: oversized 413, over-page-limit rejected, anon 4th use 429

## On gate pass
Append gate-pass line to `log.md`, set `index.md` to "Wave 4A complete —
awaiting design handoff for 4B", commit/push, then STOP and ask for the Claude
Design handoff link.
