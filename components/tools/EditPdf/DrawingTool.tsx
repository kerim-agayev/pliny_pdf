"use client";

import type { Annotation } from "@/lib/stores/editorStore";

/**
 * Renders a freehand pen stroke (SVG path) or a shape (rectangle / circle / arrow
 * / line). Client overlay in Wave 4B; burned into the PDF in Wave 4C.
 */
export function DrawingTool({
  a,
  scale,
  selected,
  interactive,
  onSelect,
}: {
  a: Annotation;
  scale: number;
  selected: boolean;
  interactive: boolean;
  onSelect: () => void;
}) {
  const left = a.x * scale;
  const top = a.y * scale;
  const width = Math.max(1, a.w * scale);
  const height = Math.max(1, a.h * scale);
  const sw = (a.strokeWidth ?? 2.5) * scale;

  if (a.type === "draw" && a.path) {
    return (
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${a.w} ${a.h}`}
        style={{ position: "absolute", left, top, overflow: "visible", pointerEvents: "none" }}
      >
        <path d={a.path} stroke={a.color} strokeWidth={a.strokeWidth ?? 2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  const wrap: React.CSSProperties = {
    position: "absolute",
    left,
    top,
    width,
    height,
    outline: selected ? "1.5px solid #6B5CE7" : "none",
    cursor: "pointer",
    pointerEvents: interactive ? "auto" : "none",
  };
  const onDown = (e: React.MouseEvent) => { e.stopPropagation(); onSelect(); };

  if (a.shapeType === "rectangle") {
    return <div style={{ ...wrap, border: `${sw}px solid ${a.color}`, borderRadius: 4 }} onMouseDown={onDown} />;
  }
  if (a.shapeType === "circle") {
    return <div style={{ ...wrap, border: `${sw}px solid ${a.color}`, borderRadius: "50%" }} onMouseDown={onDown} />;
  }

  // arrow / line — drawn from the true start (a.x,a.y) to end (a.x2,a.y2) so the
  // direction (and arrowhead) follow the drag. Local SVG coords offset by the bbox.
  const ex = a.x2 ?? a.x;
  const ey = a.y2 ?? a.y;
  const minX = Math.min(a.x, ex), minY = Math.min(a.y, ey);
  const sx = (a.x - minX) * scale, sy = (a.y - minY) * scale;
  const tx = (ex - minX) * scale, ty = (ey - minY) * scale;
  const ang = Math.atan2(ty - sy, tx - sx);
  const head = Math.max(9, sw * 3);
  const b1 = ang + Math.PI - 0.5, b2 = ang + Math.PI + 0.5;
  return (
    <svg
      style={{ position: "absolute", left: minX * scale, top: minY * scale, overflow: "visible", pointerEvents: interactive ? "auto" : "none", cursor: "pointer" }}
      width={Math.max(1, width)}
      height={Math.max(1, height)}
      onMouseDown={onDown}
    >
      <line x1={sx} y1={sy} x2={tx} y2={ty} stroke={a.color} strokeWidth={sw} strokeLinecap="round" />
      {a.shapeType === "arrow" && (
        <>
          <line x1={tx} y1={ty} x2={tx + head * Math.cos(b1)} y2={ty + head * Math.sin(b1)} stroke={a.color} strokeWidth={sw} strokeLinecap="round" />
          <line x1={tx} y1={ty} x2={tx + head * Math.cos(b2)} y2={ty + head * Math.sin(b2)} stroke={a.color} strokeWidth={sw} strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}
