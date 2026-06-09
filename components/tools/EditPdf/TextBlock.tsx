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
  resize,
  pos,
  blockStyle,
  onSelect,
  onStartEdit,
  onResize,
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
  /** client-only box-size override (PDF points) from corner-handle dragging */
  resize: { w: number; h: number } | undefined;
  /** client-only position override (PDF points) from drag-to-move */
  pos: { x: number; y: number } | undefined;
  /** client-only visual style (underline / alignment) — not sent to the server */
  blockStyle: { underline?: boolean; textAlign?: "left" | "center" | "right" } | undefined;
  onSelect: () => void;
  onStartEdit: () => void;
  onResize: (w: number, h: number) => void;
  onMove: (x: number, y: number) => void;
  onInput: (text: string) => void;
  onContextMenu: (e: React.MouseEvent) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const lastTap = useRef(0);
  const [resizing, setResizing] = useState(false);
  const [moveOffset, setMoveOffset] = useState<{ dx: number; dy: number } | null>(null);
  const dragState = useRef<{ startX: number; startY: number; moved: boolean } | null>(null);
  const cancelMoveRef = useRef<(() => void) | null>(null);

  const deleted = change?.deleted ?? false;
  const text = change?.newText ?? block.text;
  const modified = change !== undefined && (change.newText !== undefined || change.deleted || change.color || change.fontSize !== undefined);
  const masked = editing || modified || moveOffset !== null; // cover the original PNG text

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

  const border = resizing ? "2px dashed #6B5CE7" : editing || selected ? "2px solid #6B5CE7" : "1px solid transparent";
  const bg = masked ? "#FFFFFF" : selected || editing ? "rgba(107,92,231,0.06)" : "transparent";

  const boxW = (resize?.w ?? block.w) * scale;
  const boxH = (resize?.h ?? block.h) * scale;

  // Use position override if present (drag-to-move), else original block coords.
  const blockLeft = (pos?.x ?? block.x) * scale;
  const blockTop = (pos?.y ?? block.y) * scale;

  // Corner handle → drag to resize the block. Resizes from the block's top-left.
  function startResize(e: React.PointerEvent) {
    e.stopPropagation();
    e.preventDefault();
    setResizing(true);
    const rect = rootRef.current!.getBoundingClientRect();
    const aspect = rect.width / rect.height || 1;
    let raf = 0;
    let pending: { w: number; h: number } | null = null;
    const flush = () => {
      raf = 0;
      if (pending) { onResize(pending.w, pending.h); pending = null; }
    };
    const move = (ev: PointerEvent) => {
      const wPx = Math.max(50, ev.clientX - rect.left);
      const hPx = ev.shiftKey ? wPx / aspect : Math.max(20, ev.clientY - rect.top);
      pending = { w: wPx / scale, h: hPx / scale };
      if (!raf) raf = requestAnimationFrame(flush);
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      if (raf) cancelAnimationFrame(raf);
      flush();
      setResizing(false);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

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
        position: "absolute",
        left: blockLeft,
        top: blockTop,
        width: boxW,
        height: boxH,
        overflow: "hidden",
        border,
        background: bg,
        borderRadius: 3,
        boxSizing: "content-box",
        margin: "-2px -3px",
        padding: "2px 3px",
        cursor: moveOffset ? "move" : (editing ? "text" : "pointer"),
        transition: moveOffset ? "none" : "border-color 0.12s, background 0.12s",
        transform: moveOffset ? `translate(${moveOffset.dx}px, ${moveOffset.dy}px)` : undefined,
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

      {selected && !editing && ["nw", "ne", "sw", "se"].map((h) => (
        <span
          key={h}
          onPointerDown={startResize}
          style={{
            position: "absolute",
            width: 10,
            height: 10,
            borderRadius: 2,
            background: "white",
            border: "1.5px solid #6B5CE7",
            touchAction: "none",
            cursor: h === "se" || h === "nw" ? "nwse-resize" : "nesw-resize",
            left: h[1] === "w" ? -5 : "auto",
            right: h[1] === "e" ? -5 : "auto",
            top: h[0] === "n" ? -5 : "auto",
            bottom: h[0] === "s" ? -5 : "auto",
          }}
        />
      ))}
    </div>
  );
}
