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

## 3F-2 — Keyboard shortcuts ✅ (built, awaiting gate)
Surgical chokepoint approach — shortcuts act on shared components via a
`data-pp-shortcut` marker, so NO per-tool wiring (covers all 28 tools at once):
- `lib/hooks/useToolShortcuts.ts` — one `keydown` listener, mounted once in `ToolShell`.
  - **Ctrl/Cmd+O** → clicks `[data-pp-shortcut="open"]` (the FileDropzone) → file picker.
  - **Ctrl/Cmd+D** → clicks `[data-pp-shortcut="download"]` (SuccessPanel download).
  - **Esc** → clicks `[data-pp-shortcut="reset"]` (SuccessPanel "process another" OR the
    FileInfoBar remove button — whichever is on the page → "clear / start over").
  - Skipped while typing in input/textarea/select/contenteditable (never hijacks typing).
    `preventDefault` only fires when a target is actually present, so it never steals the
    browser's native Ctrl+O/Ctrl+D when no tool element is on the page.
  - No conflict with PasswordModal's own Esc: while the modal is open the file isn't loaded
    yet, so no `reset` target exists — the modal handler wins.
- Markers added: FileDropzone drop area (`open`), SuccessPanel download (`download`) + reset
  (`reset`), FileInfoBar remove (`reset`). Each also gets `aria-keyshortcuts` for a11y.
- Hint badges: `components/shared/Kbd.tsx` — platform-aware label (`⌘O` on macOS, `Ctrl+O`
  elsewhere; resolved after mount + `suppressHydrationWarning`). Shown on the dropzone
  (`⌘O open`), the download button (`⌘D`), and "process another" (`Esc`).
- i18n: `ToolUI.shortcutOpen` (open/aç/открыть) en/tr/ru. All other hints are symbols/ARIA.
- Coverage note: tools with a CUSTOM download UI (not the shared SuccessPanel — e.g. PDF→JPG
  multi-image, Editor) won't get Ctrl+D; Ctrl+O/Esc still work everywhere via the dropzone.
- Verify: build green, no MISSING_MESSAGE. Live key handling needs browser gate.

## 3F-3 — Toast wiring (augment) ✅ (built, awaiting gate)
Augment, not replace: the existing in-panel SuccessPanel/ErrorBanner UI stays; toasts are
added at the SHARED-component level so one edit covers every tool that uses them (~27):
- `ResultPanels.tsx`:
  - `SuccessPanel` fires `toast.success(title)` on mount; new `quietToast` prop opts a tool
    out when it already raises a richer success toast.
  - `ErrorBanner` fires `toast.error(message ?? errorTitle)` on mount — reinforces the
    in-panel error if it's scrolled out of view.
  - Both use a stable toast `id` (`pp-tool-success` / `pp-tool-error`) so React StrictMode's
    dev double-invoke collapses to ONE visible toast (also prevents stacking).
- `CompressTool` passes `quietToast` (keeps its before→after size `toast.success`).
  `GrayscalePdf` keeps the generic success toast + its conditional `sizeGrew` warning.
- No duplication with FileDropzone: its toasts are input-validation (wrongType/tooLarge/
  corrupt) fired BEFORE processing; the panel toasts are the processing result. No tool
  raises its own *error* toast, so ErrorBanner never doubles one.
- Coverage note: tools whose success uses a CUSTOM result panel rather than the shared
  SuccessPanel (e.g. Summarize's AI output, PDF→JPG gallery) won't emit a success toast;
  any of them that surface failures via ErrorBanner still get the error toast.
- Verify: build green, no MISSING_MESSAGE. Live toast behaviour needs browser gate.
