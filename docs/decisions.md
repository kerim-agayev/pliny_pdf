# PlinyPDF — Technical Decisions

> Decisions made and their REASONS. Claude Code reads this when a "why?" question comes up,
> so the same decision is not re-debated.

## Drizzle ORM (not Prisma)
The user previously used Prisma + NeonDB. For PlinyPDF, Drizzle was chosen because:
- Fully compatible with Cloudflare Pages/Workers edge (Prisma's binary engine is problematic at the edge)
- Smaller bundle (~300KB vs Prisma ~50MB)
- Faster cold start
- SQL-like syntax, easy for someone who knows Prisma

## Supabase (DB + Auth + Storage all in one)
- Free tier is enough for Phase 1 (500MB DB, 50K MAU auth)
- Standard Postgres
- User's own free account for now, can later move to the company account

## Cloudflare R2 (not S3)
- Free egress (expensive on S3)
- Free tier 10GB
- User's personal account for now, will later move to the company Cloudflare account (only .env changes)

## Gemini Flash (not Anthropic/OpenAI — for Phase 1 AI)
- Free tier: 1500 requests/day — far exceeds Phase 1's expected ~1600 summaries/month
- Cost $0 (throughout Phase 1)
- Quality is sufficient for summarization
- Phase 2 will add WebLLM (in-browser AI) for the privacy story
- NOTE: Free tier may use data for training; for the privacy-first brand, Pro user data will later be routed to a paid tier

## Paddle (not Stripe — for Phase 1 billing)
- Merchant of Record: handles VAT/tax automatically (manual on Stripe)
- Already set up in the user's previous projects
- Suitable for international sales
- Local payments (iyzico/m10/Kaspi) will be added in Phase 2


> **NOTE (Phase 1 update):** Paddle Sandbox authentication is broken —
> "Too many incorrect login attempts" error on multiple accounts (known Paddle issue).
> Switched to **Lemonsqueezy** for Phase 1 testing:
> - Same MoR advantages (automatic VAT/tax)
> - Easier setup, working test mode
> - Store: plinypdf.lemonsqueezy.com (#392550)
> - Products: PlinyPDF Pro Monthly + Yearly
> May return to Paddle when their Sandbox is fixed.
>
> **Env var naming (actual):** the checkout reads `LEMONSQUEEZY_PRODUCT_MONTHLY_ID`
> / `LEMONSQUEEZY_PRODUCT_YEARLY_ID` — despite the `PRODUCT` name these hold
> **variant** IDs (1725432 monthly, 1725446 yearly) and are passed straight to the
> checkout `variant` relationship. Also `LEMONSQUEEZY_API_KEY`, `_STORE_ID`,
> `_WEBHOOK_SECRET`. (Some early notes said `LEMONSQUEEZY_VARIANT_*`; the code uses
> `_PRODUCT_*`.) No SDK — we call the REST API with `fetch` (same pattern as
> gemini.ts/gotenberg.ts). Webhook auth = HMAC-SHA256 of the raw body vs `X-Signature`.

## Bun + Elysia (not Node + Express)
- Matches the user's existing stack experience (goqrcodegenerator)
- Fast, modern, TypeScript-native

## Two-process split: Next.js (:3000) + Elysia backend (:8080)
- **Next.js** owns pages, Better Auth handler (`app/api/auth/[...all]`), and DB-backed
  server components (dashboard). **Elysia** owns the heavy/secret work: Gotenberg proxy,
  Gemini proxy, Upstash rate limiting, Lemonsqueezy checkout + webhook.
- Why split: production hosting splits them — frontend on Cloudflare Pages (can't run the
  Gotenberg proxy / heavy pdfjs extraction), backend on Hetzner beside the Gotenberg
  container. Gotenberg keeps :3001 (docker-compose); backend uses :8080 to avoid the clash.
- **Cross-process session sharing:** both import the same Better Auth instance
  (`lib/auth/index.ts`) + share `BETTER_AUTH_SECRET` and the Supabase DB. The browser sends
  `credentials: "include"` (via `lib/api.ts`); CORS echoes the exact origin with
  `Access-Control-Allow-Credentials`. The backend validates with
  `auth.api.getSession({ headers })` and resolves `users.plan` for rate limits.

## Postgres connection pooling (Supabase pooler limits)
- Connect via the Supabase **Session pooler** host (IPv4; the direct host is IPv6-only).
- `postgres-js` is configured `prepare: false` (PgBouncer can't do prepared statements),
  `max: 5`, `idle_timeout: 20s`, `max_lifetime: 30m`, and the client is cached on
  `globalThis` so Next dev HMR reuses it. Session mode caps total clients at 15 — without
  these limits the pool leaked and exhausted it, breaking auth (see `docs/bugs.md`).

## PDF→Word via `docker exec` (not the Gotenberg HTTP API)
- Gotenberg's LibreOffice HTTP route only outputs **PDF**. So Word→PDF uses the HTTP API,
  but PDF→Word shells into the same container: `soffice --headless
  --infilter=writer_pdf_import --convert-to docx`. One container, two code paths.

## Rate-limit tiers (Upstash fixed-window)
- Anonymous (IP key): 3 server-tool runs/day, no AI. Free account: 10 server-tool runs/day
  + 2 AI summaries/30d. Pro: bypass (unlimited). Logged-in keys use the user id; the same
  limiter's `getRemaining` feeds the Free dashboard's usage bars.

## File history records cloud tools only (privacy)
- `file_history` rows are written **only** for cloud tools (PDF↔Word, AI Summary) and only
  for logged-in users. Local in-browser tools are never recorded — that is the core privacy
  claim. The dashboard empty state states this explicitly so an empty list isn't read as a
  bug. Cleanup: rows older than 7d (Free) / 30d (Pro) are purged on dashboard load.

## Gotenberg (Docker) — for PDF ↔ Word
- The only sensible way that requires the LibreOffice engine
- Can't be done in-browser (won't fit in WASM, heavy operation)
- Docker is already installed on the user's machine, so local dev is easy
- The same container runs on Hetzner in production

## Hetzner CPX21 (backend hosting)
- Cloudflare Pages only runs the frontend; it can't run the Gotenberg Docker container
- CPX21 (€4.59/mo) is enough for the Phase 1 load (1K MAU, ~50-100 conversions/day)
- Upgrade to CPX31 if it grows

## Privacy-first + AI-native hybrid positioning
- Not "regional" or "developer-first" alone
- Local processing (privacy) + optional AI (value) together
- What BentoPDF can't do: AI + product feel + Pro subscription model
- What iLovePDF/Smallpdf can't do: genuine local processing

## Starting with 12 tools (not copying BentoPDF's 100+ tools)
- 80/20: 80% of traffic goes to ~10 tools
- Few but sharp, premium feel
- Expanded in Phase 2

## Memory pattern (Obsidian + docs/)
- To prevent Claude Code from reading thousands of lines as the project grows
- index.md → drill-down pattern saves ~90% tokens
- Obsidian is optional (visual navigation only); the system works without it

## docs/ folder inside the project (Option B)
- Claude Code finds the memory in its own working directory (no path issues)
- Committed to git, versioned
- Next.js does not include it in the build (only app/, public/ are included)
- NOTE: This is a Next.js project, not Unity — an in-project docs/ folder is safe

## Sprint 7-8 decisions

### Domain purchase deferred
User decided to defer plinypdf.com purchase until stakeholders approve the product. Consequence:
- Phase B steps 7-8 (Cloudflare DNS + Caddy SSL) blocked
- Phase C (Vercel deploy + domain wiring) blocked
- Auth-dependent features broken without domain: AI Summarize, Pro checkout, rate-limited cloud tools
- Local tools + anonymous PDF↔Word work without domain
- All blocked steps documented in deploy/README.md

### PostHog key deferred
PostHog is wired into all 13 tools + signup/upgrade/checkout events but runs as no-op until `NEXT_PUBLIC_POSTHOG_KEY` is set.
Build does NOT break without the key.
Add the key to Vercel env when deploying — never hardcode.
Events tracked: tool_used, signup_completed, upgrade_clicked, checkout_opened.

### Sentry deferred entirely
Sentry was skipped this sprint. Reason: no production environment exists yet (no domain, no Vercel deploy). Sentry catches production errors — meaningless before go-live. Add after domain is wired and Vercel is deployed. Use `@sentry/nextjs` + `SENTRY_DSN` env var.

### Blog post bodies EN-only for v1
Blog post bodies are English only. Only UI chrome (title/subtitle/"min read" label) is translated to TR/RU. Localize post bodies in Phase 2 if needed.

### Lemonsqueezy stays in test mode
Do NOT switch to live mode without explicit user confirmation.
Test cards work: 4242 4242 4242 4242 (any future date, any CVV).
Switch to live mode only at actual public launch.

## Domain launch decisions (2026-06-04)

> These supersede the "deferred" notes above — domain is purchased and prod is live.

### Domain purchased — plinypdf.com on Cloudflare
Bought and managed on Cloudflare. `api` is an A record → 49.13.119.27, **DNS-only (grey
cloud)** so Caddy can complete the ACME challenge and own TLS; the apex + www records are
proxied (orange) and point at Vercel, which terminates their TLS. Phase B7-8 + Phase C
executed per `deploy/README.md`; GATE C (full e2e) passed.

### PostHog — EU region
`NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com` (key in Vercel). The provider defaults
to the US host, so the EU host MUST be set explicitly. Chosen for EU data residency,
consistent with the Sentry EU project.

### Sentry — frontend + backend, manual config, EU project
Added now that prod exists (was deferred). Frontend `@sentry/nextjs`, backend `@sentry/bun`.
Configured **manually**, not via `npx @sentry/wizard`: the wizard is interactive and not
reliable on Next.js 16 + Bun in this environment. All `Sentry.init` is DSN-gated
(`enabled: !!dsn`) so local dev / CI builds stay no-op. Frontend DSN is
`NEXT_PUBLIC_SENTRY_DSN` (inlined at build → redeploy without cache after changing it);
backend DSN is `SENTRY_DSN`. One EU project covers both for Phase 1 (can split later).
Gotcha learned: a `throw` typed in the DevTools console does not reach `window.onerror`,
so it is NOT a valid Sentry test — use `Sentry.captureException/captureMessage` or a real
in-app error.

## Lemonsqueezy + Gemini AI Summarize removed entirely (2026-08-04, pre-handoff)
Both were UI-unreachable dead code (Phase 7 hid them, D7-1/D7-4 in `docs/phase_7/decisions.md`,
without deleting — "potential re-launch in Phase 8"). Project is being handed off to a new
owner; keeping the code would force them to sign up for/pay a Lemonsqueezy account and
provision a Gemini API key for features with zero UI entry point. Deleted: `server/routes/{billing,ai}.ts`,
`server/services/{lemonsqueezy,gemini}.ts`, `components/marketing/{PlanCard,PricingClient}.tsx`
(already-orphaned), `components/tools/SummarizeTool.tsx`, `app/[locale]/summarize/`, the
`checkAi`/`remainingAi` rate limiters, the `summarize` entry in `lib/tools.ts`, the NavAuth PRO
badge, and the `LEMONSQUEEZY_*`/`GEMINI_*` env vars. Left untouched: `users.plan` +
`effectivePlan()` (still power the anon/free two-tier limit system) and the `subscriptions`
DB table (dropping it needs a migration; harmless to leave). If either feature is wanted again,
it needs to be rebuilt from git history, not un-hidden.

### Multi-origin CORS + checkout redirect (apex + www)
Serving both apex and www made `FRONTEND_ORIGIN` a comma-separated list, which broke two
single-string assumptions: `@elysiajs/cors` matched no Origin (dropped the CORS header),
and the Lemonsqueezy `redirect_url` became an invalid comma-joined URL. Fix: backend splits
`FRONTEND_ORIGIN` — array → cors, first (canonical) origin → checkout redirect. If we later
301 www→apex, `FRONTEND_ORIGIN` can collapse back to a single origin (handling stays safe).
