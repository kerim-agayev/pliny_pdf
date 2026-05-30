# PlinyPDF — Project Index

> This file is the project's short memory. Claude Code reads it first every session.
> Drill down to the relevant `sprints/sprint-XX.md` only when detail is needed.

## Current Status
- Phase: 1 (Launch — first 3 months)
- Active sprint: Sprint 3-4 — Core Local Tools — COMPLETE (design handoff implemented; 10 local tools built, tested, bug-fixed)
- Next step: Sprint 5-6 — Backend (Bun/Elysia), Gotenberg PDF↔Word, Supabase+Drizzle, Better Auth, Gemini AI Summarize, Paddle, rate limiting

## Completed Sprints
- Sprint 1-2: Foundation — Next.js 16 + Tailwind 4 + shadcn/ui + next-intl (en/tr/ru) + design tokens + docker-compose + placeholder shared UI — 2026-05-29
- Sprint 3-4: Claude Design handoff (6 screens, dark/light theme toggle) + 10 local PDF tools (pdf-lib / pdfjs-dist / @cantoo/pdf-lib / fabric.js) + coming-soon placeholders; round of bug fixes from user testing — 2026-05-30

## Key Files
- `CLAUDE.md` — working rules, tech stack, Phase 1 scope
- `docs/decisions.md` — technical decisions and their reasons
- `docs/architecture.md` — system architecture (theming, PDF processing, compress strategy, editor)
- `docs/bugs.md` — known bugs and their fixes (read when touching related code)
- `docs/log.md` — chronological record
- `app/[locale]/` — i18n-routed App Router pages (home, tools, pricing, dashboard, 10 tool routes, coming-soon)
- `i18n/{routing,navigation,request}.ts` + `proxy.ts` — next-intl wiring
- `lib/pdf/*` — per-tool in-browser PDF logic; `lib/tools.ts` — tool catalog
- `components/tools/*` — ToolShell, FileDropzone, ResultPanels + one component per tool
- `components/shared/*` — Navbar, Footer, PrivacyBadge, ThemeProvider/Toggle, ToolCard, icons
- `messages/{en,tr,ru}.json` — translations

## Phase 1 Goal Summary
12 tools (10 local + 2 cloud), 1 AI feature (Summarize), 3 languages (EN/TR/RU),
3-tier accounts (no-account / free / Pro), ~$7/mo cost, 8 weeks.

## Phase 1 Tool Status
- [x] Merge PDF
- [x] Split PDF
- [x] Compress PDF
- [x] Rotate PDF
- [x] PDF → JPG
- [x] JPG → PDF
- [x] Watermark (live preview)
- [x] Password Protect
- [x] Remove Password
- [x] PDF Editor (annotation)
- [ ] PDF → Word (Gotenberg) — Sprint 5-6
- [ ] Word → PDF (Gotenberg) — Sprint 5-6
- [ ] AI PDF Summarize (Gemini) — Sprint 5-6
