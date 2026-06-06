# Wave 4B — Frontend: Editor UI

**BLOCKED:** requires the Claude Design handoff. Do NOT start without it.

When reached: ask the user for the handoff URL, fetch it, save screens to
`.design-handoff/edit-pdf/`, confirm screen count, then build the frontend to
match exactly (17 states — see CLAUDE_4 §"Design handoff").

Scope: `app/[locale]/edit-pdf/page.tsx`, `components/tools/EditPdf.tsx` + the
EditorCanvas / EditorToolbar / PageThumbnails / EditorStatusBar / TextBlock /
WhiteoutTool / HighlightTool / DrawingTool / CommentTool / FindReplaceModal /
ContextMenu / SessionWarning components, Zustand store, `lib/tools.ts` entry,
SEO + i18n + PostHog events.
