# PlinyPDF — Project Index

> This file is the project's short memory. Claude Code reads it first every session.
> Drill down to the relevant `sprints/sprint-XX.md` only when detail is needed.

## Current Status
- Phase: 1 (Launch — first 3 months)
- Active sprint: Sprint 7-8 — Launch prep. Phase A (deploy artifacts + cross-subdomain auth) + Phase B (Hetzner backend, steps 1-6, live at 49.13.119.27:8080) done. Domain-independent launch work (Tasks 1-6) **COMPLETE**: real About/Privacy/Terms + 5-post markdown blog, SEO (sitemap/robots/OG/JSON-LD/canonicals), PostHog analytics (no-op until key), mobile Navbar menu, launch materials.
- Next step: when **plinypdf.com** is purchased, resume Phase B steps 7-8 (Cloudflare DNS + Caddy SSL) + Phase C (Vercel deploy + custom domain + Google OAuth + LS webhook) → GATE 2 full e2e. Steps in `deploy/README.md`. Also provide `NEXT_PUBLIC_POSTHOG_KEY` (Vercel env) to activate analytics; decide Lemonsqueezy go-live.

## Completed Sprints
- Sprint 1-2: Foundation — Next.js 16 + Tailwind 4 + shadcn/ui + next-intl (en/tr/ru) + design tokens + docker-compose + placeholder shared UI — 2026-05-29
- Sprint 3-4: Claude Design handoff (6 screens, dark/light theme toggle) + 10 local PDF tools (pdf-lib / pdfjs-dist / @cantoo/pdf-lib / fabric.js) + coming-soon placeholders; round of bug fixes from user testing — 2026-05-30
- Sprint 5-6: Bun/Elysia backend (:8080) + Supabase/Drizzle + Better Auth (email + Google) + PDF↔Word (Gotenberg HTTP + docker-exec LibreOffice) + R2 + Gemini 2.5 Flash Summarize + Upstash rate limits + Lemonsqueezy billing (checkout + HMAC webhook) + dynamic auth-guarded Free/Pro dashboard with file-history cleanup — 2026-05-31
- Sprint 7-8 (partial): deploy artifacts + cross-subdomain auth; Hetzner backend live (steps 1-6); real About/Privacy/Terms + 5 blog posts; SEO (sitemap/robots/OG/JSON-LD/canonicals); PostHog analytics; mobile Navbar menu; launch materials. Domain steps + Vercel deferred until plinypdf.com purchased — 2026-05-31

## Key Files
- `CLAUDE.md` — working rules, tech stack, Phase 1 scope
- `docs/decisions.md` — technical decisions and their reasons
- `docs/architecture.md` — system architecture (theming, PDF processing, compress strategy, editor)
- `docs/bugs.md` — known bugs and their fixes (read when touching related code)
- `docs/log.md` — chronological record
- `app/[locale]/` — i18n-routed App Router pages (home, tools, pricing, dashboard, 10 tool routes, coming-soon)
- `i18n/{routing,navigation,request}.ts` + `proxy.ts` — next-intl wiring
- `lib/pdf/*` — per-tool in-browser PDF logic; `lib/tools.ts` — tool catalog
- `components/tools/*` — ToolShell, FileDropzone, ResultPanels + one component per tool (incl. CloudConvertTool, SummarizeTool)
- `components/shared/*` — Navbar, NavAuth (auth state + PRO badge), Footer, PrivacyBadge, ThemeProvider/Toggle, ToolCard, icons
- `messages/{en,tr,ru}.json` — translations
- `server/` — Elysia backend (:8080): `index.ts`, `routes/{health,convert,ai,billing}.ts`, `services/{gotenberg,libreoffice,r2,gemini,pdftext,lemonsqueezy,session}.ts`
- `lib/db/{schema,index}.ts` — Drizzle schema + pooled Supabase client; `scripts/db.ts` — migration wrapper
- `lib/auth/{index,client}.ts` — Better Auth (server + browser); `app/api/auth/[...all]/route.ts`
- `lib/ratelimit.ts` — Upstash limiters; `lib/api.ts` — frontend fetch wrapper (credentials, postFile/postJson)
- `app/[locale]/dashboard/page.tsx` — auth-guarded dynamic Free/Pro dashboard

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
- [x] PDF → Word (Gotenberg + docker-exec LibreOffice)
- [x] Word → PDF (Gotenberg)
- [x] AI PDF Summarize (Gemini 2.5 Flash)
