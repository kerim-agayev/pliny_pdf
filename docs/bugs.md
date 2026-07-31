# PlinyPDF — Bugs Log

Discovered bugs and their resolutions. Read this when working on related code
to avoid re-discovering known issues.

---

## [2026-05-30] BUG: ThemeProvider script-tag warning + theme hydration

- **Where:** `components/shared/ThemeProvider.tsx`, `app/[locale]/layout.tsx`
- **Symptom:** Console error "Encountered a script tag while rendering React component" on language change and when visiting `/tools`.
- **Root cause:** `next-themes` 0.4.6 renders its theme `<script>` inside `<body>` (the memoized script component in `node_modules/next-themes/dist/index.js`). React 19 warns when a `<script>` is rendered in the component tree on client re-render (it won't execute).
- **Fix:** Removed `next-themes`. Custom `ThemeProvider` (React context) toggles the `.dark` class + persists to `localStorage`. Anti-FOUC handled by a server-rendered inline `<script>` in `<head>` (runs once, never re-rendered client-side, no flash). `ThemeToggle` now uses the custom `useTheme()`.
- **Commit:** fix: resolve ThemeProvider hydration + script tag warnings

## [2026-05-30] BUG: hydration mismatch from browser extension

- **Where:** `app/[locale]/layout.tsx`
- **Symptom:** Hydration error on `/tr/pricing` — `<body>` got `cz-shortcut-listen="true"` injected by a browser extension (ColorZilla).
- **Root cause:** Extensions mutate the DOM before React hydrates; the server HTML lacks the attribute.
- **Fix:** Added `suppressHydrationWarning` to `<body>` (already present on `<html>`). Standard fix for extension-injected attributes.
- **Commit:** fix: resolve ThemeProvider hydration + script tag warnings

## [2026-05-30] BUG: Compress PDF made files larger

- **Where:** `lib/pdf/compress.ts`, `components/tools/CompressTool.tsx`
- **Symptom:** 615 KB PDF → 1767 / 3163 / 5784 KB across presets (always bigger).
- **Root cause:** Every page was rasterized to JPEG, then rebuilt. For text/vector PDFs a JPEG of the page is far larger than the source content.
- **Fix:** Decision tree that can never inflate: (1) always try lossless `save({ useObjectStreams: true })`; (2) for screen/balanced also try rasterization, keep only if smaller; (3) pick the smallest; if nothing beats the original, return the original with `changed: false` and show "Already optimized — original kept". <1 MB files show a "may not shrink" note.
- **Commit:** fix: smart Compress PDF logic (skip already-optimized files)

## [2026-05-30] BUG: sticky note couldn't accept text in PDF Editor

- **Where:** `components/tools/EditorTool.tsx` (sticky branch of `onMouseDown`)
- **Symptom:** Sticky note placed a shape but clicking it didn't open a text input.
- **Root cause:** Sticky was a `fabric.Group([Rect, Textbox])`; grouped text isn't directly editable.
- **Fix:** Sticky is now a single editable `fabric.Textbox` styled as a note (`backgroundColor: "#FACC15"`, padding). It calls `enterEditing()` on creation; double-click re-edits (same built-in behavior as the working Text tool).
- **Commit:** fix: sticky note text input in PDF Editor

---

## [2026-05-31] BUG: all auth broke — Supabase pooler connection exhaustion (Sprint 5-6)

- **Where:** `lib/db/index.ts`
- **Symptom:** Suddenly every sign-in/sign-up (email **and** Google) returned HTTP 500. Dev log: `PostgresError (EMAXCONNSESSION) max clients reached in session mode - max clients are limited to pool_size: 15` on `verifications`/`users` queries.
- **Root cause:** `postgres-js` was created with no `max`, so each process opened up to 10 connections; Next dev **HMR re-evaluates the module on every hot reload**, leaking a fresh pool each time without closing the old one. Two processes (Next + Elysia) plus the HMR leak blew past Supabase's session-pooler 15-client cap, after which no query (including auth) could run.
- **Fix:** Cap the pool (`max: 5`, `idle_timeout: 20`, `max_lifetime: 1800`) and cache one client on `globalThis` so HMR reuses it instead of leaking. Restart both processes once to drop the already-leaked connections.
- **Commit:** fix: cap Postgres pool + reuse client across HMR

## [2026-07-31] BUG: Google Login (and all DB-dependent routes) 500 — Supabase project auto-paused

- **Where:** Infra (Supabase project `plinypdf`, ref `zllhtqzlzmrxeerpoyuk`) — not a code bug.
- **Symptom:** `POST /api/auth/sign-in/social` (Google login) returned 500. Worked before, stopped without any deploy. Error: `ENOTFOUND tenant/user postgres.zllhtqzlzmrxeerpoyuk not found`.
- **Root cause:** Supabase free tier auto-pauses a project after a period of inactivity. The whole database was offline, so the pooler couldn't resolve the tenant — not a credentials or code issue. Any DB-dependent route (auth, dashboard, saved file history) would have failed the same way.
- **Fix:** Resumed the project from the Supabase dashboard. No code change.
- **Risk / recommendation:** This can recur silently on the free tier and takes down auth + dashboard with no warning. Upgrade to Supabase Pro to disable auto-pause, or add a keepalive ping, if staying on free tier. `server/routes/health.ts`'s `/api/health` now also checks DB connectivity (`select 1`, returns 503 on failure) so this shows up on a health check instead of only when a user hits login.

## [2026-05-31] KNOWN LIMITATION: Lemonsqueezy webhook needs a tunnel in local dev

- **Where:** `server/routes/billing.ts` (`POST /api/webhooks/lemonsqueezy`)
- **Symptom:** A test purchase succeeds on Lemonsqueezy but `users.plan` stays `free` in Supabase.
- **Root cause:** Lemonsqueezy can't reach `localhost` to deliver the webhook, so the plan-flip never fires.
- **Fix / workaround:** Run `npx localtunnel --port 8080` (or ngrok) and set the LS webhook URL to `https://<tunnel>/api/webhooks/lemonsqueezy` (with `LEMONSQUEEZY_WEBHOOK_SECRET`) before testing upgrades. **Not a code bug** — works automatically in production (Hetzner has a real public URL). To unblock local testing without a tunnel, flip `users.plan` manually in Supabase.

## [2026-05-31] BUG: Gotenberg HTTP API can't produce Word (PDF→Word)

- **Where:** `server/services/gotenberg.ts` / `server/services/libreoffice.ts`
- **Symptom:** The LibreOffice HTTP route always returns a PDF, never a `.docx`, so PDF→Word couldn't work over the HTTP API.
- **Root cause:** Gotenberg's `/forms/libreoffice/convert` only outputs PDF.
- **Fix:** Word→PDF stays on the Gotenberg HTTP API; **PDF→Word** runs LibreOffice directly inside the same container via `docker exec ... soffice --headless --infilter=writer_pdf_import --convert-to docx`.
- **Commit:** feat: PDF<->Word tools via Gotenberg

## [2026-05-31] BUG: Gemini model 404/429 (free-tier model availability)

- **Where:** `server/services/gemini.ts`
- **Symptom:** `gemini-1.5-flash` → 404 (not in v1beta for this key); `gemini-2.0-flash` → 429 (daily quota exhausted on the user's key).
- **Fix:** Default `GEMINI_MODEL` to `gemini-2.5-flash` (returns 200 on the user's key); overridable via env.

## [2026-05-31] BUG: kysely export break under Turbopack build

- **Where:** transitive dep of Better Auth (`@better-auth/kysely-adapter` bundled kysely@0.29.2)
- **Symptom:** Turbopack hard-failed: `Export DEFAULT_MIGRATION_LOCK_TABLE doesn't exist`. (Bun tolerated it; Turbopack didn't.) We never import kysely ourselves.
- **Fix:** Pin via `"overrides": { "kysely": "0.28.17" }` in package.json (that version still exports the constant); cleared `.next` cache.

## [2026-05-31] BUG: drizzle-kit couldn't read DATABASE_URL (env + IPv6)

- **Where:** `scripts/db.ts`, `.env.local`, `drizzle.config.ts`
- **Symptom:** `db:push` failed with `ENOTFOUND` then "DATABASE_URL not set".
- **Root cause:** (1) Supabase **direct** host is IPv6-only (no A record) on the user's IPv4 network; (2) Bun doesn't forward its loaded `.env.local` to a spawned `drizzle-kit` child, and the file is UTF-16.
- **Fix:** Use the Supabase **Session pooler** host (IPv4); run drizzle-kit through `scripts/db.ts` (run by `bun run`, which loads `.env.local` into `process.env`, forwarded via `spawnSync env`).

## [2026-05-31] Dashboard polish bugs found at GATE 5 (all fixed)

- **Where:** `app/[locale]/dashboard/page.tsx`, `components/shared/NavAuth.tsx`, `components/marketing/{PlanCard,ToolsCatalog}.tsx`, `app/[locale]/tools/page.tsx`
- **Bugs & fixes:**
  1. **Recent activity looked broken when empty** — local tools are intentionally never recorded (privacy), so a user who only ran local tools saw an unexplained empty list. Now the empty state explains it: "Local tools don't appear here — your files never touch our servers. Only cloud tools (PDF↔Word, AI Summary) are recorded."
  2. **Navbar avatar click jolted the page scroll** — the trigger `<button>` grabbed focus in the sticky header. Fixed with `onMouseDown`/`onClick` `preventDefault`.
  3. **Sidebar items weren't links** — `SideItem` rendered a `<div>`. Now renders `<Link>`: Library → `/dashboard`/`/tools`; categories → `/tools?category=<Cat>` (the tools page reads `searchParams.category` to pre-select the filter).
  4. **FREE badge invisible** — base `.pp-badge` (muted `--line-3`/`--text-2`) was too low-contrast; gave the Free badge an explicit visible chip style.
- **Commit:** feat: Dashboard (Free + Pro variants)

## [2026-05-31] PostHog event wiring — wrong component internals assumed
Sprint 7-8, Task 4.
Symptom: PostHog capture() calls added to wrong variable names (authClient, handleUpgrade, setResultBlob) that didn't exist in actual component code. Build passed (orphan imports compile) but events silently failed.
Fix: grep verification of each component's real call sites, re-wired all 13 tools correctly.
Lesson: always read the actual component before adding event calls. Don't assume variable names from component signatures.

## [2026-05-31] docs/index.md edits not persisting
Sprint 7-8, Task 1 + final sync.
Symptom: Two successive edits to docs/index.md were overwritten by subsequent writes in the same session.
Fix: required three separate commits to stabilize.
Lesson: verify index.md content after every write with a read-back.
