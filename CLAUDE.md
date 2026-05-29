# CLAUDE.md — PlinyPDF

> This file defines how Claude Code works on the PlinyPDF project.
> Read this file at the start of every session. Then read `docs/index.md` (project memory).
> Do NOT read files in `docs/sprints/` unless the current task needs them — this saves tokens.

---

## 0. Initial Setup Note (Read First)

The three memory files (`CLAUDE.md`, `index.md`, `decisions.md`) are initially placed in the parent folder `PDF_PROJECT/` by the user. On the first run:

1. Create the Next.js 15 project inside `pliny_pdf/` (this folder is the git repo root).
2. Move `CLAUDE.md` into `pliny_pdf/` root.
3. Create `pliny_pdf/docs/` and move `index.md` and `decisions.md` into it.
4. Create the remaining memory files: `docs/architecture.md` and `docs/log.md`.
5. Run `git init` and the GitHub setup from inside `pliny_pdf/` (see Section 5).

---

## 1. How to Use This File (Read This First)

1. Read this `CLAUDE.md` (rules, architecture, conventions).
2. Read `docs/index.md` (what's done, what's next — a SHORT file).
3. Read only the `docs/sprints/sprint-XX.md` for the current task. Do not read them all.
4. Read `docs/decisions.md` only when a "why did we do it this way?" question comes up.

**Token discipline:** This project's memory lives in `docs/`. Never read the entire `docs/` folder at once. Start with `index.md`, then drill down to the relevant file.

---

## 2. What the Project Is

**PlinyPDF** is a privacy-first online PDF toolkit. Named after Pliny the Elder, the Roman scholar who organized knowledge.

**Positioning:** Files are processed in the user's browser wherever possible — they never go to a server. AI features are optional and only run when the user chooses.

**Tagline:** "Edit PDFs without uploading them."

**Target market:** Global English + CIS localization (EN/TR/RU).

**Phase 1 goal (first 3 months):** Test product-market fit. 1,000+ MAU, 20%+ return rate, 10+ Pro subscribers, <$0.05 cost per MAU.

**Domain:** plinypdf.com

---

## 3. Karpathy Working Principles (Active)

The Karpathy skills plugin is installed globally. These four principles apply to every coding task:

### 3.1. Think Before Coding
- State assumptions explicitly. If uncertain, ask — don't silently pick an interpretation.
- If multiple interpretations exist, present both — don't choose silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop, name what's confusing, ask.

**PlinyPDF example:** When implementing "watermark live preview," ask whether the preview should be a real PDF render or a CSS approximation before writing code.

### 3.2. Simplicity First
- Minimum code that solves the problem. Nothing speculative.
- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you wrote 200 lines and it could be 50, rewrite it.

**PlinyPDF example:** Phase 1 has 12 tools. Don't add a 13th "because it might be useful later." Each tool is one file, one responsibility.

### 3.3. Surgical Changes
- Touch only what you must. Clean up only your own mess.
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it — don't delete it.
- Every changed line should trace directly to the user's request.

**PlinyPDF example:** When fixing the Merge tool, don't touch the Split tool. When fixing one tool's bug, don't "improve" a shared util.

### 3.4. Goal-Driven Execution
- Define success criteria. Loop until verified.
- "Add validation" → "Write tests for invalid inputs, then make them pass."
- "Fix the bug" → "Write a test that reproduces it, then make it pass."
- For multi-step tasks, state a brief plan: 1. [Step] → verify: [check] ...

**PlinyPDF example:** "Build the Merge tool" → "Write a test that merges 3 PDFs and verifies the page count is summed, then make it pass."

---

## 4. Project Memory — Obsidian Memory Pattern (CRITICAL)

This project's long-term memory lives in the `docs/` folder. Goal: prevent Claude Code from reading thousands of lines every session as the project grows.

### 4.1. Folder Structure
```
docs/
  index.md          # One-line summary of each sprint + current status + next step
  decisions.md      # Technical decisions and their REASONS (why Drizzle, why Paddle...)
  architecture.md   # System architecture summary (kept current)
  log.md            # Chronological append-only record: [date] what was done
  sprints/
    sprint-01.md    # Sprint details (archived/deleted on completion)
    sprint-02.md
```

### 4.2. Obsidian
The user opens the `docs/` folder as an Obsidian vault (for visual navigation, graph view). Claude Code does not need Obsidian — it only reads/writes `docs/*.md` files. Token savings come from the reading discipline below, not from Obsidian.

### 4.3. Reading Discipline (Token Savings)
- At session start, read ONLY `index.md`. It is a short file.
- If the task belongs to a specific sprint, read ONLY that `sprint-XX.md`.
- Never read the entire `sprints/` folder at once.
- If a "why this decision?" question arises, read `decisions.md`.

### 4.4. Writing Discipline
- After each meaningful task, append one line to `log.md`: `## [YYYY-MM-DD] <what was done>`
- When a sprint completes:
  1. Write the sprint's summary as one line in `index.md`.
  2. Add a completion entry to `log.md`.
  3. Move important decisions to `decisions.md`.
  4. Delete the detailed `sprint-XX.md` file (with user confirmation) to prevent token bloat. The summary stays in `index.md`.
- When a new architectural decision is made, update `architecture.md`.

### 4.5. index.md Format
```markdown
# PlinyPDF — Project Index

## Current Status
- Phase: 1
- Active sprint: <number and title>
- Next step: <one sentence>

## Completed Sprints
- Sprint 01: <one-line summary> — <date>
- Sprint 02: <one-line summary> — <date>

## Key Files
- <important file paths and what they do>
```

---

## 5. GitHub Workflow

GitHub remote: `https://github.com/kerim-agayev/pliny_pdf.git`

**Initial setup (Claude Code will do this from inside `pliny_pdf/`, not done yet):**
```bash
echo "# pliny_pdf" >> README.md
git init
git add README.md
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/kerim-agayev/pliny_pdf.git
git push -u origin main
```

**Commit/push rules:**
- Commit + push after every meaningful change.
- Meaningful = a tool is complete, a feature works, a bug is fixed, a sprint step is done.
- Commit messages are descriptive and in English: `feat: add merge PDF tool`, `fix: watermark preview opacity`, `chore: setup i18n`.
- Use Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`.
- Don't commit WIP (half-done work). Get it to a working state, then commit.
- NEVER commit `.env` or secret files. Make sure they're in `.gitignore`.

---

## 6. Tech Stack (Phase 1)

### Frontend
- **Next.js 15** (App Router)
- **TypeScript** (strict mode)
- **Tailwind CSS 4**
- **shadcn/ui** (component library)
- **next-intl** (i18n: EN, TR, RU)
- **Zustand** (client state)
- **React Hook Form + Zod** (form + validation)
- **Lucide React** (icons)

### PDF Processing (In-Browser — Local)
- **pdf-lib** — merge, split, compress, rotate, watermark, password, page ops
- **pdfjs-dist** (Mozilla) — render, preview, PDF Editor canvas
- Most tools run here. Files do NOT go to a server.

### Backend
- **Bun** (runtime)
- **Elysia** (API framework)
- **Drizzle ORM** (PostgreSQL ORM — NOT Prisma, see decisions.md)

### Server-side PDF (Cloud — only 2 tools)
- **Gotenberg** (Docker container) — for PDF ↔ Word conversion. Runs LibreOffice inside.

### Database & Storage
- **Supabase Postgres** (free tier) — users, subscriptions, file history
- **Cloudflare R2** — temporary file storage (for Pro cloud tools, 24h auto-delete)
- **Upstash Redis** — cache, rate limiting (IP-based daily limits)

### AI
- **Google Gemini Flash** (free tier: 1500 requests/day) — for PDF Summarize
- API key stays on the backend, never exposed to frontend (via Bun/Elysia proxy)

### Auth
- **Better Auth** — email + Google OAuth

### Billing
- **Paddle** — Merchant of Record, automatic VAT/tax. Pro subscription.

### Services
- **Resend** (free) — transactional email
- **Sentry** (free) — error tracking
- **PostHog** (free) — product analytics, feature flags
- **Plausible** or **Cloudflare Web Analytics** — privacy-friendly web analytics

### Hosting
- **Cloudflare Pages** — Next.js frontend
- **Hetzner CPX21** (€4.59/mo) — Backend (Bun/Elysia) + Gotenberg Docker container

---

## 7. Docker Usage

Docker is used ONLY for **Gotenberg** (PDF ↔ Word conversion). No other service goes into Docker.

**Local development:** Docker is installed on the user's machine. The dev environment comes up via `docker-compose.yml`.

`docker-compose.yml` (in project root):
```yaml
services:
  gotenberg:
    image: gotenberg/gotenberg:8
    ports:
      - "3001:3000"
    restart: unless-stopped
```

- Locally, `docker compose up -d` brings up Gotenberg (port 3001).
- The backend connects to Gotenberg via `http://localhost:3001` (env: `GOTENBERG_URL`).
- In production, the same container runs on Hetzner; only `GOTENBERG_URL` changes.

---

## 8. Folder Structure (Target)

```
pliny_pdf/                    # Next.js project root (git repo is here)
├── app/                      # Next.js App Router
│   ├── [locale]/             # i18n route segment (en, tr, ru)
│   │   ├── page.tsx          # Homepage
│   │   ├── tools/            # All tools page
│   │   ├── merge-pdf/        # Each tool is its own route (for SEO)
│   │   ├── compress-pdf/
│   │   ├── ... (12 tools)
│   │   ├── pricing/
│   │   ├── dashboard/
│   │   ├── privacy/
│   │   └── (auth)/           # login, signup
│   └── api/                  # API routes (if needed)
├── components/
│   ├── ui/                   # shadcn/ui components
│   ├── tools/                # tool-specific components
│   └── shared/               # navbar, footer, badges
├── lib/
│   ├── pdf/                  # pdf-lib operations (local tools)
│   ├── db/                   # Drizzle schema + queries
│   ├── auth/                 # Better Auth config
│   └── utils/
├── messages/                 # i18n translations (en.json, tr.json, ru.json)
├── server/                   # Bun/Elysia backend (separate process)
│   ├── index.ts
│   ├── routes/
│   └── services/             # gotenberg, gemini, paddle
├── docs/                     # PROJECT MEMORY (Obsidian vault opens this)
│   ├── index.md
│   ├── decisions.md
│   ├── architecture.md
│   ├── log.md
│   └── sprints/
├── docker-compose.yml
├── .env.example
├── .gitignore
├── CLAUDE.md                 # this file
└── README.md
```

---

## 9. Phase 1 — Full Scope

### 9.1. PDF Tools (12 tools)

**Local (in-browser, unlimited, free, no account):**
1. **Merge PDF** — combine multiple PDFs, drag-and-drop reorder
2. **Split PDF** — split by page range or one by one
3. **Compress PDF** — 3 levels (Screen / Balanced / Maximum)
4. **Rotate PDF** — rotate pages or whole document
5. **PDF → JPG** — each page to a high-resolution image
6. **JPG → PDF** — combine multiple images into one PDF
7. **Watermark** — with LIVE PREVIEW (differentiator feature)
8. **Password Protect** — add a password to a PDF
9. **Remove Password** — user who knows the password can remove it
10. **PDF Editor** — annotation: highlight, add text, draw, shapes, sticky note, undo/redo (differentiator: not in BentoPDF)

**Cloud (server, Free: 10/day with account / 3/day without, Pro: unlimited):**
11. **PDF → Word** — Gotenberg, layout preserved
12. **Word → PDF** — Gotenberg

### 9.2. AI Feature (1)
- **PDF Summarize** — Gemini Flash free tier. Free: 2/month, Pro: unlimited. Summary / outline / per-section.

### 9.3. Watermark Live Preview (Key Differentiator)
In the Watermark tool, as the user changes settings (text, font size, opacity, position, color), the right panel updates a REAL PDF preview in real time. iLovePDF's biggest complaint is the lack of preview — we solve it. Render with pdfjs-dist + canvas overlay.

### 9.4. PDF Editor (Annotation) Scope
Entirely in-browser (`pdfjs-dist` + canvas overlay). Does not go to a server.
- Text box, sticky note
- Highlight, underline, strikethrough
- Freehand pen, rectangle, circle, arrow, line
- Add image, whiteout box, eraser
- Color/thickness selection, undo/redo (Ctrl+Z/Y)
- Zoom (50-200%), page navigation
- "Save PDF" downloads the annotated PDF
- **NOTE:** This is an annotation editor. Editing the EXISTING PDF text (in-place text edit) is Phase 2 (mupdf-wasm). Do NOT do it in Phase 1.

### 9.5. Privacy Badge System
A visible badge on every tool page:
- Local — "your files never leave your browser" (green, #10B981)
- Cloud — "processed securely" (blue, #3B82F6)
On hover, a tooltip explains where the processing happens.

### 9.6. Account System (3 tiers)
- **No account:** 10 local tools unlimited, cloud tools 3/day (IP-based), no AI
- **Free account:** cloud tools 10/day, AI 2/month, 7-day history
- **Pro ($4.99/mo or $39/yr):** everything unlimited, AI unlimited, 30-day history, priority processing, email support

### 9.7. Free/Pro Decision Logic
- Runs in browser (zero server cost) → Free, unlimited
- Consumes server CPU/RAM (Office conversion) → limited on Free, unlimited on Pro
- Has API cost (AI) → very limited on Free, unlimited on Pro

### 9.8. NEVER Do (Critical for Brand)
- NO credit card required for trial
- NO upgrade pop-up nags
- NO download paywall ("edit but pay to download")
- NO aggressive auto-renewal
- NO forced watermark on free tier
- NO daily task limit on local tools (free tier)
- NO ads (ever)

### 9.9. Languages (3, day-one)
- English (global SEO primary)
- Turkish
- Russian
- Via next-intl. Real localization, not just translation (including date/number formats).

### 9.10. Pages
- Homepage
- 12 tool pages (each its own route, for SEO)
- 3 languages × 12 tools = 36 SEO landing pages
- Pricing (Monthly/Yearly toggle)
- Privacy & Security
- About
- Blog (5 posts at launch)
- Login / Signup
- Dashboard (Free + Pro variants)
- Privacy Policy, Terms of Service (GDPR + KVKK)

### 9.11. SEO
- Each tool page is its own route + structured data (FAQ, HowTo, SoftwareApplication schema)
- Sitemap, robots.txt, OG images
- Privacy-first positioning on every tool page

---

## 10. Design — Claude Design Handoff

The design was created in Claude Design (6 screens: Homepage, All Tools, Merge PDF, Watermark, Pricing, Dashboard + mobile).

**To fetch the design:** The user will provide a handoff command from Claude Design's "Send to local coding agent" feature. The command looks like:
```
Fetch this design file, read its readme, and implement the relevant aspects of the design. <handoff-url> Implement: PlinyPDF Design.html
```
When this command is given, fetch the design file, read its readme, and implement the relevant screen. The handoff URL is session-based, so it is NOT hardcoded here — the user provides it on each implementation round.

**Design system:**
- Dark theme primary (light mode also supported)
- Primary accent: indigo #6B5CE7
- Local badge: green #10B981
- Cloud badge: blue #3B82F6
- Background (dark): #0F0F0F / cards #1A1A1A
- Background (light): #FAFAF9 / cards #FFFFFF
- Headings: Syne or Plus Jakarta Sans (600-700)
- Body: Inter or Plus Jakarta Sans (400)
- Monospace: JetBrains Mono (technical labels, filenames)
- Minimal, premium, Linear/Notion feel
- "Named after Pliny the Elder, who organized human knowledge" in the footer

---

## 11. Skill Usage Map

The following Claude Code skills are installed. Read the right one per task:

| Task | Read |
|---|---|
| Next.js code (App Router, Server Components, routing) | `nextjs-best-practices` |
| Turning UI/component/page design into code | `frontend-design` |
| Tailwind styling | `tailwind-patterns` |
| DB schema, Drizzle queries | `drizzle-orm-expert` |
| Supabase setup, auth, storage | `supabase` |
| Postgres schema, indexes, performance | `postgres-best-practices` |

- If a task touches multiple skills, read the relevant ones, not all.
- If skills conflict (e.g. two frontend recommendations clash), prefer `frontend-design` + `nextjs-best-practices`.

---

## 12. Work Order (Phase 1 Sprint Plan)

### Sprint 1-2: Foundation
1. Set up Next.js 15 project (App Router, TypeScript strict)
2. Git init + first commit + push (see Section 5)
3. Tailwind 4 + shadcn/ui setup
4. next-intl i18n setup (en, tr, ru)
5. Design system tokens (colors, fonts)
6. Create `docs/` folder + index.md, decisions.md, architecture.md, log.md
7. docker-compose.yml (Gotenberg)
8. .env.example + .gitignore
9. Cloudflare Pages deploy connection
10. Navbar + Footer + privacy badge components

**When Sprint 1-2 is complete:** Stop and ask the user:
"Foundation is ready. Please provide the Claude Design handoff command
(from Claude Design → Share → Handoff to Claude Code → Copy command)
so I can fetch the design and implement the UI."
Do not start Sprint 3-4 until the user provides the handoff command and the design is implemented.

### Sprint 3-4: Core Local Tools
11. pdf-lib integration
12. Merge, Split, Compress, Rotate
13. PDF → JPG, JPG → PDF
14. Password Protect / Remove
15. A separate route + page per tool (SEO)

### Sprint 5-6: Premium Tools + Backend
16. Watermark (live preview — pdfjs-dist)
17. PDF Editor (annotation — canvas)
18. Set up Bun/Elysia backend
19. Gotenberg integration (PDF ↔ Word)
20. Supabase + Drizzle (users, subscriptions)
21. Better Auth (email + Google)
22. Gemini AI Summarize
23. Paddle billing
24. Rate limiting (Upstash Redis)

### Sprint 7-8: Launch
25. Complete 36 SEO landing pages
26. 5 blog posts
27. Privacy Policy, ToS (GDPR + KVKK)
28. Dashboard (Free + Pro)
29. Analytics (PostHog, Sentry)
30. Mobile responsive check
31. ProductHunt + HN + Reddit launch prep

**For each sprint:** Keep a detailed plan in `docs/sprints/sprint-XX.md`. When the sprint completes, summarize into index.md and delete the detail (Section 4.4).

---

## 13. Phase 2 Items (DO NOT BUILD NOW)

These are OUTSIDE Phase 1 scope. When writing Phase 1 code, do not prepare infrastructure for these or say "we'll need it later" (Simplicity First):
- OCR (Tesseract.js), PDF → Excel/PPT, form fill/create, Crop, Compare, Repair
- E-signature, signature request, multi-party workflow
- Chat with PDF, translate, smart redaction, data extract, WebLLM
- True text editor (mupdf-wasm — editing existing text)
- AZ/UZ/KZ + ES/FR/DE/AR languages
- Lifetime plan, iyzico/m10/Kaspi, education tier
- Team workspace, API platform, Chrome extension, mobile app

---

## 14. Conventions

- TypeScript strict mode, don't use `any`.
- Component files PascalCase, util files kebab-case.
- Keep server-only code and client code clearly separated (use `"use client"` deliberately).
- Document env variables in `.env.example` (without values).
- Each tool has a single responsibility; shared PDF logic lives under `lib/pdf/`.
- Do NOT break the local-processing claim: a local tool must genuinely run in the browser — never secretly send to a server.
- Error messages are user-friendly and localized (in all 3 languages).
