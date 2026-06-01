# PlinyPDF Phase 2 — Architecture

> New tool patterns and Phase 2-specific architecture. Phase 1 architecture lives
> in `docs/architecture.md` (root, read-only) — referenced by path, not duplicated.

## Adding a local tool — the 7 touch-points
1. **`components/shared/icons.tsx`** — add an `Icon*` component (stroke-based, 24×24,
   via the shared `I` wrapper).
2. **`lib/tools.ts`** — import the icon, add a `Tool` entry
   `{ id, slug, name, desc, cat, mode:"local", icon, accent, tag?, available:true }`.
3. **`lib/seo.ts`** — add `TOOL_SEO["<slug>"] = { title, description }` (REQUIRED).
4. **`lib/structured-data.ts`** — add `TOOL_FAQ["<slug>"]` (3 Qs, first is `PRIVACY_FAQ`).
   HowTo auto-derives from `mode` (`LOCAL_HOW`).
5. **`messages/{en,tr,ru}.json`** — `Tools.<id>` (`name`,`desc`; `Tools.tag.<id>` if tagged)
   + `ToolPages.<camelKey>` (`subtitle`, `action`, `successTitle`, + tool UI labels).
6. **`app/[locale]/<slug>/page.tsx`** — server component; `export const generateMetadata =
   toolMetadata("<slug>")`; renders `<JsonLd data={toolSchemas("<slug>")} />` + `<ToolShell>`.
7. **`components/tools/<Tool>.tsx`** (client) + **`lib/pdf/<op>.ts`** (pdf-lib logic).

Auto-derived (no action): `/tools` cards, `app/sitemap.ts`, `app/api/og`, dashboard links.

## Canonical client pattern
`components/tools/RotateTool.tsx` is the reference for per-page tools: state machine
`idle→loading→ready→processing→done|error`; `renderThumbnails(file)` (`lib/pdf/thumbnails.ts`);
`Set<number>` selection (Ctrl/Cmd multi); thumbnail grid `repeat(auto-fill,minmax(120px,1fr))`;
`analytics.toolUsed("<slug>")` on success; `downloadBlob`/`baseName` from `lib/format`.
Shared UI: `ToolShell`, `FileDropzone`, `SuccessPanel`/`ErrorBanner` (`ResultPanels.tsx`),
`FileInfoBar`, `Spinner`.

## pdf-lib op pattern
`lib/pdf/rotate.ts`: `PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true })`
→ mutate / `PDFDocument.create()` + `copyPages(src, indices)` + `addPage` → `doc.save()` →
`new Blob([data as BlobPart], { type: "application/pdf" })`.

<!-- OCR pipeline (Wave 2C) and design-tool specifics documented as they are built. -->
