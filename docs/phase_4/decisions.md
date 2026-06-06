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

## D4.7 — Route swap pulled forward (Wave 4B)
The annotation tool ("PDF Editor", `EditorTool`, local) already lived at `/edit-pdf`
— CLAUDE_4.md wrongly assumed it was at `/pdf-editor`. Per user decision, relocated
the annotation tool to `/pdf-editor` (route folder + `tools.ts` slug + `seo`/`structured-data`
keys + Footer + blog links; component logic untouched) and built the new cloud editor
at `/edit-pdf`. No redirect — `/edit-pdf` is repurposed on a 2-day-old site. This pulls
Wave 4D's rename-move forward so the flagship editor lives at its final URL now.

## D4.8 — New editor uses server-rendered PNGs, not pdfjs
The cloud editor renders pages via the Wave 4A `GET /page` PNG endpoint (`<img>`) and
overlays absolutely-positioned text/annotation divs — no pdfjs in the new editor.
Overlay scale = `zoom/100` (page bboxes are PDF points; the PNG is displayed at
`pt × zoom/100` px, so 1pt → (zoom/100)px). After server-side mutations (whiteout /
add-text / find-replace) the page PNG is re-rendered server-side; the client bumps a
`renderVersion` to cache-bust the `<img>`.

## D4.9 — Live text-edit masking
Editing a text block can't un-draw the PNG underneath, so an edited/being-edited block
masks its bbox with white and renders the new text on top (a live approximation of the
server's redaction+insert). Pristine blocks stay transparent so the PNG text shows.

## D4.10 — Session expiry computed client-side
`sessionExpiresAt` = open-time + `editorSessionTtlMs(plan)` (the same helper the backend
uses), so no change to the deployed Wave 4A response. A warning toast shows at ≤5 min.

## D4.11 — 4B vs 4C annotation scope
All 17 UI states + every toolbar tool are built. The 4A-backed ops (open, render, text
edit/save, add-text, whiteout, find-replace, close, undo/redo, zoom) are fully wired.
Annotation tools (highlight/strike/underline/draw/shapes/comment/link) are client
overlays held in `store.annotations`; **burning them into the saved PDF is Wave 4C** — so
4B Save persists text/add-text/whiteout/find-replace only.

## D4.12 — Mobile via responsive collapse (not the bespoke mobile artboard)
The desktop editor frame collapses responsively at ≤700px (sidebar hidden, toolbars
scroll horizontally) rather than reimplementing the design's separate `EditMobile`
layout (bottom bar + Pages FAB). Captures the mobile essence; the pixel-exact mobile
artboard is a possible follow-up.

## D4.6 — Python engine surface: `parse` + `apply`
Kept to two subcommands for simplicity. `parse <pdf> <session-dir>` renders all
PNGs + emits blocks JSON. `apply <session-dir>` rebuilds `working.pdf` from
`original.pdf` + `changes.json`, re-renders affected pages, and emits updated
blocks (+ last find-replace count). Full-document parse on each `apply` is the
simple, correct choice for Phase 4; per-page render-skipping is a future perf
tweak (see bugs.md).

## D4.13 — GATE 4B bug-fix round (events, password, clipboard, find, mobile)
Nine browser-test bugs fixed without touching Phase 1-3 code:
- **Root cause of text+/whiteout/annotation failures**: `TextBlock` (and overlay)
  `onMouseDown` always `stopPropagation()`'d, so any non-select tool that started
  over existing text (most of the page) never reached the canvas. Fix: overlays are
  `pointerEvents:none` unless the select tool is active (`interactive` prop) — empty
  areas always fall through to the canvas, so text drafts/whiteout/highlight drags
  start anywhere.
- **Drag reliability**: drag/draw now use window-level `mousemove`/`mouseup` (attached
  on mousedown, removed on up), so releasing outside the page still commits.
- **Password PDFs**: detected client-side via `isPdfEncrypted` and unlocked in-browser
  with the shared `PasswordModal` (decrypts, re-`openEditor`s the decrypted file) — no
  backend password param, consistent with every other tool. Added a defense-in-depth
  backend guard (`doc.needs_pass` → `{error:"passwordRequired"}` → 401) for files that
  somehow bypass the client check. **Note:** the backend guard needs `pdf-editor.py`
  redeployed to Hetzner; the client-side path works without it.
- **Large-file error**: hardened `proceed()` to map any 413 (and 401 password) to a
  friendly toast instead of the generic "corrupted" modal.
- **Context menu**: cut/copy/paste wired to `navigator.clipboard`; paste adds a server
  text block at the click point; Select-All uses a new `multiSelected` store field.
- **Find & Replace**: live block-level match highlight (orange) painted on the page
  (modal is now a non-dimming floating panel so highlights show), "{i} of {n}" count,
  prev/next nav that jumps pages. Highlight granularity is whole-block (approximate);
  server still does exact replacement.
- **Session timer**: brighter, force-ticks on open, one-shot 5-min warning toast.
- **Mobile (≤700px)**: thumbnails become a toggled drawer (Pages button), toolbar rows
  scroll horizontally, canvas gutter shrinks, cloud chip hidden, larger tap targets.

## D4.14 — GATE 4B bug-fix round 2
- **Text+ root cause (real one)**: the draft `<input>` lives inside the canvas, so
  clicking into it to type bubbled `mousedown` back to the canvas handler, which
  reset the draft to a fresh empty box at the new point — felt completely dead.
  Fix: `stopPropagation()` on the draft box; solid white box, zIndex 30, Enter-to-
  commit. Added dev-only `console.debug` traces (click → addText → ok/failed) for
  future diagnosis.
- **File-size pre-check**: reverted the GATE-4B-TEMP anon-limit raise. It was the
  actual cause of the slow-upload-then-fail — the client allowed 50 MB while Hetzner
  enforced 15 MB, so 15–50 MB files uploaded fully then 413'd. Real limits restored
  (anon 15/20/15) so the dropzone rejects oversize files instantly; any 413 still maps
  to a friendly toast as a backstop.
- **Annotation tools**: removed Link and Comment from the toolbar (Comment returns in
  Wave 4C when it can be saved). Arrow now stores true start→end (`x2,y2`) and draws a
  real two-barb arrowhead. Strikethrough/underline are a single 2px line, not a fill.
  Added a shared color (6 swatches) + stroke-width (3) picker inline in toolbar Row 1,
  shown for Draw/Shapes/Highlight/Strike, driving `strokeColor`/`strokeWidth`.
- **Text-block resize**: corner handles are now draggable (window listeners), resizing
  the overlay box (min 50×20 px, client-only); the contentEditable wraps to the new
  width. Server still redacts the original bbox on save.
- **Context menu**: removed Paste (clipboard non-text is messy). Kept Cut/Copy/Delete/
  Select-All/Edit-Text; Edit-Text enters inline edit mode.
- **Find & Replace**: shrunk to a 320px panel pinned top-right, non-dimming, so the
  on-page orange match highlights stay visible.

## D4.15 — Deferred at GATE 4B (documented, not hidden)
- **New text block creation UX**: added text uses the toolbar's current font/size/color
  defaults (the format row is disabled until an existing block is selected). A dedicated
  on-create picker is deferred.
- **New text not re-editable in-session**: add-text is baked into the page PNG on commit
  (server redact+insert), so it isn't re-selectable as a `TextBlock` in the same session.
  Re-opening the saved PDF exposes it as a normal editable block. Deferred.
- **Annotations**: highlight/strike/underline/draw/shapes stay client-only overlays until
  Wave 4C burns them into the output PDF. Comment + Link were removed from the toolbar and
  return in 4C when they can persist.
