# Wave 2B — 6 medium-priority local tools

Status: **pending** (starts after Gate 2A). No design handoffs — all ride the
existing `ToolShell` pattern.

## Order (CLAUDE_2.md §6)
1. `remove-metadata` — single button (simplest)
2. `edit-metadata` — form
3. `grayscale-pdf` — re-rasterize pages (heavier)
4. `flatten-pdf` — `form.flatten()`
5. `text-to-pdf` — textarea + format options
6. `markdown-to-pdf` — split editor + preview

Gate 2B after all 6. Commit: `feat(tools): Wave 2B — metadata, grayscale, flatten, text/markdown to PDF`.
