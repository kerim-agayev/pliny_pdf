# Phase 10 — Log

Chronological, append-only.

## [2026-06-18] Phase 10 start — docs tree created
- Created `docs/phase_10/` (index, decisions, bugs, log, waves/).

## [2026-06-18] Wave 10A — Compress removal + homepage fixes
- Compress PDF → `available: false`; `compress-pdf` route → `redirect("/tools")`.
- Tool count 33→32 across `messages/{en,tr,ru}.json` (heroBadge, headlineStart, ctaBody) + `deploy/LAUNCH.md`.
- Removed `compress-pdf-online-free` landing entry; stripped `compress-pdf` from 4 `related` arrays.
- "Why PlinyPDF" card #2: AI Summary → Edit PDF (`whyAi*`→`whyEdit*`, IconType).
- Homepage popular grid: compress → pdf-to-jpg.
- Hero v2.4 badge: hide "· No account needed" on mobile.
- Merge hero preview: local → cloud badge + blue dot + "Processed on our server · Deleted within 24h".
- Committed `9cd34b4`, pushed to main.

## [2026-06-18] GATE 10A PASSED ✅
- All checks verified green on Vercel production (user-confirmed).
- Phase 10 now at 32 tools. Next: Wave 10B (/tools tabs mobile fix + compress blog replacement).

## [2026-06-18] Wave 10B — UI fixes
- /tools category tabs (`ToolsCatalog.tsx`): `flex-wrap` → `flex-nowrap overflow-x-auto max-w-full pp-noscroll`; buttons `shrink-0 whitespace-nowrap`. New `.pp-noscroll` hidden-scrollbar utility in `globals.css` (mirrors `.pp-ed-row`). Horizontal scroll chosen — robust for long RU labels (Конвертировать/Редактировать).
- Blog: deleted `how-to-compress-pdf-without-losing-quality.md`; added `how-to-sign-pdf-documents-digitally.md` (EN, links to `/sign-pdf`). Sitemap/index auto-derive — no hardcoded list. Old slug 404s.
- Committed `b2cd85e`, pushed to main.

## [2026-06-18] Wave 10B follow-up — footer fix
- Footer tool links in `components/shared/Footer.tsx` are HARDCODED (not derived from `lib/tools.ts`) — that's why removed Compress PDF still showed. Replaced "Compress PDF" → "Sign PDF".
- `bun run build` green. Committed + pushed to main.

## [2026-06-18] GATE 10B PASSED ✅
- Tabs scroll cleanly on mobile (user-confirmed on real device, EN/TR/RU); new blog post live; footer no longer shows Compress PDF.
- Next: Wave 10C (backend bug fixes — PDF→Word slide-deck 500, PDF→JPG font blocks; Hetzner deploy).

## [2026-06-18] Wave 10C — backend bug fixes (Hetzner)
- Investigated live on Hetzner. **Discovery: prod was stale at Phase 8 (`b3d8b8a`)** — backend never redeployed since Phase 8. Deploy fast-forwarded through all Phase 9+10 backend changes (page caps, `officeMax*`).
- **PDF→Word (Issue 2): no bug.** Reproduced the reported slide deck (`Hiçlik_Felsefesi…`, 14 pp, 18.7 MiB) — it **converts fine** (~25 s, 20 MB docx). The "500" was the pre-deploy Phase 8 code. Current code: anon → clean 413 fileTooLarge (15 MB limit); free → converts. Never 500.
- **PDF→JPG (Issue 5): documented as known limitation.** Host already has DejaVu+Noto+fontconfig; PyMuPDF uses its own bundled fonts (ignores system fontconfig) so a font install is a no-op. Public SlicedInvoices sample renders fine — failing file not available. See `bugs.md`.
- Shipped: `libreoffice.ts` (maxBuffer + `test -s` output check + typed `ConversionUnsupportedError`); `convert.ts` (console.error logging + clearer message, status 502); `server/index.ts` (hardened `.onError` — log uncaught + friendly JSON 500/400 body); `deploy/README.md` (Python/PyMuPDF + font note).
- Decision: keep anon `OFFICE_MAX_MB`=15 (user choice) → oversized decks get a friendly 413.
- Commits `85022c8` + `587d4b8`, pushed + deployed to Hetzner (HEAD `587d4b8`, health OK; verified validation→400, oversized→413, normal→200).

## [2026-06-18] Wave 10C follow-up — REAL root cause of PDF→Word 500 found + fixed
- User still hit 500 after deploy. The `.onError` logging (587d4b8) surfaced it: `TypeError: Header '17' has invalid value: 'attachment; filename="Hiçlik_Felsefesi…docx"' at fileResponse (convert.ts:48)`.
- **Root cause:** non-ASCII filename (Turkish `ç`) in `Content-Disposition`. HTTP headers must be ASCII → `new Response()` throws AFTER a successful conversion, outside the try/catch → raw 500. User is logged-in (free, 50 MB) so passes size check; my earlier anon tests hit the 15 MB 413 and never reached `fileResponse`, masking the bug.
- **Fix (`746f976`):** `convert.ts` + `ocr.ts` now use the shared `attachmentDisposition()` helper (RFC 5987, already used by tools/editor routes) instead of a raw inline filename.
- Verified on Hetzner: Turkish-named PDF → **HTTP 200**, header `filename="Hiclik…"; filename*=UTF-8''Hi%C3%A7lik…`, no errors in journald. Deployed (HEAD `746f976`, health OK).
- Lesson: the onError hardening earned its keep immediately — it's what made the silent 500 debuggable.

## [2026-06-18] GATE 10C PASSED ✅ — user-confirmed
- PDF→Word non-ASCII filename 500 fixed + verified (200); PDF→JPG documented as known limitation; `bun run build` green; Hetzner deployed (`746f976`).
- User confirmed the fix works on the live site (PDF→Word now downloads the .docx).
- Next: Wave 10D (Lighthouse + final QA — Issue 9), the last Phase 10 wave. NOT started yet.
