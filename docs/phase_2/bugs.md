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

## [2026-06-01] Wave 2B Gate — Text→PDF / Markdown→PDF crash on non-WinAnsi text
Pasting text with smart quotes / em dashes / exotic Unicode spaces (and, more importantly,
any Turkish ş/ğ/İ/ı or Russian Cyrillic) showed "Something went wrong processing your file."
**Cause:** both tools embedded pdf-lib `StandardFonts` (Helvetica/Courier), which encode text
as **WinAnsi (CP1252)** and *throw* on any code point outside it. WinAnsi can't represent
Cyrillic at all and is missing several Turkish letters — fatal for EN/TR/RU launch locales.
**Fix (Unicode font embed, user-approved over sanitize-only):** switched `lib/pdf/textToPdf.ts`
and `lib/pdf/markdownToPdf.ts` to `@cantoo/pdf-lib` + `@pdf-lib/fontkit` and embed **Noto Sans**
(Regular/Bold) + **Noto Sans Mono** (code blocks) from `/public/fonts`, with `{ subset: true }`
so only used glyphs ship in the output. Now renders English, Turkish and Russian correctly.
New dep: `@pdf-lib/fontkit`; new assets: 3 TTFs in `public/fonts/` (~1.5 MB, fetched only on
these two tool pages). Shared loader: `lib/pdf/fonts.ts` (fetch + module-level cache).
**Follow-up (2nd Gate 2B attempt):** first cut used `embedFont(bytes, { subset: true })` and
rendered with correct letter *spacing* but missing *glyphs* (even plain ASCII) — the classic
signature of a broken subsetter. Root cause: `@pdf-lib/fontkit@1.1.1` is an old fork whose
glyph subsetter drops glyphs for many modern fonts (incl. these Noto TTFs). Fonts themselves
verified sound (fontkit `hasGlyphForCodePoint` → all present; files confirmed in `public/fonts`,
no 404 — spacing was correct, proving the font loaded). **Fix:** drop `{ subset: true }` and
embed the full font. Verified offline: generated PDF → pdfjs text extraction round-trips
`Türkçe: Şçğ İıöü`, `Русский: Привет`, smart quotes and em dash exactly. Trade-off: output PDFs
carry the full font (~280 KB for text-to-pdf's one font; ~1.4 MB for markdown's three) — acceptable;
can be revisited with a pre-built minimal subset font if size matters later.
**Note:** Bug 2 from this gate (Flatten PDF) was not a code bug — it needed a sample fillable
PDF to exercise `getForm().flatten()`; the no-op path for form-less PDFs already works.
