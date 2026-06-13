# CLAUDE_8.md — PlinyPDF Phase 8: Edit PDF Polish

> Read this file first at the start of every Phase 8 session.
> Phase 1-7 docs are READ-ONLY.
> All Phase 8 memory lives under `docs/phase_8/`.

---

## 1. What this phase does

Phase 8 is the final polish phase for the Edit PDF cloud tool.
No new tools, no new backend features. Goal: bring Edit PDF up
to Sejda/Figma-quality interactions.

5 things to ship:

1. **Add Text bug fix** — clicking outside auto-commits the draft
   (no Enter required), no new draft created while one is active.
2. **Snap/Alignment guides** — Figma-style snap lines during drag
   (page center, block-to-block, margins).
3. **Smart auto-resize** — text blocks adapt to content automatically
   (no manual resize handles).
4. **Mobile responsive** — bottom-fixed toolbar, bottom sheets,
   touch-optimized targets, every tool reachable.
5. **Performance + Toolbar UX audit** — single-active dropdown,
   z-index fixes, memory leak audit, no overlap issues.

---

## 2. User-Confirmed Decisions

| Decision | Choice |
|---|---|
| Text block resize | **A) Auto-resize (smart)** — block adapts to content |
| Snap guides | **B) Full snap** — page center + block-to-block + margins |
| Mobile toolbar | **B) Bottom-fixed** — Foxit/Xoxo pattern |
| Toolbar UX cleanup | **Included** in Wave 8E |

---

## 3. Design Handoff

UI changes are significant. A Claude Design handoff will be
created BEFORE Wave 8B starts.

When starting Wave 8B (or any visual wave), ask the user:
"Please provide the Claude Design handoff link for Phase 8."

Then:
- Fetch the design bundle
- Save to `.design-handoff/phase-8/`
- Confirm screens fetched
- Reference designs while building UI

The design covers:
- Mobile bottom toolbar + bottom sheets
- Snap guide visuals (indigo dashed, page center, block-to-block, margins)
- Text block edit mode with smart auto-resize visual
- Toolbar 2-row cleanup (desktop)
- Find & Replace side panel
- Color picker, font picker, stamps/marks bottom sheets
- Light + dark modes (dark primary)
- 1440px desktop + 375px mobile

---

## 4. Waves

### Wave 8A — Add Text Bug Fix

**Goal:** Fix the Add Text tool so clicking outside commits the
draft automatically (no Enter required, no new draft created).

**The bug today:**
1. User selects "Add Text" tool, clicks PDF → "Type here..." box opens
2. User types text
3. User clicks elsewhere on PDF → new draft opens, original is lost
4. User must press Enter to save the text — undiscoverable

**Expected behavior (matches Annotate PDF):**
1. Click PDF → draft opens
2. Type text
3. Click elsewhere → original draft auto-commits, new draft opens
4. Or click outside PDF entirely → draft commits, no new draft
5. Enter is optional (still works), Esc cancels

**Implementation:**
- In `EditorCanvas.tsx` (or wherever Add Text draft is handled):
  - When a draft is active and user clicks somewhere:
    - If clicking on PDF in Add Text mode → commit current draft
      FIRST, then start new draft at new location
    - If clicking outside PDF → commit current draft, no new draft
  - Add blur event handler to draft textarea → commit on blur
  - Keep Enter as commit shortcut (don't break it)
  - Esc cancels (discards draft)

**Files likely touched:**
- `components/tools/EditPdf/EditorCanvas.tsx`
- `components/tools/EditPdf/TextBlock.tsx` (if draft uses it)
- `lib/stores/editorStore.ts` (draft state)

**GATE 8A:**
- Click in Add Text mode → type → click elsewhere → 
  first text committed, new draft appears
- Click outside PDF → draft commits, no new draft
- Enter still works
- Esc cancels
- `bun run build` green
- No regression in existing text editing

**No backend changes** — frontend only, Vercel auto-deploys.

---

### Wave 8B — Snap / Alignment Guides

**Goal:** Show indigo dashed snap lines when dragging a text 
block, image, stamp, or annotation, like Figma/Sejda.

**Before starting:** Ask user for the Claude Design handoff link.

**Snap targets:**
1. **Page center** — horizontal center line at `pageHeight/2`,
   vertical center line at `pageWidth/2`
2. **Block-to-block** — when dragged element's edge (left, right,
   top, bottom, h-center, v-center) is within 8px of any other
   block's edge/center
3. **Margins** — page margins at 36pt and 72pt from each edge

**Visual:**
- Indigo dashed line (`#6B5CE7`, 1px dashed)
- Only visible during active drag (when pointer is down)
- Disappears immediately on drop
- Multiple guides can show simultaneously (e.g. h-center + v-center)

**Snap behavior:**
- Threshold: 8px in display pixels (scaled to PDF points)
- When within threshold → element snaps to the guide position
- User can override by dragging beyond threshold

**Implementation:**
- New file: `lib/editor/snapGuides.ts`
  - `calculateSnapTargets(currentBlock, otherBlocks, pageSize)`
    returns array of snap candidates
  - `findClosestSnap(position, targets, threshold)` returns 
    snap position + which guides to show
- In `EditorCanvas.tsx` drag handler:
  - During drag: call findClosestSnap on every pointermove
  - If snap found → adjust position, render guide overlays
  - On drop: clear guides
- New component: `SnapGuideOverlay.tsx`
  - Absolutely positioned divs/lines on the canvas
  - Rendered above PNG, below dragged element

**Performance:**
- Throttle pointermove with `requestAnimationFrame`
- Cache snap targets at drag start (recalculate only if 
  another block is added/removed during drag — rare)
- Skip snap calc if pointer is moving fast (>50px/frame)

**Applies to:**
- Text blocks (existing + new)
- Images
- Stamps
- Shapes (rect, circle)
- Marks
- Comments (sticky note pins)

**GATE 8B:**
- Drag a text block near page center → vertical center line 
  appears, block snaps
- Drag near another block's edge → snap line appears, snaps
- Drag near page margin (36pt) → margin line appears, snaps
- All 5 element types snap (text, image, stamp, shape, mark)
- Guides disappear on drop
- Performance: 60fps drag with 20+ blocks on page
- Mobile touch: same behavior with pointer events
- `bun run build` green

**No backend changes** — frontend only.

---

### Wave 8C — Smart Auto-Resize Text Blocks

**Goal:** Text blocks adapt their dimensions to content
automatically. No manual resize handles. Alignment now works
naturally because block width = content width.

**Why this matters:**
- Currently alignment (left/center/right) doesn't visibly work
  because text fills the entire block
- Resize was removed in Wave 6A due to regressions (block shrunk
  but UI didn't sync)
- Auto-resize avoids the regression because there's no separate
  user "size" state — block size is always derived from content

**Algorithm:**
- After every text edit (typing, font change, size change):
  1. Measure content width using canvas `measureText`
  2. Measure content height (line count × line height)
  3. Set block width = max(measured + padding, minWidth)
  4. Set block height = measured + padding
- Width snaps to longest line + 12pt padding
- Height snaps to total line count × lineHeight + 8pt padding
- Min width: 50pt (avoid 0-width blocks)
- Max width: page width - 36pt margin

**Alignment integration:**
- With block width = content width, left/center/right alignment
  is equivalent (text fills block)
- Solution: alignment applies to the BLOCK position on page,
  not text within block:
  - Left → block aligned to left margin
  - Center → block centered on page
  - Right → block aligned to right margin
- Toolbar alignment buttons reposition the block, not align text inside

**Implementation:**
- New helper: `lib/editor/textMeasure.ts`
  - `measureText(text, fontFamily, fontSize, bold, italic)` → 
    { width, height, lineWidths }
- Update `TextBlock.tsx`:
  - On content change → call measureText → update blockSizes
  - blockSizes already exists from old resize code (still in store?)
  - If removed: re-add to editorStore.ts as derived state
- Update toolbar alignment buttons:
  - When clicked → reposition block on page (left/center/right)
  - Not align text within block
- Update `pdf-editor.py` if needed:
  - Block position in PDF respects new alignment-as-position model

**Migration concern:**
- Existing PDF text blocks (loaded from server) have their 
  original positions — don't auto-resize them on load
- Auto-resize only triggers when user EDITS the block
- New blocks (Add Text) auto-resize from the start

**Risk mitigation (avoid old regression):**
- Block UI and server state must stay in sync
- After auto-resize calculation:
  1. Update blockSizes immediately (UI shows new size)
  2. Send size to server with next save (not on every keystroke)
- Verify by: edit block → resize → close PDF → reopen → 
  block has new size in saved PDF

**GATE 8C:**
- Type long text → block grows to fit
- Delete text → block shrinks to fit
- Change font size → block adjusts
- Change font family → block adjusts (font width different)
- Click left/center/right alignment → block repositions on page
- Existing blocks (from loaded PDF) keep original size until edited
- Save PDF → reopen → block size persists correctly
- No regression: clicking different block doesn't show wrong size
- `bun run build` green

**Backend may need changes** — block size now stored in changes.json.

---

### Wave 8D — Mobile Responsive + Bottom Toolbar

**Goal:** Edit PDF fully usable on mobile (375px viewport).
All tools reachable via touch. Bottom-fixed toolbar pattern.

**Before starting:** Reuse Claude Design handoff from 8B (same link).

**Mobile changes:**

**A. Bottom-fixed toolbar:**
- Move toolbar from top to bottom on mobile (<768px)
- Single horizontal scrollable row of tool icons
- Min touch target: 44×44px
- Active tool: indigo background + white icon
- Tool icons only (no labels on mobile)

**B. Bottom sheets for dropdowns:**
- Stamps dropdown → bottom sheet (full width, slide up)
- Marks dropdown → bottom sheet
- Color picker → bottom sheet
- Font/size picker → bottom sheet (when text tool active)
- All sheets: drag handle at top, dimmed backdrop, 
  swipe-down to dismiss, Esc/tap-outside to close
- Spring animation on open/close

**C. Touch targets:**
- All overlay control buttons (X, resize handle): min 44×44px
- Sticky note pin: 32×32px (currently 24×24px)
- Stamp resize handle: 16×16px on mobile (currently 10×10px)
- Whiteout/highlight drag: full-finger area

**D. PDF navigation:**
- Pinch-to-zoom (already exists, verify works)
- Swipe left/right to navigate pages
- Pages thumbnail drawer: collapsible from left edge
  (currently sidebar, takes too much space on mobile)

**E. Text editing on mobile:**
- Double-tap text block → edit mode
- Edit mode shows: keyboard up, font/size bottom sheet visible
- Single tap outside → commit (Wave 8A behavior)
- Long-press text block → context menu (Copy, Duplicate, Delete)

**F. Responsive breakpoints:**
- 375px (mobile portrait)
- 768px (tablet / mobile landscape)
- 1024px+ (desktop, current layout)
- Below 768px: bottom toolbar, sheets, mobile patterns
- 768px+: existing top toolbar

**Implementation:**
- Detect viewport: useMediaQuery hook or CSS media queries
- New component: `MobileToolbar.tsx` (bottom-fixed)
- New component: `BottomSheet.tsx` (reusable for all dropdowns)
- Update existing toolbar to hide on mobile
- Update all overlay components for touch targets
- Pages drawer: extract from current sidebar layout

**Risks:**
- Pinch-zoom interferes with snap guides (8B)
  → Disable snap during active pinch
- Touch events vs pointer events — already using pointer events
  (good, no rewrite needed)
- Bottom sheet collision with iOS Safari bottom bar
  → Use `dvh` units, safe-area-inset-bottom CSS

**GATE 8D:**
- Open Edit PDF on iPhone (375px): toolbar at bottom
- Every tool tappable via touch
- Stamps/Marks/Colors open as bottom sheets
- Bottom sheet: drag handle, swipe-down dismiss, backdrop
- Pinch-zoom works on PDF page
- Swipe between pages
- Long-press text block → context menu
- All overlays (text, stamp, image, comment, mark) draggable by touch
- iPad (768px): hybrid layout (top toolbar but larger targets)
- Desktop (1024px+): unchanged
- `bun run build` green

**No backend changes** — frontend only.

---

### Wave 8E — Performance, Toolbar UX, Audit

**Goal:** Zero overlap issues, no memory leaks, single-active 
dropdown state, performance audit.

**Issues to fix:**

**A. Single-active dropdown:**
- Currently: color picker, font dropdown, shapes dropdown can 
  all be open at once
- Fix: when one dropdown opens → close all others
- Implement: `activeDropdown` state in editorStore
- All dropdowns subscribe; opening one sets state to its name; 
  others close

**B. Z-index audit:**
- Audit all overlays: text blocks, annotations, snap guides, 
  bottom sheets, color pickers
- Define z-index hierarchy:
  ```
  1: page PNG
  10: text blocks
  20: annotations (highlight, draw, shapes, etc)
  30: stamps/images/marks
  40: snap guides
  50: hover X buttons / resize handles
  100: bottom sheets / dropdowns
  200: modals (Find & Replace, Confirm dialog)
  ```
- Update CSS variables for consistency

**C. Memory leak audit:**
- Check event listeners cleanup in useEffect
- Check object URLs (image upload) — revoke on unmount
- Check pointer event handlers — remove on drop
- Check setTimeout/setInterval — clear on cleanup
- Run: open Edit PDF → make 20 edits → close → check memory

**D. Performance audit:**
- 60fps drag with 50+ blocks
- Page navigation smooth with 50 pages
- Find & Replace replace-all on long doc <3 seconds
- Initial PDF open with 100 pages <10 seconds (already 
  measured in 7E)
- Profile with React DevTools, optimize hot components

**E. Toolbar UX final pass:**
- Tooltips on all buttons (desktop)
- Keyboard shortcuts visible in tooltips
- Disabled state for buttons that need selection
- Loading state for long ops (save, find-replace)
- Error toasts for failures

**GATE 8E:**
- Only one dropdown open at a time, verified
- No z-index overlaps (test stamp on text, snap guide visibility)
- Memory: heap doesn't grow after open/edit/save × 5
- Performance: drag 50 blocks smooth, no jank
- All tooltips present (desktop)
- Phase 8 docs complete: log, index, decisions, bugs
- All 5 waves marked complete
- Final commit: feat(editor): Phase 8 complete

---

## 5. Phase 8 memory — `docs/phase_8/`

Phase 1-7 docs are READ-ONLY. Create:

```
docs/phase_8/
  index.md
  decisions.md
  architecture.md
  bugs.md
  log.md
  waves/
    wave_8a.md
    wave_8b.md
    wave_8c.md
    wave_8d.md
    wave_8e.md
```

---

## 6. Constraints

- Do NOT add new tools — Phase 8 polishes existing Edit PDF only
- Do NOT touch other tools (PDF to Text, Repeat, Booklet, etc.)
- Do NOT touch Phase 1-7 docs
- All UI text in EN/TR/RU (3 locales)
- `bun run build` green after each sub-task
- Do NOT commit until gate confirmed by user
- Hetzner deploy only when Python (`pdf-editor.py`) changes
  (likely Wave 8C only)
- Design handoff: ask user for link when starting Wave 8B
- Match Sejda/Figma quality on snap interactions
- Match native iOS/Android quality on mobile bottom sheets

---

## 7. Out of scope

- New tools (Phase 7 complete with 33 tools)
- Backend infrastructure changes
- Annotate PDF changes (different tool)
- Multi-block selection (defer to Phase 9 if needed)
- Real-time collaboration
- AI features in Edit PDF
- Form fields (input, checkbox, radio, signature fields)
- Page reordering inside Edit PDF (use Organize Pages tool)
- Track changes / version history
- Comments threading

---

## 8. Session bootstrap

1. Read this file (`CLAUDE_8.md`)
2. Read `docs/phase_8/index.md` — if doesn't exist, create tree
3. Resume at current wave's next un-done task
4. For Wave 8B+ (visual changes): ask user for design link
5. Backend changes only in Wave 8C — Hetzner deploy needed there

---

## 9. Wave Summary

| Wave | Goal | Time | Risk | Backend? |
|---|---|---|---|---|
| 8A | Add Text bug fix | 0.5 day | Low | No |
| 8B | Snap/alignment guides | 3 days | Low | No |
| 8C | Smart auto-resize | 2 days | Medium | Maybe |
| 8D | Mobile responsive | 4 days | Low | No |
| 8E | Performance + UX audit | 2 days | Low | No |

**Total: ~11-12 days, 5 waves**

After Phase 8: Edit PDF reaches Sejda/Figma-quality interactions,
fully mobile-usable, no known bugs in the tool.

---

## 10. Known good baseline (Phase 7 ended here)

- 33 tools total (25 local + 8 cloud)
- 2-tier system (anon + free), Pro removed from UI
- Edit PDF: 10MB/15pg anon, 30MB/50pg free
- All Phase 6 features stable: text move, fonts (incl. Noto),
  underline burn, image, stamps, links, marks, whiteout/blackout,
  highlight (6 colors), shapes (fill), comments (4 colors), F&R
- Backend: Hetzner with PyMuPDF 1.27.2
- Frontend: Vercel auto-deploy from main
