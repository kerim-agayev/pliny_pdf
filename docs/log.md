# PlinyPDF — Log

Append-only chronological record. One line per meaningful task (CLAUDE.md §4.4).

## [2026-05-29] Sprint 1-2 Foundation complete
Bootstrapped `pliny_pdf/`: Next.js 16 + Tailwind 4 + shadcn/ui (button, badge, tooltip) + next-intl (en/tr/ru) + design tokens (#6B5CE7 brand, #10B981 local, #3B82F6 cloud) + Plus Jakarta Sans + JetBrains Mono + docker-compose (Gotenberg) + .env.example + placeholder Navbar/Footer/PrivacyBadge/LocaleSwitcher. Memory files moved into `docs/`. First commit on `main`. Cloudflare Pages connection deferred to the user. Verified `bun dev` renders `/en`, `/tr`, `/ru` with localized strings.
