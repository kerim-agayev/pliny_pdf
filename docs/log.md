# PlinyPDF — Log

Append-only chronological record. One line per meaningful task (CLAUDE.md §4.4).

## [2026-08-04] Pre-handoff cleanup — removed dead Lemonsqueezy billing + Gemini AI Summarize code
Both were UI-unreachable since the Phase 7 "hide, don't delete" decisions (D7-1/D7-4). Deleted backend
routes/services, orphaned frontend components, the AI rate limiters, the tools.ts catalog entry, and the
`LEMONSQUEEZY_*`/`GEMINI_*` env vars from `.env.local`/`.env.example`, so the incoming owner isn't stuck
configuring paid accounts for features with no UI. `users.plan`/`subscriptions` schema kept (still used
by the anon/free limit system). See `docs/decisions.md`.

## [2026-06-04] 🚀 Domain launch — plinypdf.com LIVE, Phase 1 COMPLETE
plinypdf.com purchased on Cloudflare; all deferred Phase 1 items shipped. Phase B7-8: `api` A record (DNS-only) + Caddy installed on Hetzner, Let's Encrypt SSL auto-issued (https://api.plinypdf.com/api/health green). Phase C: Vercel frontend live with custom domains apex+www, prod env set (API URL, BETTER_AUTH_URL, COOKIE_DOMAIN, TRUSTED_ORIGINS, SITE_URL), Hetzner .env.local updated + restarted, Google OAuth redirect/origin added, Lemonsqueezy webhook → api.plinypdf.com (stays TEST mode). Analytics: PostHog activated (EU region, NEXT_PUBLIC_POSTHOG_HOST=eu.i.posthog.com). Sentry added (was deferred): frontend @sentry/nextjs (instrumentation + instrumentation-client + server/edge configs + withSentryConfig) and backend @sentry/bun (Sentry.init + Elysia .onError), all DSN-gated, EU project. Bugs fixed during launch: (1) CORS — `@elysiajs/cors` got the comma-joined FRONTEND_ORIGIN (apex+www) as one string → split to array; (2) Lemonsqueezy redirect_url was the comma-joined origin → use first canonical origin; (3) Sentry "no events" was a build-cache/inlining + console-throw test-method red herring, verified via on-load captureMessage then reverted. GATE C: full incognito e2e all 11 checks green (home, Merge local, email signup, Google OAuth, PDF→Word, AI Summarize, test-card Pro upgrade, /en /tr /ru, api health, PostHog events, Sentry capture). Commits a8d6e84 (Sentry) → a284356 (CORS) → 18425f6 (checkout) → diagnostics → eb592ff (revert) on origin/main. Next: ProductHunt/Show HN/Reddit launch (deploy/LAUNCH.md); switch Lemonsqueezy to live before real payments.

## [2026-06-02] 28-tool local test ortamı kuruldu
Lokalde 28 tool'u tek tek test etmek için stack ayağa kaldırıldı: Docker→Gotenberg (:3001, LibreOffice 26.2), `bun run server` (:8080), `bun run dev` (:3000); `NEXT_PUBLIC_API_URL` test için localhost'a çevrildi (commit edilmeyecek). Çözülen sorunlar: (1) CORS "Failed to fetch" — frontend prod Hetzner backend'e bakıyordu, local backend'e çevrildi; (2) 429 rateLimited — anonim "local" IP kotası + Upstash bellek-içi cache, Redis key sil + backend restart ile çözüldü. word-to-pdf & pdf-to-word uçtan uca doğrulandı (200). OCR atlandı (ocrmypdf yok). Detay: `docs/28_tool_testing/`.

## [2026-05-29] Sprint 1-2 Foundation complete
Bootstrapped `pliny_pdf/`: Next.js 16 + Tailwind 4 + shadcn/ui (button, badge, tooltip) + next-intl (en/tr/ru) + design tokens (#6B5CE7 brand, #10B981 local, #3B82F6 cloud) + Plus Jakarta Sans + JetBrains Mono + docker-compose (Gotenberg) + .env.example + placeholder Navbar/Footer/PrivacyBadge/LocaleSwitcher. Memory files moved into `docs/`. First commit on `main`. Cloudflare Pages connection deferred to the user. Verified `bun dev` renders `/en`, `/tr`, `/ru` with localized strings.

## [2026-05-31] Sprint 5-6 Premium Tools + Backend + Billing complete
Built the cloud half of the product across 5 user-gated phases. Backend: Bun + Elysia on :8080 (CORS w/ credentials, shared Better Auth). DB: Drizzle + Supabase (Session pooler, IPv4) — `users/sessions/accounts/verifications/subscriptions/file_history/usage_counters`; migrations via `scripts/db.ts`. Auth: Better Auth email+password + Google OAuth, custom `plan` field. Cloud tools: Word→PDF (Gotenberg HTTP), PDF→Word (`docker exec` LibreOffice `writer_pdf_import`), optional R2 storage. AI: pdfjs-dist server extract → Gemini 2.5 Flash → executive/outline/per-section (auth-gated, scanned-PDF guard before quota). Rate limits: Upstash fixed-window (anon 3/day, free 10/day + 2 AI/30d, Pro unlimited). Billing: Lemonsqueezy raw-fetch checkout (variant IDs in `LEMONSQUEEZY_PRODUCT_*`) + HMAC webhook flipping `users.plan` (verified end-to-end via localtunnel). Dashboard: auth-guarded server component with real Free/Pro variants, live usage, file-history cleanup (7d/30d), PRO badge in navbar, "Current plan" on pricing. GATES 1-5 all confirmed by the user. Bugs fixed: Supabase pooler connection exhaustion (capped pool + globalThis HMR reuse — had broken all auth), kysely/Turbopack override, Gemini model selection, env/IPv6 drizzle-kit, and GATE-5 dashboard polish (empty-state privacy message, navbar scroll jolt, sidebar links, FREE badge visibility). See `docs/bugs.md`.

## [2026-05-31] Sprint 7-8 Phase A: production deploy artifacts + cross-subdomain auth
Made the app domain-aware (surgical, localhost defaults preserved): `lib/auth/index.ts` env-driven `trustedOrigins` + `crossSubDomainCookies` (`COOKIE_DOMAIN`); new `docker-compose.prod.yml` (Gotenberg bound to 127.0.0.1, fixed container name); `deploy/` (systemd unit, Caddyfile, full runbook). `.env.example` documents `COOKIE_DOMAIN`/`TRUSTED_ORIGINS`. Verified `bun run build` + backend boot with defaults. Commit c28a940.

## [2026-05-31] Phase B (Hetzner backend) steps 1-6 complete
Steps 7-8 (DNS + Caddy SSL) blocked pending domain purchase (plinypdf.com). Backend healthy at http://49.13.119.27:8080 internally. Done on server 49.13.119.27 (CPX21, Falkenstein): Docker/Git/Bun installed, repo cloned to /opt/pliny_pdf + bun install, prod .env.local set, Gotenberg up via docker-compose.prod.yml (127.0.0.1:3001, both engines healthy), Bun/Elysia backend under systemd (active, /api/health OK), UFW 22/80/443 only.

## [2026-05-31] Sprint 7-8 domain-independent launch work (Tasks 1-6) complete
Built the launch surface that ships now and goes live the moment the domain is wired. (2) Real content: About/Privacy(GDPR+KVKK)/Terms via shared `LegalShell` (titles/headings localized EN/TR/RU, legal bodies EN v1) + markdown blog (gray-matter + markdown-to-jsx, `lib/blog.ts`, index + `[slug]` SSG) with 5 SEO posts (locale-prefixed internal links). (3) SEO: `lib/seo.ts` (SITE_URL + pageMetadata canonical/hreflang/OG), `app/sitemap.ts` (~75 URLs, hreflang), `app/robots.ts`, `app/api/og` dynamic 1200×630 image, JSON-LD (SoftwareApplication on /tools, per-tool FAQ+HowTo, BlogPosting), metadataBase. (4) PostHog: provider (no-op without `NEXT_PUBLIC_POSTHOG_KEY`) + `lib/analytics.ts`; events tool_used (all 13 tools), signup_completed, upgrade_clicked, checkout_opened; Sentry deferred. (5) Mobile: `components/shared/MobileNav.tsx` hamburger (rest already 375px-clean). (6) `deploy/LAUNCH.md` (ProductHunt/Show HN/Reddit + checklist). Commits c28a940→4f3f400; each `bun run build` verified green. Deferred (need domain/keys): Phase B7-8 + Phase C, PostHog key, Lemonsqueezy go-live decision.

## [2026-05-31] Sprint 7-8 domain-independent work complete

Tasks completed:
- Task 1: docs updated with Hetzner deploy state + domain deferral
- Task 2: About/Privacy/Terms real content + 5-post markdown blog
- Task 3: SEO — sitemap (75 URLs), robots.txt, OG images, FAQ/HowTo/SoftwareApplication JSON-LD, canonicals + hreflang
- Task 4: PostHog wired (no-op without key)
- Task 5: Navbar hamburger menu for mobile; rest already 375px-clean
- Task 6: deploy/LAUNCH.md — ProductHunt/Show HN/Reddit drafts

Commits on origin/main: a106a47 → 603ae40 (8 commits)

Blocked (domain required):
- Phase B step 7: Cloudflare DNS api.plinypdf.com A record
- Phase B step 8: Caddy install + SSL
- Phase C: Vercel deploy + custom domain
- Google OAuth redirect URI update
- Lemonsqueezy webhook URL update
- PostHog key activation
- Sentry setup
- GATE 2 full e2e test

Backend healthy: http://49.13.119.27:8080/api/health
