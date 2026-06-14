# Phase 8 — Decisions

| Decision | Choice | Reason |
|---|---|---|
| Text block resize | Auto-resize (smart) | Block adapts to content; avoids old resize regression |
| Snap guides | Full snap | Page center + block-to-block + margins |
| Mobile toolbar | Bottom-fixed | Foxit/Xoxo pattern, native feel |
| Toolbar UX cleanup | Included in Wave 8E | Keep scope focused per wave |
| Find & Replace in UI | Removed (mobile + desktop) | User decision (Wave 8D). Previously removed at D6-2 / D6-10 but kept getting re-added. `FindReplaceModal.tsx` and the store actions (`openFindReplace` etc.) stay intact for potential future use — only the toolbar button, mobile Find pill, and the Ctrl/Cmd+H shortcut were removed. |
