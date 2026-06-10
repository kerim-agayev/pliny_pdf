# Wave 6E — Comprehensive QA & Performance

Final wave of Phase 6. Goal: **zero bugs remaining** — QA every Edit PDF feature,
audit performance + error handling. No new features.

## Pre-QA code audit (done before fixes)

3 parallel passes (frontend components / store + API client / Bun+Elysia+PyMuPDF
backend). **Headline: code is in strong shape.** Comprehensive error handling (every
API call wrapped, all errors → toasts, none swallowed), real touch support (pointer
events throughout), clean memory (intervals/listeners/object-URLs cleaned up), ~100%
i18n. No critical bugs.

Two scope gaps the QA checklist names but prior decisions deferred *to* 6E (both
confirmed by user) + minor polish.

## Pre-QA fixes applied (GATE pending)

- **A1 — Find & Replace re-enabled.** Was unreachable since D6-2 (modal/store/API/
  i18n all intact). Added Row-3 toolbar button (`IconSearch` + `t("findReplace")`,
  ⌘H hint) in EditorToolbar.tsx; restored ⌘H/Ctrl+H in index.tsx keyboard handler.
  Fixed two real interaction bugs in FindReplaceModal.tsx:
  - `run()` never called `bumpRender()` → replaced text stayed visually stale (page
    `<img>` is cache-busted by `?v=${renderVersion}`). Added `bumpRender()` after
    `replacePages()`.
  - "Replace" and "Replace All" buttons **both** called `run()` (server replaces all
    matches; there is no per-match replace). Consolidated to a single honest
    "Replace All" button. (`replace` i18n key now unused but retained.)
- **A2 — Full undo coverage.** Extended `Snapshot` to include `blockPositions` +
  `blockStyles`; `snapshot()` shallow-copies both; `undo()`/`redo()` restore them;
  `moveBlock` now pushes one snapshot per drag (onMove fires once on pointer-up);
  underline/align-only `setFormat` pushes a snapshot (editBlock already snapshots
  font/size/color/bold/italic). So move + underline/alignment are now undoable.
  (editorStore.ts). Supersedes the D6-5 deferral.
- **A3 — CommentTool i18n.** Hardcoded `authorInitials = "You"` → new
  `commentAuthorYou` key (en "You" / tr "Siz" / ru "Вы"), passed from EditorCanvas.
- **A4 — setTimeout cleanup.** Already correct (EditorCanvas draft-focus effect
  already `clearTimeout`s in cleanup). No change.

`bun run build` ✅ green, no MISSING_MESSAGE. **No backend/Python changes** → no
Hetzner redeploy needed for these fixes.

## Performance items (measure in QA — A5)

- 150 DPI, all pages rendered on open; re-render on save = affected pages only.
- 20-page open expected <5s ✓. **100-page open may exceed the <10s target** (est.
  15–30s) — measure; if it fails, lower parse-render DPI to ~110–120 or lazy-render.
- 500-page Pro exceeds the 120s subprocess timeout on open → out of QA scope (spec
  tests ≤100 pages); document as a known limitation.

## QA matrix (user-driven, on Vercel — see plan B1–B3)

Every tool × {EN,TR,RU} × {dark,light} × touch; performance (B2); error handling
(B3). Log bugs to bugs.md; fix → re-test → repeat until zero open. **Do NOT commit
until GATE 6E confirmed by user.**
