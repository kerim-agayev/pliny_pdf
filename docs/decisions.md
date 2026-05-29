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

## Bun + Elysia (not Node + Express)
- Matches the user's existing stack experience (goqrcodegenerator)
- Fast, modern, TypeScript-native

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
