# PlinyPDF — Architecture

System architecture summary. Updated whenever a new architectural decision lands (CLAUDE.md §4.4).

## Frontend
- Next.js 16 (App Router) + TypeScript strict
- Tailwind CSS 4 (CSS-only config via `@theme`)
- shadcn/ui (neutral base) — used sparingly; most UI uses ported design tokens + `.pp-*` utility classes in `app/globals.css` (from the Claude Design `brand.css`)
- next-intl (locales: `en`, `tr`, `ru`, prefix `always`)
- Fonts via `next/font/google`: Plus Jakarta Sans (display/headings), Inter (body), JetBrains Mono (mono)

## Theming (custom — next-themes removed)
- Class strategy: `.dark` on `<html>`; light is the default (`:root`).
- `components/shared/ThemeProvider.tsx` — React context; `setTheme` toggles the `.dark` class and persists to `localStorage["theme"]`.
- Anti-FOUC: a server-rendered inline `<script>` in the layout `<head>` applies the stored theme before paint. (next-themes was dropped because it renders its theme `<script>` in `<body>`, which trips a React 19 client-render warning — see `docs/bugs.md`.)

## Routing
- `app/[locale]/` — all user-facing pages live under a locale segment
- `proxy.ts` — Next 16's middleware replacement; runs next-intl locale negotiation
- Tool routes: one folder per tool (`merge-pdf`, `split-pdf`, …); "coming soon" placeholders for `login/signup/privacy/blog/about/terms`

## In-browser PDF processing (local tools)
- `lib/pdf/*` holds one module per tool; pages compose `components/tools/ToolShell` + `FileDropzone` + `ResultPanels`.
- **pdf-lib** — merge, split, rotate (`rotatePages` for per-page deltas), jpg→pdf, watermark.
- **pdfjs-dist** — loaded via `lib/pdf/pdfjs.ts` `getPdfjs()` (dynamic `import()` so its top-level DOMMatrix never evaluates during SSR; worker bundled locally, no CDN). Used for compress raster pass, pdf→jpg, watermark live preview, editor page render, and `lib/pdf/thumbnails.ts`.
- **@cantoo/pdf-lib** — password protect/remove (AES; mainline pdf-lib dropped encryption).
- **Compress strategy** (`lib/pdf/compress.ts`): lossless `save({useObjectStreams:true})` first → raster pass for screen/balanced → keep smallest → never exceed original (returns original with `changed:false`). Small files (<1 MB) get a "may not shrink" note.
- **PDF Editor** (`components/tools/EditorTool.tsx`): fabric.js overlay on a pdfjs-rendered page image; annotations stored per page as fabric JSON; undo/redo via JSON snapshots; sticky note = editable `Textbox`; export stamps per-page PNG overlays onto the original via `lib/pdf/editorExport.ts` (preserves underlying text).
- **Rotate** (`components/tools/RotateTool.tsx`): thumbnail strip (low-scale pdfjs render) with per-page selection (Ctrl/Cmd multi; none = all) and live CSS-rotate preview; bakes via `rotatePages`.

## Backend (not yet built)
- Bun + Elysia (planned, sprint 5-6)

## Storage (not yet built)
- Supabase Postgres + Drizzle ORM (planned, sprint 5-6)
- Cloudflare R2 for transient Pro cloud files
- Upstash Redis for rate limiting

## Server-side processing (not yet built)
- Gotenberg via Docker (sprint 5-6) — PDF ↔ Word only
