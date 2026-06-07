# Phase 5 — Architecture

## Limit system (`lib/limits.ts`)
Three independent tiered limit families, each keyed by plan (`anon`/`free`/`pro`):

| Family | MB (anon/free/pro) | Pages (anon/free/pro) | Used by |
|---|---|---|---|
| `LOCAL_MAX_MB` / `LOCAL_MAX_PAGES` | 10 / 25 / 50 | 50 / 150 / 300 | local tools (FileDropzone) |
| `CLOUD_MAX_MB` / `CLOUD_MAX_PAGES` | 25 / 100 / 250 | 50 / 300 / 1000 | cloud tools (PDF↔Word, OCR, AI; + 5B migrated) |
| `EDITOR_MAX_MB` / `EDITOR_MAX_PAGES` | 15 / 50 / 200 | 20 / 100 / 500 | Edit PDF (unchanged from Phase 4) |

Accessors: `localMaxMB/localMaxBytes/localMaxPages`, `cloudMaxMB/cloudMaxBytes/cloudMaxPages`,
`editorMaxMB/editorMaxBytes/editorMaxPages`. Plan resolves to `anon` when null/undefined.

## Enforcement points
- **Client (local tools):** `FileDropzone` validates size against `localMaxMB(plan)`
  and, when `checkPages` is set, page count against `localMaxPages(plan)` via
  `readPageCount()` — *before* `onFiles` runs, so processing never starts oversized.
- **Server (cloud tools):** routes call `cloudMaxBytes(plan)` (413 on oversize),
  `checkServerTool` (429 on rate limit). Server-side page enforcement for migrated
  tools arrives in 5B with each tool's route.

## Rate limiting (`lib/ratelimit.ts`)
- `ipServer` — anon, fixedWindow(3, "1 d")
- `userServer` — free, fixedWindow(15, "1 d")  *(was 10)*
- `userAi` — free, fixedWindow(2, "30 d")
- Pro → unlimited via early return.

## Cloud migration (5B — not yet built)
4 tools (Compress, Grayscale, PDF→JPG, Merge) move to PyMuPDF on Hetzner. See
`waves/wave_5b.md`.
