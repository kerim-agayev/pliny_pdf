"use client";

import { useState } from "react";
import type { Annotation } from "@/lib/stores/editorStore";
import { IconMessage, IconX } from "@/components/shared/icons";

/**
 * A sticky-note comment: an amber pin plus an expandable bubble. Client overlay in
 * Wave 4B (not persisted into the PDF yet — Wave 4C).
 */
export function CommentTool({
  a,
  scale,
  open,
  interactive,
  onToggle,
  onRemove,
  authorInitials = "You",
}: {
  a: Annotation;
  scale: number;
  open: boolean;
  interactive: boolean;
  onToggle: () => void;
  onRemove: () => void;
  authorInitials?: string;
}) {
  const [reply, setReply] = useState("");
  const left = a.x * scale;
  const top = a.y * scale;

  return (
    <>
      <button
        type="button"
        onMouseDown={(e) => { e.stopPropagation(); onToggle(); }}
        style={{
          position: "absolute", left, top, width: 26, height: 26,
          background: "#F59E0B", borderRadius: "4px 12px 12px 12px", border: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 6px 16px -4px rgba(245,158,11,0.6)", cursor: "pointer",
          pointerEvents: interactive || open ? "auto" : "none",
        }}
      >
        <IconMessage size={13} color="white" sw={2} />
      </button>

      {open && (
        <div
          onMouseDown={(e) => e.stopPropagation()}
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
          {a.text && <div style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.5, marginBottom: 10 }}>{a.text}</div>}
          <div style={{ display: "flex", gap: 8 }}>
            <input
              className="pp-input"
              placeholder="Reply…"
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              style={{ fontSize: 12, padding: "7px 10px" }}
            />
            <button type="button" className="pp-btn" style={{ padding: "7px 12px", fontSize: 12 }}>Save</button>
          </div>
        </div>
      )}
    </>
  );
}
