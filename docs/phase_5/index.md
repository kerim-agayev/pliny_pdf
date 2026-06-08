# PlinyPDF — Phase 5 Index

## Current Status
- Phase: 5 (Performance, Cloud Migration & Polish)
- Active wave: **5E — Edit PDF improvements** — ✅ GATE 5E passed (2026-06-08); committed + pushed. ⚠️ Backend deploy required for 5E-2 save (Hetzner: git reset --hard origin/main + restart plinypdf-backend).
- Next step: Phase 5 waves 5A–5E all complete. Awaiting next direction.

## Waves
- **5A** — Global fixes + limit enforcement — *complete (GATE 5A passed 2026-06-07)* ✅
- **5B** — Cloud migration (Compress, Grayscale, PDF→JPG, Merge) — *shipped; GATE 5B bug-fixes pushed (39ba4e9). Backend deploy: git reset --hard origin/main + restart plinypdf-backend on Hetzner.*
- **5C** — Local optimizations (Header/Footer, Extract, Sign, lazy thumbnails, Web Workers, JPG→PDF cap) — *complete (GATE 5C passed 2026-06-07)* ✅
- **5D** — Mobile touch (Annotate PDF + Edit PDF) — *complete (GATE 5D passed 2026-06-07)* ✅ — Pointer Events refactor + `usePinchZoom` (`lib/touch.ts`)
- **5E** — Edit PDF improvements (new-text font/size/color on creation; added block selectable+editable in-session; resize polish) — *complete (GATE 5E passed 2026-06-08)* ✅ — needs Hetzner backend deploy for added-block save

## Key Files (Phase 5)
- `lib/format.ts` — `downloadBlob` (download filename fix, 5A-1)
- `lib/limits.ts` — plan-aware local + cloud size/page limits
- `lib/ratelimit.ts` — daily rate limits (anon 3 / free 15 / pro ∞)
- `components/tools/FileDropzone.tsx` — plan-aware badge + `checkPages` gate
- `lib/pdf/common.ts` — `readPageCount()`
- `lib/touch.ts` — `usePinchZoom` (two-finger zoom/pan; both editors, Wave 5D)

## Conventions
- Phase 1–4 docs are READ-ONLY. All Phase 5 memory lives here under `docs/phase_5/`.
- `bun run build` after each sub-task; one `log.md` entry per gate pass.
