# Wave 9G — Performance + Memory + Bundle Audit

**Status:** code fix done; GATE 9G pending user verification (DevTools heap, Lighthouse, manual rate-limit).

Audit wave — only confirmed, measured problems fixed. No speculative optimization.

## Audit results (5 questions)

1. **Edit PDF / Annotate PDF code-split?** ✅ YES. `components/tools/ToolMount.tsx`
   loads all 32 tools via `next/dynamic` (`ssr: false`). `pdfjs-dist` via async wrapper
   `lib/pdf/pdfjs.ts`; `fabric` via `await import("fabric")` (EditorTool, SignPdf).
   Heavy deps ship in per-tool chunks, not the initial bundle. No change.
2. **Confirmed memory leaks?** ⚠️ ONE — `JpgToPdfTool.tsx:114` created a blob URL
   inline in render and never revoked. **FIXED** (see below). All other listeners,
   IntersectionObserver/ResizeObserver, Fabric `dispose()`, `setInterval`,
   `PDFDocument.destroy()` verified clean. The two EditPdf toolbar `createObjectURL`
   sites already revoke.
3. **Large unoptimized static images?** ✅ NO. No raw `<img>` for static assets; only
   5 tiny SVGs in `public/`; OG via `next/og` dynamic. No change.
4. **font-display: swap?** ✅ YES. All 3 Google fonts via `next/font/google` with
   `display:"swap"` + subsets (incl. cyrillic). Noto `.ttf` (2.7 MB) lazy-fetched on
   demand / backend-only, not on page load. No change.
5. **Rate limits enforced?** ✅ YES. `lib/ratelimit.ts` (Upstash; anon 3/day, free
   10/day, pro unlimited). `checkServerTool()` called before processing in every cloud
   handler (`tools.ts` compress/grayscale/pdf-to-jpg/merge, `editor.ts` open) → 429.

Note: `@cantoo/pdf-lib` is NOT a dead duplicate — used for PDF encryption in
`validation.ts`, `password.ts`, `markdownToPdf.ts`, `textToPdf.ts`. Both pdf-lib
packages intentional. Not touched.

## Code change (only one)

- `components/tools/JpgToPdfTool.tsx` — preview blob URLs now created in a
  `useEffect` keyed on `files`, revoked on change + unmount; `<img>` uses
  `previews[i]`. Fixes the object-URL leak. No i18n / backend / other tools touched.

## Build

- `bun run build` → ✓ Compiled successfully. Turbopack does not emit the
  Size/First Load JS table; chunk inspection confirms heavy deps are isolated in
  lazy per-tool chunks (largest chunks are on-demand tool bundles, not initial load).

## GATE 9G — remaining user verification

- [ ] DevTools heap flat: JpgToPdf add/remove/convert ×5; Edit/Annotate open→edit→save ×5
- [ ] Initial First Load JS < 500 KB (DevTools Network / Lighthouse)
- [ ] Lighthouse on homepage, /tools, /edit-pdf (Perf ≥90, A11y ≥95, BP ≥95; SEO is 9H)
- [ ] Rate limit: 4th anon cloud call → 429; free 10/day confirmed
- [ ] Do NOT commit until user confirms GATE 9G
