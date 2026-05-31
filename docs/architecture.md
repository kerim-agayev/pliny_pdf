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
