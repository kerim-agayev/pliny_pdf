# Wave 11C — Color & Alignment Fidelity

Implemented, GATE pending. See CLAUDE_11 §4 Wave 11C.

## Findings (investigation)
- **Color (Issue 11)** — BROKEN: extracted but dropped on save (black fallback).
- **Alignment (12)** — already correct: in-place uses `Point(g["origin"])`.
- **Baseline (14)** — already correct: insert_text point = baseline = captured origin.
- **Line height (13)** — N/A: blocks are per source line; typed `\n` uses default leading.
- **Width (15)** — acceptable: anchored, flows right, no clip. Overflow warning deferred.

## Fix (backend-only, `server/services/pdf-editor.py`)
- `_build_geometry_map`: store packed `color` int per block.
- `_draw_edit`: `color = change.get("color") or _int_color_to_hex(g.get("color", 0))`
  for both text and underline. Explicit toolbar override still wins.
- `cmd_selftest`: color-preservation guard added.

## Verify
- `python server/services/pdf-editor.py selftest` green; `bun run build` green.
- Manual on zebra/requisites PDF: edit gray label w/o color picker → stays gray,
  same baseline/x; black stays black; explicit pick wins; short/long anchored.
