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

## Wave 10B

- **D10-7 — /tools tabs: horizontal scroll, not wrap/abbreviate.** Issue 3 (mobile overflow,
  "Secure" dropping to a second line) was fixed in
  [ToolsCatalog.tsx](../../components/marketing/ToolsCatalog.tsx) by switching the category row
  from `flex-wrap` to `flex-nowrap overflow-x-auto max-w-full` with a new `.pp-noscroll`
  hidden-scrollbar utility in `globals.css` (mirrors the existing `.pp-ed-row`); buttons are
  `shrink-0 whitespace-nowrap`. Horizontal scroll was chosen over wrapping or icon-only
  abbreviation because it stays robust for long Russian labels (Конвертировать / Редактировать).

- **D10-8 — Footer tool links are hardcoded.** Removed Compress PDF still showed in the footer
  because [Footer.tsx](../../components/shared/Footer.tsx) lists tool links by hand rather than
  deriving them from `lib/tools.ts` (unlike /tools, the homepage grid, and the sitemap, which
  all filter `available`). Fixed by editing the hardcoded link "Compress PDF" → "Sign PDF".
  Note for future tool removals: the footer must be updated manually.

## Wave 10C

- **D10-9 — PDF→Word "500" root cause: non-ASCII filename in `Content-Disposition`.** Issue 2.
  The reported deck converts fine; the 500 came from `fileResponse` in
  [convert.ts](../../server/routes/convert.ts) emitting a **raw** `Content-Disposition:
  attachment; filename="Hiçlik…docx"`. HTTP header values must be ASCII, so `new Response()`
  threw a `TypeError` **after** a successful conversion — outside the route try/catch → bare 500.
  It only bit logged-in users (anon is capped at 15 MB and 413s before reaching `fileResponse`,
  which masked it). **Fix:** `convert.ts` + `ocr.ts` now use the shared `attachmentDisposition()`
  helper (`server/routes/http.ts`, RFC 5987) that `tools.ts`/`editor.ts` already used, instead of
  their own inline raw filename. Verified Turkish-named PDF → 200. Commit `746f976`.

- **D10-10 — Keep anon `OFFICE_MAX_MB` = 15.** User choice: oversized decks for anonymous users
  get a friendly 413 (`fileTooLarge`) rather than a conversion attempt. Logged-in (free) users
  keep the 50 MB cap and convert.

- **D10-11 — Error hardening kept.** `libreoffice.ts` (`maxBuffer` + `test -s` output check +
  typed `ConversionUnsupportedError`), `convert.ts` (`console.error` logging + clearer 502
  message), and `server/index.ts` (`.onError` logs uncaught errors + returns a friendly JSON
  500/400 body) were all retained — the `.onError` logging is what surfaced D10-9's root cause.

- **D10-12 — PDF→JPG block glyphs = known limitation, not a font install.** Issue 5. Some PDFs
  whose fonts are not embedded or use CID/Identity encoding render as block glyphs. The Hetzner
  host already has DejaVu+Noto+fontconfig, but PyMuPDF renders with its **own bundled fonts**
  (it ignores system fontconfig), so installing system fonts is a no-op. The public
  SlicedInvoices sample renders correctly, so the failing input is a specific file we don't have.
  **Cannot fix without a reproducer** — revisit with a code-level fallback in `cmd_pdf_to_jpg`
  (`server/services/pdf-tools.py`) and/or a `pymupdf` upgrade. Documented in `bugs.md`.
