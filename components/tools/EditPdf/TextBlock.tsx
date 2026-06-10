"use client";

import { useEffect, useRef, useState } from "react";
import type { TextBlock as TBlock, BlockChange } from "@/lib/api/editor";

/** Map a PyMuPDF font name to a CSS family for the overlay approximation. */
export function cssFont(name: string): string {
  const n = (name || "").toLowerCase();
  if (n === "noto serif") return "'Noto Serif', Georgia, 'Times New Roman', serif";
  if (n === "noto sans mono") return "'Noto Sans Mono', var(--font-mono), monospace";
  if (n === "noto sans") return "'Noto Sans', 'Helvetica Neue', Arial, sans-serif";
  if (n.includes("times") || n.includes("serif") || n.includes("georgia")) return "Georgia, 'Times New Roman', serif";
  if (n.includes("cour") || n.includes("mono")) return "var(--font-mono), monospace";
  return "'Helvetica Neue', Arial, sans-serif";
}

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
  blockStyle,
  onSelect,
  onStartEdit,
  onMove,
  onInput,
  onContextMenu,
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
  /** client-only visual style (underline / alignment) — not sent to the server */
  blockStyle: { underline?: boolean; textAlign?: "left" | "center" | "right" } | undefined;
  onSelect: () => void;
  onStartEdit: () => void;
  onMove: (x: number, y: number) => void;
  onInput: (text: string) => void;
  onContextMenu: (e: React.MouseEvent) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const lastTap = useRef(0);
  const [moveOffset, setMoveOffset] = useState<{ dx: number; dy: number } | null>(null);
  const dragState = useRef<{ startX: number; startY: number; moved: boolean } | null>(null);
  const cancelMoveRef = useRef<(() => void) | null>(null);

  const deleted = change?.deleted ?? false;
  const text = change?.newText ?? block.text;
  const modified =
    change !== undefined &&
    (change.newText !== undefined ||
      change.deleted ||
      change.color ||
      change.fontSize !== undefined ||
      change.bold !== undefined ||
      change.italic !== undefined);
  // Show overlay whenever the block has visible state beyond what the PNG carries:
  // edited content, a style override (underline), or a position override (moved —
  // the PNG still has the original text at the old spot, so the overlay must paint
  // the text at the new spot, and a ghost mask covers the old spot below).
  const masked = editing || modified || moveOffset !== null || !!blockStyle?.underline || !!pos;

  // Seed the contenteditable once when entering edit mode (uncontrolled while typing).
  useEffect(() => {
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

  const fontSize = (change?.fontSize ?? block.fontSize) * scale;
  const color = change?.color ?? block.color ?? "#1f1f1f";
  const bold = change?.bold ?? block.bold;
  const italic = change?.italic ?? block.italic;

  const border = editing || selected ? "2px solid #6B5CE7" : "1px solid transparent";
  const bg = masked ? "#FFFFFF" : selected || editing ? "rgba(107,92,231,0.06)" : "transparent";

  const boxW = block.w * scale;
  const boxH = block.h * scale;

  // Use position override if present (drag-to-move), else original block coords.
  const blockLeft = (pos?.x ?? block.x) * scale;
  const blockTop = (pos?.y ?? block.y) * scale;

  // The PNG always carries the text at its ORIGINAL coords (no re-render until save),
  // so a moved block needs a white ghost pinned there to cover the stale PNG text.
  const origLeft = block.x * scale;
  const origTop = block.y * scale;

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
    margin: "-2px -3px",
    padding: "2px 3px",
  };

  // Drag-to-move gesture on the block container when selected and not editing.
  function startMove(e: React.PointerEvent) {
    if (editing) return;

    // Cancel any still-pending drag (e.g. from a rapid double-click's first pointer-down).
    cancelMoveRef.current?.();

    const startX = e.clientX;
    const startY = e.clientY;
    dragState.current = { startX, startY, moved: false };

    const cleanup = () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      cancelMoveRef.current = null;
      dragState.current = null;
      setMoveOffset(null);
    };

    const handleMove = (ev: PointerEvent) => {
      if (!dragState.current) return;
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
        dragState.current.moved = true;
        setMoveOffset({ dx, dy });
      }
    };
    const handleUp = (ev: PointerEvent) => {
      const moved = dragState.current?.moved ?? false;
      cleanup();
      if (moved) {
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;
        const newX = (pos?.x ?? block.x) + dx / scale;
        const newY = (pos?.y ?? block.y) + dy / scale;
        onMove(newX, newY);
      }
    };

    cancelMoveRef.current = cleanup;
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
  }

  return (
    <>
      {/* White ghost pinned at the ORIGINAL position masks the stale PNG text — both
          while the block floats (moveOffset) and after it has settled at a new spot
          (pos), since the PNG isn't re-rendered until save.
          z-index is intentionally left at `auto` (NOT positive): by DOM order it
          paints above the page PNG (so the stale text is masked) but below every
          annotation overlay (draw/whiteout/shape/highlight, all `auto`, rendered
          later in the DOM) — otherwise the ghost would white-out annotations placed
          over the old position. See decisions.md D6-11. The moved block itself keeps
          zIndex 100 to stay above this ghost. */}
      {(moveOffset !== null || pos) && (
        <div
          style={{
            ...boxStyle,
            left: origLeft,
            top: origTop,
            transform: undefined,
            background: "#fff",
            pointerEvents: "none",
            border: "1px solid transparent",
          }}
        />
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
          }
        }}
        onPointerUp={(e) => {
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
            onInput={(e) => onInput((e.target as HTMLDivElement).innerText)}
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
              whiteSpace: "pre-wrap",
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
