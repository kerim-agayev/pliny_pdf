# Phase 2 — Status

> Phase 2 memory index. Read this first at session start, then drill into the
> other `docs/phase_2/` files. Phase 1 docs (`docs/*.md` at root) are READ-ONLY.

## Current Status: COMPLETE ✅
- All 15 tools built, tested, committed, pushed.
- Total catalog: **28 tools** (13 Phase 1 + 15 Phase 2).
- All waves complete: 2A ✅  2B ✅  2C ✅ (Gate 2C passed 2026-06-01).

## Tool Catalog — Phase 2 (15 tools added)

### Wave 2A — High Priority Local (8 tools) ✅
1. delete-pages — Delete unwanted pages (thumbnail grid + selection)
2. extract-pages — Extract page ranges (`1-5, 8, 11-13` syntax)
3. add-page-numbers — Page numbers (9-position grid, live preview)
4. header-footer — Header/footer (`{page}` `{total}` `{date}` `{filename}` tokens)
5. crop-pdf — Crop pages (drag handles, presets, canvas overlay, auto-margin)
6. organize-pages — Drag-and-drop reorder (dnd-kit, multi-select, toolbar)
7. sign-pdf — Visual signature (Draw/Type/Upload tabs, fabric.js draw pad)
8. redact-content — Permanent redaction (DOM overlay, search & redact, re-rasterize)

### Wave 2B — Medium Priority Local (6 tools) ✅
9. remove-metadata — Strip PDF Info dict (title/author/subject/keywords/dates)
10. edit-metadata — View + edit title/author/subject/keywords/creator/producer
11. grayscale-pdf — Convert to grayscale (re-rasterizes pages; text → image)
12. flatten-pdf — Flatten form fields (`getForm().flatten()`, no-op if no form)
13. text-to-pdf — Plain text → PDF (Noto Sans Unicode font, A4/Letter)
14. markdown-to-pdf — Markdown → PDF (split editor + live preview)

### Wave 2C — Cloud Tool (1 tool) ✅
15. ocr-pdf — OCR PDF (ocrmypdf on Hetzner; eng/tur/rus; auth-optional)

## Deferred from Phase 2 (per CLAUDE_2.md §1 + user calls)
- AI Chat with PDF — users have ChatGPT/Claude/Gemini
- PDF → Excel — complex, low usage
- PDF → PowerPoint — NotebookLM covers this
- Repair PDF — qpdf-wasm too complex (user call)
- Fill Forms — fold into PDF Editor later (user call)

## Phase 1 Deferred Items (still pending — domain-gated, OUT of Phase 2)
- Buy plinypdf.com domain
- Cloudflare DNS: `api.plinypdf.com` A → 49.13.119.27 (grey cloud)
- Install Caddy on Hetzner (config ready at `deploy/Caddyfile`)
- Vercel frontend deploy + custom domain plinypdf.com
- Update Google OAuth redirect URI (prod)
- Update Lemonsqueezy webhook URL
- Add `NEXT_PUBLIC_POSTHOG_KEY` to Vercel env
- Add Sentry (`@sentry/nextjs` + `SENTRY_DSN`)
- Switch Lemonsqueezy to LIVE mode (only at actual launch, explicit confirm)
- GATE 2-final: full e2e test on https://plinypdf.com
- Full runbook: `deploy/README.md` ("Remaining when domain is purchased")

## Hetzner Production Server State
- IP: 49.13.119.27
- Backend: systemd `plinypdf-backend.service` (auto-restart)
- Gotenberg: Docker container `pliny_pdf-gotenberg-1` (port 3001)
- ocrmypdf: installed (apt) + tesseract eng/tur/rus language packs
- UFW: 22/80/443 open; **8080 opened for Gate 2C testing — close after domain+Caddy**
- `FRONTEND_ORIGIN`: MUST be `https://plinypdf.com` in production (was temporarily
  `http://localhost:3000` during Gate 2C testing — reverted)
- Update flow: `git pull && bun install && systemctl restart plinypdf-backend`

## Next Steps (decision needed from user)
- **Option A:** Buy domain → complete Phase 1 deferred items → launch.
- **Option B:** Continue adding tools (Phase 3) before launch.

## Phase 2 file map
- `decisions.md` — Phase 2 technical decisions + reasons.
- `architecture.md` — tool patterns (7 touch-points), OCR/cloud + Unicode-font pipelines, Hetzner state.
- `bugs.md` — every bug found this phase + fix.
- `log.md` — one entry per wave gate-pass.
- `waves/wave_2{a,b,c}.md` — per-wave detail + completion notes.
