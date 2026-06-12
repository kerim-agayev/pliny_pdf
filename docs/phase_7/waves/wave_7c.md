# Wave 7C — N-up Layout

## Status: COMPLETE ✅ (GATE 7C passed 2026-06-12)

## Tasks
- [x] N-up Layout — component, lib, route, i18n, SEO
- [x] Layout options: 2-up (H), 2-up (V), 4-up, 6-up, 9-up (5 variants)
- [x] Paper size (A4 / Letter / Legal) + orientation (Portrait / Landscape)
- [x] Live schematic preview (CSS grid of NupTile placeholders, updates on every change)
- [x] bun run build green (EN/TR/RU all resolved, no MISSING_MESSAGE)
- [x] Committed 030792f, pushed origin/main

## Scope decisions (confirmed this wave)
- Sequential imposition only (no Booklet order — deferred to Wave 7D's PDF Booklet tool)
- Paper sizes: A4, Letter, Legal (matched design; scope text minimum was A4/Letter)
- Limit cap: output sheets (nupMaxOutputPages anon:100 / free:300), NOT input pages (checkPages intentionally omitted on dropzone)

## Gate 7C
N-up works with 2-up and 4-up, correct PDF output.
