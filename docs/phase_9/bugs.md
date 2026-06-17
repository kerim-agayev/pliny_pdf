# Phase 9 — Known Bugs & Fixes

> Read before touching related code.

## Fixed in Wave 9A

### B9-1 — FileDropzone validated cloud tools against the local page limit
`FileDropzone` hardcoded `pageLimit = localMaxPages(plan)` (30/100) regardless of tool, so a
cloud tool that opted into `checkPages` would reject at the local cap instead of its real
backend limit (office 25/75, pdf-to-jpg 15/50, edit-pdf 15/50, merge 100/300). Now driven by
`getToolLimits(toolId).count` — display and pre-upload check match the backend.

### B9-2 — Edit PDF pre-upload size used local cap, not editor cap
`EditorTool` passed no `maxSizeMB`, so the dropzone pre-check used `localMaxMB` (10/25) while
the backend enforces `editorMaxMB` (10/30). `getToolLimits("edit-pdf")` now uses the editor
caps, aligning the friendly pre-check with enforcement.

## Fixed in Wave 9A — GATE 9A round

### B9-3 — Cloud tools showed over-page as a post-upload toast
PDF→JPG (and other cloud tools) passed no `checkPages`, so the dropzone never
counted pages client-side; the over-page rejection came from the server as a toast
*after* upload. Fix: FileDropzone now parses page count for **every** PDF tool with a
`toolId` (`accept === "pdf" && (checkPages || toolId)`) and blocks before `onFiles`.
Both size and page violations now flip the badge red + red border (unified `over` state)
before any server call.

### B9-4 — Edit PDF showed MB but not pages; Annotate was mis-tagged
`EditorTool` (the **Annotate** tool, id `edit`, route `/pdf-editor`, local) was wrongly
given `toolId="edit-pdf"`. Fixed to `toolId="edit"`. The real cloud **Edit PDF**
(`components/tools/EditPdf/index.tsx`) uses a custom uploader (not FileDropzone), so it
never got a badge. Added `LimitBadge` to its empty state (10/30 MB · 15/50 pages · daily)
plus inline over-limit (size in `openFile`, pages in `proceed` — covers the post-unlock
path) that blocks before upload.

### B9-5 — Daily quota could show a stale count
The `/api/usage` mapping is correct (`used = total − remaining`, anon 3 / free 10, badge
reads `used` → 0 on a truly fresh window). The remaining risk was a cached client fetch
returning an old count; `useDailyUsage` now fetches with `{ cache: "no-store" }`.
Note: the count reflects Upstash's rolling 24h window (not the calendar day), and is exact
for signed-in users (keyed by user id); anon is best-effort (IP).

### B9-6 — JPG to PDF over-image-count used a toast
`JpgToPdfTool.addFiles` showed `toast.error("tooManyImages")` and silently truncated.
Switched to inline `setErrorMsg` (the tool already renders an `ErrorBanner`); removed the
now-unused `sonner` import. Badge shows "{n} images" (unit="images").

### B9-7 — Merge didn't check TOTAL size / TOTAL pages client-side
FileDropzone validates each merged file individually, but the backend enforces the **total**
across all files (`cloudMaxBytes` total, `mergeMaxPages` total). Added a client total guard in
`MergeTool` (`getToolLimits("merge", plan)` → total MB + total pages): inline `ErrorBanner`
(`totalTooManyPages` / `totalTooLarge`, EN/TR/RU) and the Merge button is disabled while over —
before any upload.

### Audit note — word-to-pdf page check is server-side only
`.docx` page count can't be parsed client-side, so word-to-pdf's page limit is enforced by the
backend (inline `ErrorBanner` on rejection); the badge shows the page limit informationally.
This is inherent, not a defect.

## Wave 9J — final QA
- No new bugs found. Automated checks all green (build exit 0, i18n parity en=tr=ru, 33
  tool routes + `summarize` all resolve, 12 landing pages + sitemap, 5 blog posts). All
  GATE-fixed bugs from earlier waves (B9-1..B9-15) remain fixed. See `log.md` Wave 9J entry.

## Open / watch
- Anon daily-quota count in `/api/usage` is best-effort: the Next.js route (Vercel) and the
  cloud-tool backend (Hetzner) may see different `x-forwarded-for` IPs, so the anon "Today
  x/3" can be approximate. Signed-in counts (keyed by user id) are exact. (Known limitation,
  not a launch blocker — documented for Phase 10.)
- `PostHogProvider` defaults `api_host` to `us.i.posthog.com` while the layout preconnects
  `eu`; assumed overridden by `NEXT_PUBLIC_POSTHOG_HOST` in prod — confirm the env var is set
  (flagged in Wave 9I, not a code defect).
