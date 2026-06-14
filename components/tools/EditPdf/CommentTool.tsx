"use client";

import { useState } from "react";
import type { Annotation } from "@/lib/stores/editorStore";
import { IconMessage, IconX } from "@/components/shared/icons";

/**
 * A sticky-note comment: a colored pin plus an expandable bubble whose text is the
 * comment body. The body is burned into the PDF as an interactive text annotation
 * on save (Wave 4C); the pin color is chosen in the toolbar and burned too (Wave 6D).
 * The pin drags to reposition or, on a plain click, toggles the bubble (Wave 6D).
 */
export function CommentTool({
  a,
  scale,
  open,
  interactive,
  selected,
  onDrag,
  onRemove,
  onChangeText,
  authorInitials = "You",
}: {
  a: Annotation;
  scale: number;
  open: boolean;
  interactive: boolean;
  selected: boolean;
  onDrag: (e: React.PointerEvent) => void;
  onRemove: () => void;
  onChangeText: (text: string) => void;
  authorInitials?: string;
}) {
  const left = a.x * scale;
  const top = a.y * scale;
  const [hovered, setHovered] = useState(false);
  const showDelete = hovered || selected;

  return (
    <>
      <div
        className="pp-ed-pin"
        style={{ position: "absolute", left, top, width: 26, height: 26, pointerEvents: interactive || open ? "auto" : "none" }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <button
          type="button"
          className="pp-ed-pin-btn"
          onPointerDown={onDrag}
          style={{
            width: 26, height: 26,
            background: a.color || "#FBBF24", borderRadius: "4px 12px 12px 12px", border: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 6px 16px -4px rgba(0,0,0,0.35)", cursor: "move",
          }}
        >
          <IconMessage size={13} color="white" sw={2} />
        </button>
        {showDelete && (
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            style={{
              position: "absolute", top: -8, right: -8, width: 16, height: 16, borderRadius: "50%",
              background: "#EF4444", color: "white", border: "1.5px solid white", padding: 0,
              display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 2,
            }}
          >
            <IconX size={9} sw={2.5} />
          </button>
        )}
      </div>

      {open && (
        <div
          // The bubble lives inside the canvas, whose onPointerDown places a new
          // comment. Stop pointer/mouse/click here so typing in the bubble (or hitting
          // its buttons) never bubbles up and drops another sticky note (Wave 6D fix).
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "absolute", left: left + 34, top, width: 230,
            background: "var(--card)", border: "1px solid var(--line-2)", borderRadius: 12,
            padding: 14, boxShadow: "0 16px 40px -12px rgba(0,0,0,0.6)", zIndex: 20,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <div style={{ width: 22, height: 22, borderRadius: "50%", background: "linear-gradient(135deg,#6B5CE7,#EC4899)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 600, color: "white" }}>
              {authorInitials.slice(0, 2).toUpperCase()}
            </div>
            <div style={{ flex: 1, fontSize: 12, fontWeight: 500, color: "var(--text)" }}>{authorInitials}</div>
            <button type="button" onMouseDown={(e) => { e.stopPropagation(); onRemove(); }} style={{ background: "transparent", border: 0, color: "var(--text-3)", cursor: "pointer", padding: 2 }}>
              <IconX size={13} />
            </button>
          </div>
          <textarea
            className="pp-input"
            placeholder="Write a comment…"
            value={a.text ?? ""}
            autoFocus
            onChange={(e) => onChangeText(e.target.value)}
            rows={3}
            style={{ fontSize: 12.5, padding: "7px 10px", resize: "vertical", width: "100%", lineHeight: 1.5 }}
          />
        </div>
      )}
    </>
  );
}
