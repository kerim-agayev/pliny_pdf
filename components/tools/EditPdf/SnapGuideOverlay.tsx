"use client";

import type { SnapGuide } from "@/lib/editor/snapGuides";

/**
 * Indigo dashed alignment guides shown only during an active drag (Wave 8B).
 * Each guide spans the full page edge-to-edge. Positions are in PDF points;
 * multiply by `scale` for display px. Never intercepts the drag (pointerEvents none).
 */
export function SnapGuideOverlay({
  guides,
  scale,
  pageW,
  pageH,
}: {
  guides: SnapGuide[];
  scale: number;
  pageW: number;
  pageH: number;
}) {
  if (guides.length === 0) return null;
  return (
    <>
      {guides.map((g, i) =>
        g.axis === "v" ? (
          <div
            key={`v-${i}`}
            style={{
              position: "absolute",
              left: g.pos * scale,
              top: 0,
              height: pageH * scale,
              width: 0,
              borderLeft: "1px dashed #6B5CE7",
              pointerEvents: "none",
              zIndex: 1,
            }}
          />
        ) : (
          <div
            key={`h-${i}`}
            style={{
              position: "absolute",
              top: g.pos * scale,
              left: 0,
              width: pageW * scale,
              height: 0,
              borderTop: "1px dashed #6B5CE7",
              pointerEvents: "none",
              zIndex: 1,
            }}
          />
        ),
      )}
    </>
  );
}
