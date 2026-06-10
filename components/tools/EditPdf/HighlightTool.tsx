"use client";

import type { Annotation } from "@/lib/stores/editorStore";
import { IconX } from "@/components/shared/icons";

export const HIGHLIGHT_COLORS = ["#FBBF24", "#34D399", "#60A5FA", "#F472B6", "#FB923C", "#FCA5A5"];

/**
 * A text mark annotation (highlight / strikethrough / underline). Selected
 * highlights show a delete button and a colour menu. These are client overlays in
 * Wave 4B; they get burned into the PDF on save in Wave 4C.
 */
export function HighlightTool({
  a,
  scale,
  selected,
  interactive,
  onSelect,
  onRemove,
  onRecolor,
}: {
  a: Annotation;
  scale: number;
  selected: boolean;
  interactive: boolean;
  onSelect: () => void;
  onRemove: () => void;
  onRecolor: (c: string) => void;
}) {
  const left = a.x * scale;
  const top = a.y * scale;
  const width = a.w * scale;
  const height = a.h * scale;

  const base: React.CSSProperties = { position: "absolute", left, top, width, height, cursor: "pointer", pointerEvents: interactive ? "auto" : "none" };

  if (a.type === "strike" || a.type === "underline") {
    // a single thin line through the middle (strike) or along the bottom (underline)
    // of the dragged span — NOT a filled rectangle.
    const lineH = Math.max(1, (a.strokeWidth ?? 2) * scale);
    return (
      <div style={base} onPointerDown={(e) => { e.stopPropagation(); onSelect(); }}>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            height: lineH,
            borderRadius: lineH,
            top: a.type === "strike" ? "50%" : "auto",
            bottom: a.type === "underline" ? 0 : "auto",
            transform: a.type === "strike" ? "translateY(-50%)" : "none",
            background: a.color,
            outline: selected ? "1.5px solid #6B5CE7" : "none",
          }}
        />
      </div>
    );
  }

  return (
    <div
      style={{ ...base, background: a.color + "66" /* ~40% */, borderRadius: 1, outline: selected ? `1.5px solid ${a.color}` : "none" }}
      onPointerDown={(e) => { e.stopPropagation(); onSelect(); }}
    >
      {selected && (
        <>
          <button
            type="button"
            onPointerDown={(e) => { e.stopPropagation(); onRemove(); }}
            style={{
              position: "absolute", right: -8, top: -8, width: 16, height: 16, borderRadius: "50%",
              background: "#0F0F0F", color: "white", border: "1.5px solid white",
              display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", padding: 0,
            }}
          >
            <IconX size={9} sw={2.5} />
          </button>
          <div
            style={{
              position: "absolute", left: 0, top: height + 6, display: "flex", gap: 5, padding: 5,
              background: "var(--card)", border: "1px solid var(--line-2)", borderRadius: 8,
              boxShadow: "0 8px 20px -8px rgba(0,0,0,0.5)", zIndex: 10,
            }}
          >
            {HIGHLIGHT_COLORS.map((c) => (
              <span
                key={c}
                onPointerDown={(e) => { e.stopPropagation(); onRecolor(c); }}
                style={{
                  width: 18, height: 18, borderRadius: 5, background: c, cursor: "pointer",
                  boxShadow: c === a.color ? `0 0 0 2px var(--card), 0 0 0 3.5px ${c}` : "none",
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
