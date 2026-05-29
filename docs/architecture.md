# PlinyPDF — Architecture

System architecture summary. Updated whenever a new architectural decision lands (CLAUDE.md §4.4).

## Frontend
- Next.js 16 (App Router) + TypeScript strict
- Tailwind CSS 4 (CSS-only config via `@theme`)
- shadcn/ui (slate base, CSS variables)
- next-intl (locales: `en`, `tr`, `ru`, prefix `always`)
- Plus Jakarta Sans (sans) + JetBrains Mono (mono) via `next/font/google`

## Routing
- `app/[locale]/` — all user-facing pages live under a locale segment
- `middleware.ts` — next-intl locale negotiation

## Backend (not yet built)
- Bun + Elysia (planned, sprint 5-6)

## Storage (not yet built)
- Supabase Postgres + Drizzle ORM (planned, sprint 5-6)
- Cloudflare R2 for transient Pro cloud files
- Upstash Redis for rate limiting

## Server-side processing (not yet built)
- Gotenberg via Docker (sprint 5-6) — PDF ↔ Word only
