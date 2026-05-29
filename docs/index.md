# PlinyPDF — Project Index

> This file is the project's short memory. Claude Code reads it first every session.
> Drill down to the relevant `sprints/sprint-XX.md` only when detail is needed.

## Current Status
- Phase: 1 (Launch — first 3 months)
- Active sprint: Sprint 3-4 — Core Local Tools (blocked on Claude Design handoff)
- Next step: User provides the Claude Design handoff command so the UI can be implemented before tool work begins (CLAUDE.md §12)

## Completed Sprints
- Sprint 1-2: Foundation — Next.js 16 + Tailwind 4 + shadcn/ui + next-intl (en/tr/ru) + design tokens + docker-compose + placeholder Navbar/Footer/PrivacyBadge — 2026-05-29 (Cloudflare Pages connection deferred to user)

## Key Files
- `CLAUDE.md` — working rules, tech stack, Phase 1 scope
- `docs/decisions.md` — technical decisions and their reasons
- `docs/architecture.md` — system architecture
- `docs/log.md` — chronological record
- `app/[locale]/` — i18n-routed App Router pages
- `i18n/{routing,navigation,request}.ts` — next-intl wiring
- `proxy.ts` — Next 16's middleware replacement (runs next-intl locale negotiation)
- `messages/{en,tr,ru}.json` — translations
- `components/shared/{Navbar,Footer,PrivacyBadge,LocaleSwitcher}.tsx` — placeholder shared UI

## Phase 1 Goal Summary
12 tools (10 local + 2 cloud), 1 AI feature (Summarize), 3 languages (EN/TR/RU),
3-tier accounts (no-account / free / Pro), ~$7/mo cost, 8 weeks.

## Phase 1 Tool Status
- [ ] Merge PDF
- [ ] Split PDF
- [ ] Compress PDF
- [ ] Rotate PDF
- [ ] PDF → JPG
- [ ] JPG → PDF
- [ ] Watermark (live preview)
- [ ] Password Protect
- [ ] Remove Password
- [ ] PDF Editor (annotation)
- [ ] PDF → Word (Gotenberg)
- [ ] Word → PDF (Gotenberg)
- [ ] AI PDF Summarize (Gemini)
