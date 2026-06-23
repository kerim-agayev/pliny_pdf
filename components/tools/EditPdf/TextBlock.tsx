"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { TextBlock as TBlock, BlockChange } from "@/lib/api/editor";
import { TEXT_LINE_RATIO } from "@/lib/editor/snapGuides";
import { cssFont } from "@/lib/editor/textMeasure";

// cssFont's single source of truth is textMeasure (so measuring + rendering agree);
// re-exported here for existing importers (EditorCanvas).
export { cssFont };

/**
 * A single editable text block, absolutely positioned over the page PNG. Pristine
 * blocks are transparent (the PNG shows the text); once a block is edited or being
 * edited, it masks the original with white and renders the new text on top — a live
 * approximation of what the server will redact + re-insert on save.
 */
export function TextBlock({
  block,
  change,
  scale,
  selected,
  editing,
  interactive,
  pos,
  size,
  pageWidth,
  blockStyle,
  onSelect,
  onStartEdit,
  onMove,
  onResize,
  onInput,
  onContextMenu,
  onLongPress,
  onSnapStart,
  onSnapMove,
  onSnapEnd,
}: {
  block: TBlock;
  change: BlockChange | undefined;
  scale: number;
  selected: boolean;
  editing: boolean;
  /** false (non-select tools) → let pointer events fall through to the canvas */
  interactive: boolean;
  /** client-only position override (PDF points) from drag-to-move */
  pos: { x: number; y: number } | undefined;
  /** client-only size override (PDF points) from Wave 8C auto-resize */
  size: { w: number; h: number } | undefined;
  /** current page width (PDF points) — clamps auto-resize max width */
  pageWidth: number;
  /** client-only visual style (underline / alignment) — not sent to the server */
  blockStyle: { underline?: boolean; textAlign?: "left" | "center" | "right" } | undefined;
  onSelect: () => void;
  onStartEdit: () => void;
  onMove: (x: number, y: number) => void;
  /** report a content-derived size (PDF points) while editing (Wave 8C) */
  onResize: (w: number, h: number) => void;
  onInput: (text: string) => void;
  onContextMenu: (e: React.MouseEvent) => void;
  /** Wave 8D: touch long-press → context menu (client coords). */
  onLongPress?: (x: number, y: number) => void;
  /** Wave 8B snap hooks (optional): cache targets / snap a box / clear guides. */
  onSnapStart?: () => void;
  onSnapMove?: (box: { x: number; y: number; w: number; h: number }) => { x: number; y: number };
  onSnapEnd?: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const lastTap = useRef(0);
  // Wave 8D long-press: timer fires the context menu after 500ms of a stationary touch.
  const lpTimer = useRef<number | null>(null);
  const lpStart = useRef<{ x: number; y: number } | null>(null);
  const clearLongPress = () => { if (lpTimer.current != null) { window.clearTimeout(lpTimer.current); lpTimer.current = null; } lpStart.current = null; };
  const [moveOffset, setMoveOffset] = useState<{ dx: number; dy: number } | null>(null);
  const dragState = useRef<{ startX: number; startY: number; moved: boolean } | null>(null);
  const cancelMoveRef = useRef<(() => void) | null>(null);
  // Last snapped PDF position during a drag (Wave 8B) — committed on pointer-up.
  const lastSnapped = useRef<{ x: number; y: number } | null>(null);

  const deleted = change?.deleted ?? false;
  const text = change?.newText ?? block.text;
  const modified =
    change !== undefined &&
    (change.newText !== undefined ||
      change.deleted ||
      change.color ||
      change.fontSize !== undefined ||
      change.bold !== undefined ||
      change.italic !== undefined ||
      // bgColor-only change must show the mask on select too (Wave 11B GATE fix).
      change.bgColor !== undefined);
  // Show overlay whenever the block has visible state beyond what the PNG carries:
  // edited content, a style override (underline), or a position override (moved —
  // the PNG still has the original text at the old spot, so the overlay must paint
  // the text at the new spot, and a ghost mask covers the old spot below).
  const masked = editing || modified || moveOffset !== null || !!blockStyle?.underline || !!pos;
  // Only text/layout-affecting changes drive the auto-resize re-measure (Wave 11B GATE
  // fix). bgColor / text color / selection must NOT trigger it — otherwise a bgColor-only
  // change inflated the box to the 50pt min-width floor, making the fill far wider/taller
  // than the glyphs. The fill (masked) still shows; the box just keeps its tight bbox.
  const contentChanged =
    change !== undefined &&
    (change.newText !== undefined ||
      change.fontSize !== undefined ||
      change.bold !== undefined ||
      change.italic !== undefined);

  const fontSizeRaw = change?.fontSize ?? block.fontSize;
  const fontSize = fontSizeRaw * scale;
  const fontName = change?.fontName ?? block.fontName;
  const color = change?.color ?? block.color ?? "#1f1f1f";
  const bold = change?.bold ?? block.bold;
  const italic = change?.italic ?? block.italic;

  // Seed the contenteditable once when entering edit mode (uncontrolled while typing).
  // useLayoutEffect (not useEffect) so the content is in the DOM *before* the measure
  // effect below reads its size, and before paint — no empty-box flash.
  useLayoutEffect(() => {
    if (editing && ref.current && ref.current.innerText !== text) {
      ref.current.innerText = text;
      const sel = window.getSelection();
      const r = document.createRange();
      r.selectNodeContents(ref.current);
      r.collapse(false);
      sel?.removeAllRanges();
      sel?.addRange(r);
    }
  }, [editing]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-resize (Wave 8C, fixed): the box is derived from a hidden measurement div
  // (below) that renders the exact text + styles at content width — read via
  // getBoundingClientRect, the precise layout the browser will paint (no canvas
  // approximation, no contentEditable phantom-line height). It fires for any *edited*
  // block (`modified`) as well as while editing, so a font/size/bold change updates the
  // size immediately in display mode too — no need to re-enter edit mode. Pristine
  // loaded blocks (no change entry) never re-measure, keeping their original bbox.
  // Runs in a layout effect (before paint) so there's no wrap/flash.
  useLayoutEffect(() => {
    if (!(editing || contentChanged) || !measureRef.current) return;
    // WIDTH comes from the mirror (exact rendered text width, clamped to the page).
    // HEIGHT is derived from the font size × line count (same TEXT_LINE_RATIO the snap
    // engine uses) — NOT from the DOM. A DOM/line-box height is a couple of px taller
    // than the PDF line pitch, which made the white box creep down over the block below.
    // Font-metric height stays tight: a long single line grows the box to the RIGHT, not
    // DOWN; height only changes with the font size or explicit newlines.
    const maxW = pageWidth - 36;
    // Real measured text width (no min floor) — the manual-bg highlight hugs this so
    // shortening text shrinks the color (Wave 11B round-5). The ≥50pt click target is
    // applied separately at boxW, not here.
    const w = Math.min(maxW, measureRef.current.scrollWidth / scale + 4);
    const lineCount = (text.match(/\n/g)?.length ?? 0) + 1;
    // 1.15 is tight (just above the editable's 1.12 line-height, so glyphs/descenders
    // aren't clipped) but small enough that a single-line box stays within the PDF line
    // pitch and never covers the top of the block below.
    const h = fontSizeRaw * 1.15 * lineCount;
    onResize(w, h);
  }, [editing, modified, text, fontName, fontSizeRaw, bold, italic, scale, pageWidth]); // eslint-disable-line react-hooks/exhaustive-deps

  const border = editing || selected ? "2px solid #6B5CE7" : "1px solid transparent";
  // Wave 11B round-4: two distinct fills.
  // - ghostFill hides the OLD baked PNG text at the ORIGINAL bbox → always the
  //   sampled page bg (11A), NEVER the manual override. So shortening text leaves
  //   the emptied area as the page bg, not a smear of the manual color.
  // - maskColor is the visible bg behind the CURRENT text (manual override wins),
  //   painted by the root div at the current box (auto-resized when edited).
  const ghostFill = block.bgColor ?? "#fff";
  const maskColor = change?.bgColor ?? block.bgColor ?? "#fff";
  // On MOVE only the text travels — the ghost mask (at the ORIGINAL bbox) keeps the
  // gray, and the moved root must be transparent so the gray doesn't ride along
  // (matches Sejda). The backend already redacts only the original bbox. Edit-in-
  // place keeps maskColor so widened text still blends into a colored row.
  const moved = moveOffset !== null || pos != null;
  // Root div no longer paints the manual bg (the dedicated highlight div below does,
  // hugging the real text). Root only shows the subtle selection tint (Wave 11B round-5).
  const bg = moved || !(selected || editing) ? "transparent" : "rgba(107,92,231,0.06)";

  // Effective size: content-derived override (Wave 8C) if the block has been edited,
  // else the original bbox from the loaded PDF.
  // bgFillW = real text width → the manual-bg highlight hugs it. boxW = the interaction
  // box, floored to a ≥50pt click target so the floor never widens the visible color.
  const bgFillW = (size?.w ?? block.w) * scale;
  const boxW = Math.max(50, size?.w ?? block.w) * scale;
  const boxH = (size?.h ?? block.h) * scale;

  // Use position override if present (drag-to-move), else original block coords.
  const blockLeft = (pos?.x ?? block.x) * scale;
  const blockTop = (pos?.y ?? block.y) * scale;

  // The PNG always carries the text at its ORIGINAL coords AND original size (no
  // re-render until save), so the white mask that hides it must use the ORIGINAL bbox
  // — not the (possibly smaller) auto-resized box, or shrinking text would let the
  // baked PNG text leak out beyond the mask.
  const origLeft = block.x * scale;
  const origTop = block.y * scale;
  const origW = block.w * scale;
  const origH = block.h * scale;

  // Shared position/size style used by both the ghost mask and the root div.
  const boxStyle: React.CSSProperties = {
    position: "absolute",
    left: blockLeft,
    top: blockTop,
    width: boxW,
    height: boxH,
    overflow: "hidden",
    borderRadius: 3,
    boxSizing: "content-box" as const,
    // Horizontal inset only (3px) for a little selection breathing room. Vertical
    // padding/margin is 0: with content-box, vertical padding would ADD to the rendered
    // height (and the negative margin would push the top up), making the white box spill
    // ~4px into the row below and cover the top of the next block (Wave 8C). Height is
    // already tight from the font-metric formula, so no vertical slack is needed.
    margin: "0 -3px",
    padding: "0 3px",
  };

  // Drag-to-move gesture on the block container when selected and not editing.
  function startMove(e: React.PointerEvent) {
    if (editing) return;

    // Cancel any still-pending drag (e.g. from a rapid double-click's first pointer-down).
    cancelMoveRef.current?.();

    const startX = e.clientX;
    const startY = e.clientY;
    const baseX = pos?.x ?? block.x;
    const baseY = pos?.y ?? block.y;
    dragState.current = { startX, startY, moved: false };
    lastSnapped.current = null;
    onSnapStart?.();

    const cleanup = () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      cancelMoveRef.current = null;
      dragState.current = null;
      lastSnapped.current = null;
      setMoveOffset(null);
      onSnapEnd?.();
    };

    const handleMove = (ev: PointerEvent) => {
      if (!dragState.current) return;
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
        dragState.current.moved = true;
        // Candidate position in PDF points, snapped to alignment targets, then
        // expressed back as a display-px offset for the live transform.
        const candX = baseX + dx / scale;
        const candY = baseY + dy / scale;
        // Snap by the same uniform font-derived line box used for target blocks
        // (collectSnapBoxes), so bottoms align consistently with stored bbox.
        const snapFontSize = change?.fontSize ?? block.fontSize;
        const snapped = onSnapMove?.({ x: candX, y: candY, w: block.w, h: snapFontSize * TEXT_LINE_RATIO }) ?? { x: candX, y: candY };
        lastSnapped.current = snapped;
        setMoveOffset({ dx: (snapped.x - baseX) * scale, dy: (snapped.y - baseY) * scale });
      }
    };
    const handleUp = (ev: PointerEvent) => {
      const moved = dragState.current?.moved ?? false;
      const snapped = lastSnapped.current;
      cleanup();
      if (moved) {
        if (snapped) {
          onMove(snapped.x, snapped.y);
        } else {
          const dx = ev.clientX - startX;
          const dy = ev.clientY - startY;
          onMove(baseX + dx / scale, baseY + dy / scale);
        }
      }
    };

    cancelMoveRef.current = cleanup;
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
  }

  // A deleted block renders ONLY the covering mask at its original spot — no
  // interactive root, so there's no empty selectable placeholder left behind
  // (Sejda-style: text gone, the row's background stays intact). The mask still
  // hides the stale PNG text (not re-rendered until save). bgColor → gray on a
  // colored row, white otherwise.
  if (deleted) {
    return (
      <div
        style={{
          ...boxStyle,
          left: origLeft,
          top: origTop,
          width: origW,
          height: origH,
          transform: undefined,
          zIndex: -1,
          background: ghostFill,
          pointerEvents: "none",
          border: "1px solid transparent",
        }}
      />
    );
  }

  return (
    <>
      {/* White mask pinned at the ORIGINAL bbox (position AND size) hides the stale PNG
          text whenever the overlay is showing edited/moved/styled content — the PNG
          isn't re-rendered until save. It uses the original size (not the auto-resized
          box) so that shrinking the text never lets the baked PNG text leak out past
          the mask (Wave 8C fix). On grow, the content box extends past this mask over
          empty page area, so its own white background covers the rest.
          z-index is -1 (Wave 8E): inside the page's isolated stacking context this puts
          the mask just ABOVE the page PNG (which is at -2, so the stale text is masked)
          but BELOW every block content AND every annotation overlay (all `auto`/positive).
          Previously this was `auto` and rendered inline per block, so a MOVED block's
          ghost (at its old spot) painted OVER another block's text that had been moved
          there — ghosts accumulated/stacked. Negative z fixes that: every ghost is below
          every block's content, so no ghost can cover text. Annotations stay on top of
          ghosts (D6-11); the dragged block keeps zIndex 100 (D6-12). */}
      {masked && (
        <div
          style={{
            ...boxStyle,
            left: origLeft,
            top: origTop,
            width: origW,
            height: origH,
            transform: undefined,
            zIndex: -1,
            background: ghostFill,
            pointerEvents: "none",
            border: "1px solid transparent",
          }}
        />
      )}

      {/* Wave 11B round-5: the VISIBLE manual bg — a highlight that hugs the CURRENT
          text. Sized to the real (un-floored) text box, NOT the ≥50pt interaction box,
          so shortening text shrinks the color too. Sits above the sampled ghost (also
          zIndex -1, rendered before this) and below the text. Skipped while moving. */}
      {masked && !moved && (
        <div
          style={{
            position: "absolute",
            left: blockLeft,
            top: blockTop,
            width: bgFillW,
            height: boxH,
            borderRadius: 3,
            zIndex: -1,
            background: maskColor,
            pointerEvents: "none",
          }}
        />
      )}

      {/* Hidden measurement mirror (Wave 8C): renders the exact text + current styles at
          content width so the layout-effect above can read the precise rendered size in
          ANY mode (display or edit) — the single source of truth for the box size.
          Off-screen + hidden + non-interactive; only present for edited/editing blocks
          so it adds no DOM for pristine blocks. white-space:pre (no soft-wrap) so height
          tracks ONLY explicit \n — the width is clamped to the page in JS instead, and
          the editable below uses the same `pre` so display and measurement agree. */}
      {(editing || contentChanged) && (
        <div
          ref={measureRef}
          aria-hidden
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            visibility: "hidden",
            pointerEvents: "none",
            whiteSpace: "pre",
            width: "max-content",
            fontFamily: cssFont(fontName),
            fontSize: Math.max(6, fontSize),
            lineHeight: 1.12,
            fontWeight: bold ? 700 : 400,
            fontStyle: italic ? "italic" : "normal",
          }}
        >
          {text}
        </div>
      )}

      <div
        ref={rootRef}
        role="button"
        tabIndex={-1}
        onPointerDown={(e) => {
          if (!editing) {
            e.stopPropagation();
            onSelect();
            startMove(e);
            if (e.pointerType === "touch" && onLongPress) {
              lpStart.current = { x: e.clientX, y: e.clientY };
              const { clientX, clientY } = e;
              lpTimer.current = window.setTimeout(() => { lpTimer.current = null; onLongPress(clientX, clientY); }, 500);
            }
          }
        }}
        onPointerMove={(e) => {
          if (lpStart.current && (Math.abs(e.clientX - lpStart.current.x) + Math.abs(e.clientY - lpStart.current.y) > 10)) clearLongPress();
        }}
        onPointerUp={(e) => {
          clearLongPress();
          if (editing) return;
          if (dragState.current?.moved) return; // already handled in startMove
          // double-tap (touch) / double-click fallback → enter edit mode
          if (e.timeStamp - lastTap.current < 300) {
            e.stopPropagation();
            lastTap.current = 0;
            onStartEdit();
          } else {
            lastTap.current = e.timeStamp;
          }
        }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          cancelMoveRef.current?.();
          onStartEdit();
        }}
        onContextMenu={onContextMenu}
        className="pp-textblock"
        style={{
          ...boxStyle,
          border,
          background: bg,
          cursor: moveOffset ? "move" : (editing ? "text" : "pointer"),
          transition: moveOffset ? "none" : "border-color 0.12s, background 0.12s",
          transform: moveOffset ? `translate(${moveOffset.dx}px, ${moveOffset.dy}px)` : undefined,
          // Only lift the block above everything while it is ACTIVELY dragging
          // (clear drag feedback). After it settles at a new spot we leave z-index
          // `auto`: the block is rendered after its ghost in the DOM so it still
          // paints above the ghost (mask) by DOM order, while annotation overlays
          // (rendered later still) paint above the settled block — so draw/whiteout/
          // shape work at the new position too. See decisions.md D6-11/D6-12.
          zIndex: moveOffset ? 100 : undefined,
          // editing always stays interactive; otherwise only in select mode so
          // whiteout/highlight/text drags can start over existing text.
          pointerEvents: interactive || editing ? "auto" : "none",
        }}
      >
        {!deleted && (
          <div
            ref={ref}
            contentEditable={editing}
            suppressContentEditableWarning
            // contentEditable.innerText often appends a trailing newline (and browsers
            // wrap content in block elements); strip trailing newlines so a phantom blank
            // line can't permanently inflate the measured height. See Wave 8C bugs.
            onInput={(e) => onInput((e.target as HTMLDivElement).innerText.replace(/\n+$/, ""))}
            spellCheck={false}
            style={{
              fontFamily: cssFont(change?.fontName ?? block.fontName),
              fontSize: Math.max(6, fontSize),
              lineHeight: 1.12,
              color,
              fontWeight: bold ? 700 : 400,
              fontStyle: italic ? "italic" : "normal",
              textDecoration: blockStyle?.underline ? "underline" : "none",
              textAlign: blockStyle?.textAlign ?? "left",
              outline: "none",
              // `pre` (no soft-wrap) matches the measurement mirror, so the box height
              // only changes on explicit newlines — typing a long line never creeps
              // downward over the block below. The editable fills the box; box size is
              // driven by the mirror.
              whiteSpace: "pre",
              overflow: "hidden",
              width: "100%",
              height: "100%",
              // pristine, unselected blocks stay invisible so the PNG text shows through
              visibility: masked || editing ? "visible" : "hidden",
            }}
          >
            {!editing ? text : null}
          </div>
        )}
      </div>
    </>
  );
}
