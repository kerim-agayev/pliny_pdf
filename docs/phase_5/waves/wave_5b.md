# Wave 5B — Cloud migration (stub)

Move Compress, Grayscale, PDF→JPG, Merge from local (browser) to cloud (Hetzner
PyMuPDF). See CLAUDE_5.md §4 Wave 5B for full scope.

- 5B-1: `server/services/pdf-tools.py` (PyMuPDF CLI: compress / grayscale / pdf-to-jpg / merge)
- 5B-2: Backend routes in `server/routes/tools.ts` (413/429/502, CLOUD_MAX_MB + CLOUD_MAX_PAGES, per-tool rate keys)
- 5B-3: Frontend — switch `mode: "local"` → `"cloud"`, upload to API, Cloud badge, cloud limits
- Compress: remove 3 presets (single button). Grayscale: drop Wave-3C caps. Privacy page → 9 cloud tools.

GATE 5B: each migrated tool works via cloud, fast; old local code paths removed.
