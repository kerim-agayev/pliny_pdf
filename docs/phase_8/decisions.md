# Phase 8 — Decisions

| Decision | Choice | Reason |
|---|---|---|
| Text block resize | Auto-resize (smart) | Block adapts to content; avoids old resize regression |
| Snap guides | Full snap | Page center + block-to-block + margins |
| Mobile toolbar | Bottom-fixed | Foxit/Xoxo pattern, native feel |
| Toolbar UX cleanup | Included in Wave 8E | Keep scope focused per wave |
| Find & Replace in UI | Removed (mobile + desktop) | User decision (Wave 8D). Previously removed at D6-2 / D6-10 but kept getting re-added. `FindReplaceModal.tsx` and the store actions (`openFindReplace` etc.) stay intact for potential future use — only the toolbar button, mobile Find pill, and the Ctrl/Cmd+H shortcut were removed. |
| Single-active dropdown impl (8E) | Local `openMenu` state in EditorToolbar (not global `activeDropdown` in store) | All three popovers (shapes/stamp/marks) live in one component; mobile already coordinates its own single `sheet`. A store field would be needless plumbing — surgical-changes principle. |
| Z-index scope (8E) | Light touch — keep existing values, document, no renumber | The existing 13-layer scheme (1→100) had no observed overlaps. Renumbering to the CLAUDE_8 spec table would be churn requiring re-test of every overlay for zero benefit. Added a legend comment instead. |
