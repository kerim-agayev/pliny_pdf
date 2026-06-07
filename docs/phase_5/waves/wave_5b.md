# Wave 5B — Cloud migration (stub)

Move Compress, Grayscale, PDF→JPG, Merge from local (browser) to cloud (Hetzner
PyMuPDF). See CLAUDE_5.md §4 Wave 5B for full scope.

- 5B-1: `server/services/pdf-tools.py` (PyMuPDF CLI: compress / grayscale / pdf-to-jpg / merge)
- 5B-2: Backend routes in `server/routes/tools.ts` (413/429/502, CLOUD_MAX_MB + CLOUD_MAX_PAGES, per-tool rate keys)
- 5B-3: Frontend — switch `mode: "local"` → `"cloud"`, upload to API, Cloud badge, cloud limits
- Compress: remove 3 presets (single button). Grayscale: drop Wave-3C caps. Privacy page → 9 cloud tools.

GATE 5B: each migrated tool works via cloud, fast; old local code paths removed.

## Status (2026-06-07)
- [x] 5B-1 `pdf-tools.py` + `pdf-tools.ts` (compress/grayscale/pdf-to-jpg/merge; page cap)
- [x] 5B-2 `server/routes/tools.ts` (`/api/tools/*`) + registered in `index.ts`
- [x] 5B-3 frontend: `postBinary`, mode→cloud, 4 components rewritten, `CloudProgress`, privacy page
- [x] Dead code removed (raster subsystem + tool helpers + Wave-3C caps); jszip kept
- [x] `bun run build` green · `tsc --noEmit` 0 errors · `pdf-tools.py` py_compile OK
- [ ] ⏳ GATE 5B functional — deploy server/ to Hetzner, run real-file checks (see log.md)

Decisions: Compress single button (no presets), never grows file. PDF→JPG 150 DPI,
1 page→.jpg / 2+→.zip. Shared `checkServerTool` limiter (per-tool keys deferred, §10).
