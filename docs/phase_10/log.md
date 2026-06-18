# Phase 10 — Log

Chronological, append-only.

## [2026-06-18] Phase 10 start — docs tree created
- Created `docs/phase_10/` (index, decisions, bugs, log, waves/).

## [2026-06-18] Wave 10A — Compress removal + homepage fixes (in review)
- Compress PDF → `available: false`; `compress-pdf` route → `redirect("/tools")`.
- Tool count 33→32 across `messages/{en,tr,ru}.json` (heroBadge, headlineStart, ctaBody) + `deploy/LAUNCH.md`.
- Removed `compress-pdf-online-free` landing entry; stripped `compress-pdf` from 4 `related` arrays.
- "Why PlinyPDF" card #2: AI Summary → Edit PDF (`whyAi*`→`whyEdit*`, IconType).
- Homepage popular grid: compress → pdf-to-jpg.
- Hero v2.4 badge: hide "· No account needed" on mobile.
- Merge hero preview: local → cloud badge + blue dot + "Processed on our server · Deleted within 24h".
- _Awaiting GATE 10A confirmation (no commit yet)._
