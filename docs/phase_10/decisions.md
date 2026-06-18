# Phase 10 — Decisions

> Why we did it this way. Read before reversing any of these.

## Wave 10A

- **D10-1 — Compress PDF hidden, not deleted.** Set `lib/tools.ts` compress entry
  `available: false` and replaced `app/[locale]/compress-pdf/page.tsx` with
  `redirect("/tools")`. Mirrors the AI Summary precedent (`summarize/page.tsx`).
  Backend `server/routes/tools.ts` compress route left intact so the tool can be
  re-enabled after a proper rewrite. `available: false` auto-removes it from /tools
  ([ToolsCatalog](../../components/marketing/ToolsCatalog.tsx) filters `t.available`),
  the /tools count (`visible.length`), and the sitemap ([sitemap.ts](../../app/sitemap.ts) filters `t.available`).

- **D10-2 — "Why PlinyPDF" card #2 → Edit PDF.** AI Summary copy ("200-page report")
  was stale after AI Summary's removal. Replaced with the flagship Edit PDF feature
  (Issue 7, user-chosen). Renamed i18n keys `whyAi*` → `whyEdit*` in all three locales
  and switched the card icon to `IconType`. Kept accent `#BFB5FF` for the row palette.

- **D10-3 — Homepage "Popular tools" Compress → PDF to JPG.** The grid hardcodes 6 tool
  ids ([page.tsx](../../app/[locale]/page.tsx)); an `available: false` tool renders as a
  dead card with a "Soon" badge, so Compress had to be swapped out. User chose PDF to JPG.

- **D10-4 — Removed `compress-pdf` from 4 landing `related` arrays.** Landing "Related tools"
  rendering resolves by `toolBySlug` and does **not** filter `available`, so the removed
  Compress tool would still surface as a related card. Replaced each occurrence with a
  sensible neighbor (grayscale-pdf / pdf-to-word) avoiding duplicates within each list.

- **D10-5 — Merge hero preview marked Cloud.** Merge is `mode: "cloud"` in tools.ts, but the
  homepage `HeroPreview` hardcoded a `local` badge + green dot + "Processed in your browser"
  (Issue 6). Changed to `cloud` badge, blue dot (#60A5FA), and `previewProcessed` →
  "Processed on our server · Deleted within 24h" (24h matches the privacy page retention).

- **D10-6 — LAUNCH.md tool lists updated.** Dropped Compress from the two server-tool
  enumerations and changed "8 tools that need a server" → "7", alongside all "33"→"32"
  and "25 of 33"→"25 of 32" (local count unchanged — Compress was cloud).
