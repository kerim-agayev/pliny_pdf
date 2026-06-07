# PlinyPDF — Phase 5 Index

## Current Status
- Phase: 5 (Performance, Cloud Migration & Polish)
- Active wave: **5C — Local optimizations** — ✅ GATE 5C passed (2026-06-07); committed + pushed (Vercel auto-deploy).
- Next step: Wave 5D — mobile touch (Annotate PDF + Edit PDF).

## Waves
- **5A** — Global fixes + limit enforcement — *complete (GATE 5A passed 2026-06-07)* ✅
- **5B** — Cloud migration (Compress, Grayscale, PDF→JPG, Merge) — *shipped; GATE 5B bug-fixes pushed (39ba4e9). Backend deploy: git reset --hard origin/main + restart plinypdf-backend on Hetzner.*
- **5C** — Local optimizations (Header/Footer, Extract, Sign, lazy thumbnails, Web Workers, JPG→PDF cap) — *complete (GATE 5C passed 2026-06-07)* ✅
- 5D — Mobile touch (Annotate PDF + Edit PDF) — not started
- 5E — Edit PDF improvements — not started

## Key Files (Phase 5)
- `lib/format.ts` — `downloadBlob` (download filename fix, 5A-1)
- `lib/limits.ts` — plan-aware local + cloud size/page limits
- `lib/ratelimit.ts` — daily rate limits (anon 3 / free 15 / pro ∞)
- `components/tools/FileDropzone.tsx` — plan-aware badge + `checkPages` gate
- `lib/pdf/common.ts` — `readPageCount()`

## Conventions
- Phase 1–4 docs are READ-ONLY. All Phase 5 memory lives here under `docs/phase_5/`.
- `bun run build` after each sub-task; one `log.md` entry per gate pass.
