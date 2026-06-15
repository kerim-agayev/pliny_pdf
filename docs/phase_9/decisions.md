# Phase 9 — Decisions

## D9-1 — Limits stay centralized in `lib/limits.ts`; add `getToolLimits` lookup
The audit confirmed `lib/limits.ts` is imported by **both** the Next.js frontend and the
Bun/Elysia server routes, so front/back limit values can never diverge. Rather than scatter
per-tool `localMaxMB`/`officeMaxMB`/… calls, Wave 9A adds one `getToolLimits(toolId, plan)`
returning `{ mb, count, unit, cloud, dailyLimit? }`. Both the LimitBadge and the dropzone
pre-upload check read it → display always matches enforcement.

## D9-2 — Live daily quota via new `/api/usage` (user-approved)
The design badge shows "Today 7/10". `remainingServerTool()` existed but was server-only
(dashboard SSR). Added `app/api/usage/route.ts` (App Router, same origin) + `useDailyUsage()`
hook. Pro → no daily line. Anon keyed by `clientIp` (mirrors backend; best-effort bucket
alignment across Vercel/Hetzner proxies). Fails silently → badge omits the daily line, never
blocks. (User chose this over a static "Up to X/day".)

## D9-3 — Inline pre-upload errors replace toasts (when a badge is present)
Size violations now flip the LimitBadge to its red `over` state + a red dropzone border
*before* any upload, instead of a post-selection toast. Page violations show an inline red
line. Toast path retained as a fallback for any toolId-less dropzone.

## D9-4 — Free-tier sub-line + anon upsell use real per-tool limits
The design prototype hardcoded "Anonymous tier: 10 MB · 30 pages". We compute both tiers
via `getToolLimits(toolId, "anon"|"free")` so cloud tools (e.g. office 15/50 MB) show correct
numbers instead of the local hardcode. Faithful to design intent, corrected for accuracy.

## D9-5 — jpg-to-pdf shows "images"; nup/repeat show input limits
`getToolLimits` returns `unit: "images"` for jpg-to-pdf (image count, not pages). N-up and
Repeat Pages display their **input** local MB·pages in the badge; their **output** page caps
(`NUP_/REPEAT_MAX_OUTPUT_PAGES`) remain separate in-tool validation, unchanged.

## D9-6 — `maxSizeMB` kept as harmless fallback at call sites
`checkPages` is retained (it still gates whether page validation runs). `maxSizeMB` is now
superseded by `getToolLimits().mb` but left in place to avoid touching each tool's `maxMB`
computation (surgical; no behavior change since `limits.mb` takes precedence).

## D9-7 — Live FileMeter not wired from FileDropzone
The badge supports a live "4.2 / 25 MB" meter, but the dropzone hands valid files off
immediately (parent unmounts it), so there's no persistent loaded file to meter. Component
supports it for future use; not triggered in 9A. Over-limit (rejection) IS wired.
