# Wave 10B — UI Fixes — DONE ✅

Issues: 3 (/tools category tabs mobile overflow), 8 (replace compress blog post).

## Tasks
- [x] /tools category tabs mobile fix — `components/marketing/ToolsCatalog.tsx`: `flex-wrap` → `flex-nowrap overflow-x-auto max-w-full` + new `.pp-noscroll` utility (globals.css); buttons `shrink-0 whitespace-nowrap`. Horizontal scroll (robust for long RU labels).
- [x] Blog: replaced compress post → `content/blog/how-to-sign-pdf-documents-digitally.md`. Sitemap/index auto-derive from dir (no hardcoded list). Compress slug now 404s.
- [x] Footer fix: `components/shared/Footer.tsx` tool links are HARDCODED (not derived from lib/tools.ts) — "Compress PDF" → "Sign PDF".

## GATE 10B — PASSED ✅ (2026-06-18)
- [x] Tabs don't overflow on mobile (user-confirmed on device, EN/TR/RU)
- [x] New blog post live
- [x] Footer no longer shows Compress PDF
- [x] `bun run build` green
- Commits: `b2cd85e` (tabs + blog) + follow-up footer fix.
