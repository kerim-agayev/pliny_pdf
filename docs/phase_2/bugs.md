# PlinyPDF Phase 2 — Bugs

> Bugs found and fixed during Phase 2. Read before touching related code.
> Phase 1 bugs live in `docs/bugs.md` (root, read-only).

## [2026-06-01] Wave 2A Gate — Header & Footer placeholder i18n crash
`FORMATTING_ERROR: the intl string context variable "filename"/"page" was not provided`.
The `headerPlaceholder`/`footerPlaceholder` strings contain literal example tokens
`{filename}`, `{page}`, `{total}` — but next-intl (ICU MessageFormat) read the braces as
interpolation variables and threw because no values were passed.
**Fix:** ICU-escape the braces with single quotes in all three locales, e.g.
`"e.g. Page '{page}' of '{total}'"` → renders literally as `e.g. Page {page} of {total}`.
Real interpolations elsewhere (`{count}`, `{n}`) were untouched. Files: `messages/{en,tr,ru}.json`.

## [2026-06-01] Wave 2A Gate — Sign PDF Type tab `removeChild` crash
Switching Draw → Type threw `Failed to execute 'removeChild' on 'Node'`. Cause: the draw
`<canvas>` was conditionally rendered (`{tab === "draw" && <canvas>}`). Fabric moves that
canvas into its own `.canvas-container` wrapper, so on tab change React called
`padDiv.removeChild(canvas)` while the canvas's real parent was fabric's container — and
fabric v7 `dispose()` is async, racing the unmount.
**Fix (surgical, `components/tools/SignPdf.tsx`):** keep the canvas permanently mounted inside
a React-owned wrapper `<div>` and toggle only that wrapper's `display` per tab; init fabric
once on `status === "ready"` (not per-tab) and guard `dispose()` with try/catch. Type tab
already used a plain styled `<span>` (no fabric), as intended.
