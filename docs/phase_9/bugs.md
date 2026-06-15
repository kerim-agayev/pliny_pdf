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

## Open / watch
- Anon daily-quota count in `/api/usage` is best-effort: the Next.js route (Vercel) and the
  cloud-tool backend (Hetzner) may see different `x-forwarded-for` IPs, so the anon "Today
  x/3" can be approximate. Signed-in counts (keyed by user id) are exact.
