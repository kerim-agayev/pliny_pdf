# Wave 3F — UX Polish

Approach (user-approved at gate): **augment** (don't rip out the existing consistent
ErrorBanner/SuccessPanel/Spinner UI) and **chunked** commits, each gated.

## 3F-1 — Recent files ✅ (built, awaiting gate)
- `lib/recentFiles.ts` — localStorage list (key `pp:recentFiles`, max 10, newest-first,
  de-dupe by filename+tool). Metadata only (filename, toolSlug, timestamp, sizeMB) — never
  contents. `save/get/clear` + a `pp:recentFiles` event for live in-page refresh.
- Recording hook: `downloadBlob` (lib/format.ts) records on every download, deriving the tool
  slug from the path's last segment. NOTE: deliberately does NOT import `lib/tools.ts` here —
  `format.ts` is also imported by the Bun server, and `tools.ts` pulls in React icon components.
- `components/shared/RecentFiles.tsx` — client; renders nothing when empty / pre-mount (no
  hydration mismatch). Full + `compact` variants. Rows link to the tool; show name (i18n) ·
  relative time · size; "Clear history" + privacy note.
- Wired into: `/tools` (full, after the grid, via `ToolsCatalog`) and dashboard sidebar (compact).
  The dashboard's existing server-side `fileHistory` "Recent activity" is untouched — the
  localStorage list complements it by capturing LOCAL-tool usage the DB intentionally never stores.
- i18n: `RecentFiles` namespace (heading/clear/privacy) en/tr/ru.
- Verify: build green, tsc clean (incl. server). Populated-state needs browser gate.

## 3F-2 — Keyboard shortcuts (pending)
## 3F-3 — Toast wiring, augment (pending)
