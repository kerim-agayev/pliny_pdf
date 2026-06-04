# PlinyPDF — Architecture

System architecture summary. Updated whenever a new architectural decision lands (CLAUDE.md §4.4).

## Frontend
- Next.js 16 (App Router) + TypeScript strict
- Tailwind CSS 4 (CSS-only config via `@theme`)
- shadcn/ui (neutral base) — used sparingly; most UI uses ported design tokens + `.pp-*` utility classes in `app/globals.css` (from the Claude Design `brand.css`)
- next-intl (locales: `en`, `tr`, `ru`, prefix `always`)
- Fonts via `next/font/google`: Plus Jakarta Sans (display/headings), Inter (body), JetBrains Mono (mono)

## Theming (custom — next-themes removed)
- Class strategy: `.dark` on `<html>`; light is the default (`:root`).
- `components/shared/ThemeProvider.tsx` — React context; `setTheme` toggles the `.dark` class and persists to `localStorage["theme"]`.
- Anti-FOUC: a server-rendered inline `<script>` in the layout `<head>` applies the stored theme before paint. (next-themes was dropped because it renders its theme `<script>` in `<body>`, which trips a React 19 client-render warning — see `docs/bugs.md`.)

## Routing
- `app/[locale]/` — all user-facing pages live under a locale segment
- `proxy.ts` — Next 16's middleware replacement; runs next-intl locale negotiation
- Tool routes: one folder per tool (`merge-pdf`, `split-pdf`, …); "coming soon" placeholders for `login/signup/privacy/blog/about/terms`

## In-browser PDF processing (local tools)
- `lib/pdf/*` holds one module per tool; pages compose `components/tools/ToolShell` + `FileDropzone` + `ResultPanels`.
- **pdf-lib** — merge, split, rotate (`rotatePages` for per-page deltas), jpg→pdf, watermark.
- **pdfjs-dist** — loaded via `lib/pdf/pdfjs.ts` `getPdfjs()` (dynamic `import()` so its top-level DOMMatrix never evaluates during SSR; worker bundled locally, no CDN). Used for compress raster pass, pdf→jpg, watermark live preview, editor page render, and `lib/pdf/thumbnails.ts`.
- **@cantoo/pdf-lib** — password protect/remove (AES; mainline pdf-lib dropped encryption).
- **Compress strategy** (`lib/pdf/compress.ts`): lossless `save({useObjectStreams:true})` first → raster pass for screen/balanced → keep smallest → never exceed original (returns original with `changed:false`). Small files (<1 MB) get a "may not shrink" note.
- **PDF Editor** (`components/tools/EditorTool.tsx`): fabric.js overlay on a pdfjs-rendered page image; annotations stored per page as fabric JSON; undo/redo via JSON snapshots; sticky note = editable `Textbox`; export stamps per-page PNG overlays onto the original via `lib/pdf/editorExport.ts` (preserves underlying text).
- **Rotate** (`components/tools/RotateTool.tsx`): thumbnail strip (low-scale pdfjs render) with per-page selection (Ctrl/Cmd multi; none = all) and live CSS-rotate preview; bakes via `rotatePages`.

## Two-process topology (sprint 5-6)
- **Next.js — :3000** — pages + Better Auth handler (`app/api/auth/[...all]/route.ts`) +
  DB-backed server components. Owns `lib/db` (Drizzle) and `lib/auth` (Better Auth).
- **Elysia backend — :8080** (`server/index.ts`, run via `bun run server`) — Gotenberg
  proxy, Gemini proxy, Upstash rate limiting, Lemonsqueezy checkout + webhook. CORS allows
  the Next origin with credentials. Routes: `/api/health`, `/api/convert/*`,
  `/api/ai/summarize`, `/api/billing/checkout`, `/api/webhooks/lemonsqueezy`.
- **Gotenberg — :3001** (docker-compose) — LibreOffice container.
- Frontend → backend via `lib/api.ts` (`NEXT_PUBLIC_API_URL`, always `credentials:"include"`).

## Auth (Better Auth)
- `lib/auth/index.ts` — Drizzle adapter (explicit plural-table map), email+password + Google
  OAuth, a custom `user.plan` additional field (`free|pro`, `input:false`, set by billing).
- Shared by both processes; the backend validates the cookie with `auth.api.getSession`.
  Client helpers in `lib/auth/client.ts` (`useSession`, `signIn/up/out`). `NavAuth` renders
  the avatar/dropdown + a PRO badge when `plan==="pro"`.

## Database (Drizzle + Supabase Postgres)
- `lib/db/schema.ts` — `users` (+`plan`), Better Auth `sessions/accounts/verifications`,
  `subscriptions`, `file_history`, `usage_counters`.
- `lib/db/index.ts` — `postgres-js` over the Supabase **Session pooler** (IPv4),
  `prepare:false`, small capped pool, `globalThis`-cached across HMR (see decisions.md/bugs.md).
- Migrations: `scripts/db.ts` (`bun run db:generate|push`) forwards Bun-loaded env to drizzle-kit.

## Server-side processing
- **PDF↔Word** (`server/routes/convert.ts`): Word→PDF via Gotenberg HTTP
  (`server/services/gotenberg.ts`); PDF→Word via `docker exec` LibreOffice
  (`server/services/libreoffice.ts`). Optional R2 store (`server/services/r2.ts`, 24h TTL marker).
- **AI Summarize** (`server/routes/ai.ts`): pdfjs-dist legacy build extracts text server-side
  (`server/services/pdftext.ts`) → Gemini 2.5 Flash (`server/services/gemini.ts`) → executive
  / outline / per-section JSON. Auth required; scanned-PDF guard runs before quota.

## Rate limiting (`lib/ratelimit.ts`, Upstash)
- Fixed-window limiters: IP 3 server-tools/day · user 10 server-tools/day · user 2 AI/30d;
  Pro bypasses. `checkServerTool`/`checkAi` enforce; `remaining*` feed the dashboard.

## Billing (Lemonsqueezy)
- `server/services/lemonsqueezy.ts` (raw fetch) — `createCheckout` (tags `custom_data.user_id`),
  `verifyWebhook` (HMAC-SHA256). `server/routes/billing.ts` — checkout (auth-gated) + webhook
  that flips `users.plan` and upserts `subscriptions`. Pro CTA wired in `PlanCard.tsx`.

## Dashboard (`app/[locale]/dashboard/page.tsx`)
- Auth-guarded server component: no session → redirect `/login`. Reads real `users.plan`,
  recent `file_history`, and live usage; purges old history (7d Free / 30d Pro) on load.
  Free and Pro variants branch on `plan`.

## Production topology — LIVE (since 2026-06-04)

```
                     Cloudflare DNS (plinypdf.com)
  plinypdf.com / www ──(proxied)──► Vercel ─ Next.js frontend (own TLS)
  api.plinypdf.com ──(A, DNS-only)─► Hetzner ─ Caddy :443 (Let's Encrypt)
                                                 └► Bun/Elysia backend :8080
                                                      └► Gotenberg 127.0.0.1:3001 (Docker)
```

### Frontend — Vercel
- Project `pliny-pdf`, custom domains `plinypdf.com` + `www.plinypdf.com` (both serve;
  301 www→apex is an optional future cleanup). Auto-deploys from `origin/main`.
- Key env (Production): NEXT_PUBLIC_API_URL=https://api.plinypdf.com,
  BETTER_AUTH_URL=https://plinypdf.com, COOKIE_DOMAIN=.plinypdf.com,
  TRUSTED_ORIGINS=https://plinypdf.com,https://api.plinypdf.com,
  NEXT_PUBLIC_SITE_URL=https://plinypdf.com,
  NEXT_PUBLIC_POSTHOG_KEY + NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com,
  NEXT_PUBLIC_SENTRY_DSN.
  > `NEXT_PUBLIC_*` vars are inlined at build time — after changing one, redeploy
  > **without build cache** or the bundle keeps the old (often undefined) value.

### Backend — Hetzner CPX21 (49.13.119.27, Falkenstein, Ubuntu 24.04)
- Caddy: reverse proxy on :443, auto-issued Let's Encrypt cert for api.plinypdf.com
  (config from deploy/Caddyfile → /etc/caddy/Caddyfile). Proxies → localhost:8080.
- Bun/Elysia backend: port 8080, systemd managed (auto-restart on crash/boot)
  - Service file: /etc/systemd/system/plinypdf-backend.service
  - Working dir: /opt/pliny_pdf · Env: /opt/pliny_pdf/.env.local
  - Restart: systemctl restart plinypdf-backend · Logs: journalctl -u plinypdf-backend -f
  - Prod env: FRONTEND_ORIGIN + TRUSTED_ORIGINS list apex+www; COOKIE_DOMAIN=.plinypdf.com;
    SENTRY_DSN set (backend error capture via Elysia .onError).
- Gotenberg: 127.0.0.1:3001 (Docker, localhost-only, LibreOffice + Chromium)
- UFW firewall: 22/80/443 open, 8080/3001 internal only

### Cross-subdomain auth
Cookie set on plinypdf.com with Domain=.plinypdf.com reaches api.plinypdf.com because they share eTLD+1.
Config: COOKIE_DOMAIN=.plinypdf.com in both Vercel and Hetzner .env.local.
Without this: auth breaks on the Vercel URL (*.vercel.app ≠ api.plinypdf.com).

### CORS / redirects with multiple frontend origins
FRONTEND_ORIGIN is a comma-separated list (apex + www). The backend splits it:
`server/index.ts` passes the array to `@elysiajs/cors` (a single joined string matches
no Origin and drops the CORS header); `server/routes/billing.ts` uses the first
(canonical) origin for the Lemonsqueezy `redirect_url` (a joined string is not a valid URL).

### Error tracking — Sentry (EU region)
- Frontend: @sentry/nextjs — instrumentation.ts (server/edge register + onRequestError),
  instrumentation-client.ts (browser init), sentry.{server,edge}.config.ts; next.config.ts
  wrapped with withSentryConfig. DSN via NEXT_PUBLIC_SENTRY_DSN.
- Backend: @sentry/bun — Sentry.init + Elysia .onError capture hook. DSN via SENTRY_DSN.
- All init DSN-gated (enabled: !!dsn) → no-op locally. EU project (ingest.de.sentry.io).

### Blog system
- Posts: content/blog/*.md (gray-matter frontmatter)
- Parser: lib/blog.ts (getAllPosts, getPost)
- Renderer: markdown-to-jsx
- Routes: app/[locale]/blog/page.tsx (index) + app/[locale]/blog/[slug]/page.tsx
- SSG: generateStaticParams over slugs × locales at build time
- 5 posts in content/blog/, all EN body

### OG image generation
- Route: app/api/og/route.tsx (next/og ImageResponse)
- Size: 1200×630
- Params: ?title=...&description=...
- Wired to metadata.openGraph.images on all tool + content pages

### PostHog analytics
- Provider: components/analytics/PostHogProvider.tsx (client component)
- No-op when NEXT_PUBLIC_POSTHOG_KEY is absent
- Events: tool_used, signup_completed, upgrade_clicked, checkout_opened
- Wired at: all 13 tool components, AuthForm, PlanCard

### Updating the backend after code changes
1. git push origin main (local machine)
2. SSH: ssh root@49.13.119.27
3. cd /opt/pliny_pdf && git pull origin main
4. bun install (if package.json changed)
5. systemctl restart plinypdf-backend
6. curl http://localhost:8080/api/health (verify)
