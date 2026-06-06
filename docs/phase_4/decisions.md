# Phase 4 — Decisions

## D4.1 — Spawn mechanism: `execFileP`, not `Bun.spawn`
CLAUDE_4.md loosely says the Python script is "called via Bun.spawn". The actual
repo pattern (`server/services/ocr.ts`, `libreoffice.ts`) is Node's
`promisify(execFile)` (`execFileP`). We follow the repo for consistency
(CLAUDE.md §3.3 "match existing style"). Args passed as an array → no shell
injection. Spawn `python3` (override via `PYTHON_BIN`).

## D4.2 — Session model: stateful working dir, replay from original
Each session = `<EDITOR_ROOT>/<sessionId>/` with `original.pdf` (pristine),
`changes.json` (cumulative, append-only), `meta.json` (createdAt, plan,
pageCount), and `page-<n>.png` renders.

Every mutation **appends to `changes.json`, then rebuilds `working.pdf` by
replaying the full change set against the pristine `original.pdf`** (Python
`apply`). This is idempotent and avoids compounding redaction/whiteout artifacts
that an in-place mutate model would accumulate across repeated saves. Geometry
for text edits is taken by **re-parsing `original.pdf`** (blockId → bbox/origin
map), so block indices stay stable regardless of prior redactions.

## D4.3 — Coordinates
PNGs render at **150 DPI** (scale = 150/72 ≈ 2.083). The engine reports text-block
bboxes in **PDF points** plus page width/height in points; the frontend scales to
PNG pixels. Keeping geometry in points server-side keeps editing math
authoritative on the box.

## D4.4 — Editor-specific limits (separate from cloud limits)
CLAUDE_4 §3 gives the editor its own table, which differs from the existing
`cloudMaxBytes` (anon 25 MB). Added `editorMaxBytes` (15/50/200 MB),
`editorMaxPages` (20/100/500), `editorSessionTtlMs` (15/30/60 min) to
`lib/limits.ts` rather than overloading the shared cloud helpers.

## D4.5 — Daily quota consumed on `/open` only
One editor session = one "use". `checkServerTool` (anon 3 / free 10 / pro
unlimited) is called only on `/open`; save/add-text/whiteout/find-replace do not
re-consume the daily quota. This matches the CLAUDE_4 daily-uses table.

## D4.6 — Python engine surface: `parse` + `apply`
Kept to two subcommands for simplicity. `parse <pdf> <session-dir>` renders all
PNGs + emits blocks JSON. `apply <session-dir>` rebuilds `working.pdf` from
`original.pdf` + `changes.json`, re-renders affected pages, and emits updated
blocks (+ last find-replace count). Full-document parse on each `apply` is the
simple, correct choice for Phase 4; per-page render-skipping is a future perf
tweak (see bugs.md).
