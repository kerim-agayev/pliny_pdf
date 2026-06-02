# Wave 3C — Compress + Grayscale

## Sub-tasks
- [x] **Compress** — three genuinely different presets (re-keyed `max`/`balanced`/`high`;
  old keys were `screen`/`balanced`/`maximum` with inverted semantics):
  - max: 96 DPI, JPEG q0.30 (smallest)
  - balanced: 150 DPI, JPEG q0.60
  - high: 300 DPI, JPEG q0.85 (best quality)
  - DPI→scale = `dpi/72` (pdfjs scale 1.0 = 72 DPI).
  - Pure-text detection via pdfjs `getOperatorList` (`paintImage*` ops) → skips raster,
    lossless only, fires `toast.info(textOnlyNote)`.
  - Never-inflate kept (returns original if best ≥ original).
  - Before/after size in `toast.success`.
- [x] **Grayscale** — 150 DPI cap (was scale 2 ≈ 144, now `150/72`), embeds **JPEG** q0.8
  (was PNG → inflated). Returns `{ blob, changed }`; if output ≥ input, returns original
  with `changed:false` and the tool fires `toast.warning(notReduced)`. Page progress kept.

## Files changed
- `lib/pdf/compress.ts` (presets, `hasImages`, `textOnly`, DPI), `lib/pdf/grayscale.ts`
- `components/tools/CompressTool.tsx` (preset keys, toasts), `components/tools/GrayscalePdf.tsx`
- `messages/{en,tr,ru}.json` (compress preset relabels + `textOnlyNote`; grayscale `notReduced`)

## Verification
- `bun run build` green + no MISSING_MESSAGE (old preset keys fully removed; grep clean).
- Never-inflate verified headlessly on a text PDF (changed:false, newSize≤orig). PASS.
- **Canvas-dependent checks require the browser gate** (pdfjs needs a browser; Node can't
  rasterize): three presets must produce three measurably different sizes on an image-heavy
  PDF; grayscale output ≤ input on a small color PDF. `textOnly` detection also browser-only
  (fails safe to non-text → never-inflate still protects).

## Post-gate fixes (2026-06-02)
- Recalibrated compress DPIs to 72/96/120 (q0.35/0.55/0.72) so all presets reduce + stay ordered.
- Grayscale always returns the converted file (warns if larger), never the color original.
- Added tool caps: Grayscale ≤10 MB/100 pages, Compress ≤50 MB/300 pages (toast.error in onFiles).

## Gate 3C
Compress the same image PDF at all 3 presets → 3 different sizes. Grayscale a small color
PDF → output ≤ input (or "returning original" warning). Text PDF compress → "text PDF
compresses minimally" toast.
