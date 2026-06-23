# Wave 11B — Manual Color Fallback + Font/Character Support

Code complete; awaiting manual GATE (AZ test PDF) + Hetzner deploy.

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

## Remaining for GATE 11B (not done — needs user)
- Hetzner deploy (`pdf-editor.py` changed).
- Manual desktop+mobile test on the Azerbaijani PDF: ə/ğ/ş render (overlay +
  download), font pre-fill matches, manual bg + eyedropper blend on gradient/image,
  white bg still works, bold/italic preserved, 11A solid-row auto-match unregressed.
