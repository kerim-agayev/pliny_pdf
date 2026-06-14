# Wave 8D — Mobile Responsive + Bottom Toolbar

## Status: DONE ✅ (GATE passed 2026-06-14)

## Goal
Edit PDF fully usable on mobile (375px viewport).
Bottom-fixed toolbar, bottom sheets, touch targets.

## What shipped
- **New** `lib/hooks/useMediaQuery.ts` (SSR-safe `(max-width:767px)`),
  `BottomSheet.tsx` (spring entry, drag-handle + swipe-down dismiss >96px, dimmed
  backdrop, Esc), `MobileToolbar.tsx` (bottom-fixed horizontal-scroll tool row + per-tool
  sheets: text / color / stroke / shapes / stamps / marks, bound to the existing store
  constants — mobile == desktop).
- **Mobile chrome** (index.tsx): hides desktop `EditorToolbar` + `EditorStatusBar`; adds a
  secondary controls row (undo/redo + page-nav), a Pages FAB (reuses the existing left
  thumbnail drawer, offset to `top:100px`/`bottom:72px`), and a one-shot pinch/swipe hint.
- **Touch UX** (EditorCanvas / TextBlock): single-finger horizontal swipe → page turn
  (select tool, bare page only, suspended during pinch); 500ms long-press → context menu;
  `isPinching` guard on snap + all drag/draw begins; bigger overlay targets (X / resize /
  comment pin) via mobile CSS; safe-area-inset on the bottom row + sheets.
- **ContextMenu**: added Duplicate row; closes on touch-outside.
- Design from `.design-handoff/phase-8/` (`edit-redesign-mobile.jsx`) — the real Phase 8
  mobile spec; sheets re-mapped to existing palettes/fonts (D1–D7, see plan).
- **Find & Replace removed from UI** (desktop button + mobile pill + Ctrl/Cmd+H);
  `FindReplaceModal` + store actions kept intact (see decisions.md).
- i18n EN/TR/RU. Frontend-only — no Hetzner deploy.

## See CLAUDE_8.md §4 Wave 8D for full spec.
