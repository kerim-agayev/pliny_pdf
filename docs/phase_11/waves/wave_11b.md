# Wave 11B — Manual Color Fallback + Font/Character Support

**DONE ✅ — GATE 11B passed 2026-06-24.** (8 bug-fix rounds after first ship; see below.)

## What shipped

**Part A — Manual background color + eyedropper**
- `BlockChange.bgColor?` added (`lib/api/editor.ts`); persists through `changeList()`
  → save, no `index.tsx` change needed.
- Store: `bgColor` formatting state + `eyedropper` flag + `setEyedropper`
  (`lib/stores/editorStore.ts`); pre-filled in `selectBlock`, mapped in `setFormat`.
- `TextBlock` live mask honors `change?.bgColor ?? block.bgColor ?? "#fff"`.
- Backend `_apply_edit`: `change["bgColor"]` wins as redact fill, else 11A
  auto-sample, else white (`server/services/pdf-editor.py`).
- Desktop UI: "Background" swatch + eyedropper button in EditorToolbar Row 2.
- Mobile UI: Background swatches + eyedropper in the text bottom sheet
  (eyedropper closes the sheet so the page is tappable).
- Eyedropper = **full canvas**: `lib/editor/eyedropper.ts` fetches the page PNG
  (credentials) → `createImageBitmap` → 1px `getImageData` (avoids cross-origin
  canvas taint). `EditorCanvas` shows a crosshair + full-page capture layer; click
  samples the pixel → `setFormat({ bgColor })`. New `IconPipette`.

**Part B — Font matching**
- `matchFont()` in `lib/editor/textMeasure.ts` maps raw PDF font names
  ("ABCDEE+Arial") → one of the 6 picker families; used in `selectBlock` pre-fill.
  Unmatched → Helvetica (backend still auto-promotes non-Latin-1 → Noto).

**Part C — Special characters (safety net)**
- 3 Noto `@font-face` rules in `app/globals.css` → existing `/public/fonts/*.ttf`
  so the on-screen overlay matches the baked output for ə ç ğ ı İ ö ş ü + Cyrillic.
- `pdf-editor.py selftest` command: inserts "Əə Çç Ğğ Şş İıÖö Üü Привет" via
  `_insert_text` and asserts a clean round-trip (never-tofu guard). **Passes.**

## Verified
- `python pdf-editor.py selftest` → OK.
- `bun test lib/editor/eyedropper.test.ts` → 1 pass.
- `bun run build` → compiled successfully, 192/192 pages.

## GATE 11B bug-fix rounds (manual-bg geometry + ordering)

The manual-bg highlight took 8 rounds to get right; each root cause verified by
reading the code, not guessing:
- **r2** — bgColor not shown on select / stripped before backend (Elysia schema
  + `modified` flag); apple-icon 404.
- **r3** — fill too wide + overhang (auto-resize 50pt floor fired on bgColor-only);
  delete left a fragment → backend `_lines` line-grouping (spans are font-runs);
  apple-icon 404 = proxy.ts matcher locale-prefixing `/icon`,`/apple-icon`.
- **r4** — bg must track edited text → highlight semantics: ghost = sampled page
  bg at original bbox; manual highlight sized to current text (`_text_width`).
- **r5** — r4 frontend half hadn't applied (replace_all matched wrong copy);
  dropped the 50pt floor for the fill width.
- **r6** — descenders clipped (height → `origH`), true shrink (frame vs ≥50pt hit
  area), move-with-text (highlight travels for a manual bg).
- **r7** — moved block's red bg turned white over another block's ghost (UI):
  z-index retiering PNG `-3` / ghosts `-2` / frames `-1` so stacking is by
  z-index not DOM order (EditorCanvas + TextBlock).
- **r8** — saved PDF dropped a colored block moved onto another moved block's
  original spot: `apply_redactions()` ran per-block after the draw → erased it.
  Fix: two-phase edit apply in `cmd_apply` — `_redact_edit` all bboxes (one
  `apply_redactions` per page) BEFORE `_draw_edit` all edits. Self-check added
  (renders a moved red block, asserts the red pixel survives). Dropped
  `_redact_rect`; added `_redact_fill`.

## GATE 11B result
- User confirmed pass 2026-06-24: manual bg + eyedropper, font pre-fill, AZ/TR/RU
  characters, descender coverage, shrink/lengthen, move-with-bg, z-index, saved
  PDF matches editor. No 11A regression.
- Final commits: `cadf462` (r6), `3b6c931` (frame padding + debug-log removal),
  `2e6adee` (r7 z-index), `d08c70f` (r8 ordering, Hetzner deployed).
- Known ceilings (ponytail): a whiteout overlapping an edited block can still
  erase its draw (its own `apply_redactions`); old-only area after shorten on a
  non-flat bg reverts to sampled page bg, not the manual color.
