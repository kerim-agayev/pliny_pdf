# PlinyPDF — Bugs Log

Discovered bugs and their resolutions. Read this when working on related code
to avoid re-discovering known issues.

---

## [2026-05-30] BUG: ThemeProvider script-tag warning + theme hydration

- **Where:** `components/shared/ThemeProvider.tsx`, `app/[locale]/layout.tsx`
- **Symptom:** Console error "Encountered a script tag while rendering React component" on language change and when visiting `/tools`.
- **Root cause:** `next-themes` 0.4.6 renders its theme `<script>` inside `<body>` (the memoized script component in `node_modules/next-themes/dist/index.js`). React 19 warns when a `<script>` is rendered in the component tree on client re-render (it won't execute).
- **Fix:** Removed `next-themes`. Custom `ThemeProvider` (React context) toggles the `.dark` class + persists to `localStorage`. Anti-FOUC handled by a server-rendered inline `<script>` in `<head>` (runs once, never re-rendered client-side, no flash). `ThemeToggle` now uses the custom `useTheme()`.
- **Commit:** fix: resolve ThemeProvider hydration + script tag warnings

## [2026-05-30] BUG: hydration mismatch from browser extension

- **Where:** `app/[locale]/layout.tsx`
- **Symptom:** Hydration error on `/tr/pricing` — `<body>` got `cz-shortcut-listen="true"` injected by a browser extension (ColorZilla).
- **Root cause:** Extensions mutate the DOM before React hydrates; the server HTML lacks the attribute.
- **Fix:** Added `suppressHydrationWarning` to `<body>` (already present on `<html>`). Standard fix for extension-injected attributes.
- **Commit:** fix: resolve ThemeProvider hydration + script tag warnings

## [2026-05-30] BUG: Compress PDF made files larger

- **Where:** `lib/pdf/compress.ts`, `components/tools/CompressTool.tsx`
- **Symptom:** 615 KB PDF → 1767 / 3163 / 5784 KB across presets (always bigger).
- **Root cause:** Every page was rasterized to JPEG, then rebuilt. For text/vector PDFs a JPEG of the page is far larger than the source content.
- **Fix:** Decision tree that can never inflate: (1) always try lossless `save({ useObjectStreams: true })`; (2) for screen/balanced also try rasterization, keep only if smaller; (3) pick the smallest; if nothing beats the original, return the original with `changed: false` and show "Already optimized — original kept". <1 MB files show a "may not shrink" note.
- **Commit:** fix: smart Compress PDF logic (skip already-optimized files)

## [2026-05-30] BUG: sticky note couldn't accept text in PDF Editor

- **Where:** `components/tools/EditorTool.tsx` (sticky branch of `onMouseDown`)
- **Symptom:** Sticky note placed a shape but clicking it didn't open a text input.
- **Root cause:** Sticky was a `fabric.Group([Rect, Textbox])`; grouped text isn't directly editable.
- **Fix:** Sticky is now a single editable `fabric.Textbox` styled as a note (`backgroundColor: "#FACC15"`, padding). It calls `enterEditing()` on creation; double-click re-edits (same built-in behavior as the working Text tool).
- **Commit:** fix: sticky note text input in PDF Editor
