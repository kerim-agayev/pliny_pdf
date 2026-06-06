"use client";

import type { Annotation } from "@/lib/stores/editorStore";

/** Visual for the live whiteout drag preview (dashed rose box) + crosshair tooltip. */
export function WhiteoutPreview({ rect, hint }: { rect: { x: number; y: number; w: number; h: number }; hint: string }) {
  return (
    <div
      style={{
        position: "absolute",
        left: rect.x,
        top: rect.y,
        width: rect.w,
        height: rect.h,
        border: "1.5px dashed #F43F5E",
        borderRadius: 2,
        background: "rgba(244,63,94,0.04)",
        pointerEvents: "none",
      }}
    >
      {rect.w > 60 && (
        <div
          style={{
            position: "absolute",
            left: 6,
            top: -26,
            background: "var(--card)",
            border: "1px solid var(--line-2)",
            borderRadius: 6,
            padding: "4px 8px",
            fontSize: 11,
            color: "var(--text)",
            whiteSpace: "nowrap",
            boxShadow: "0 6px 18px -6px rgba(0,0,0,0.5)",
          }}
        >
          {hint}
        </div>
      )}
    </div>
  );
}

/** An applied whiteout rectangle (also burned into the PDF server-side on save). */
export function WhiteoutTool({ a, scale }: { a: Annotation; scale: number }) {
  return (
    <div
      style={{
        position: "absolute",
        left: a.x * scale,
        top: a.y * scale,
        width: a.w * scale,
        height: a.h * scale,
        background: "#FFFFFF",
        border: "1px solid #D1D5DB",
        borderRadius: 2,
      }}
    />
  );
}
