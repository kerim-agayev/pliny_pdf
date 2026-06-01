"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Scales a fixed-size preview (whose children are positioned in the preview's
 * native pixel space — e.g. add-page-numbers / header-footer overlays) down to
 * fit its container on narrow screens. Uses a uniform CSS transform so px- AND
 * %-positioned children stay aligned, and `getBoundingClientRect` inside stays
 * consistent for pointer math. On wide screens scale = 1 (no change).
 */
export function ScaledPreview({
  width,
  height,
  className,
  children,
}: {
  width: number;
  height: number;
  className?: string;
  children: ReactNode;
}) {
  const measureRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = measureRef.current;
    if (!el) return;
    const update = () => setScale(Math.min(1, el.clientWidth / width));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [width]);

  return (
    <div ref={measureRef} className={className} style={{ width: "100%", display: "flex", justifyContent: "center" }}>
      {/* reserves the scaled layout box so nothing overflows */}
      <div style={{ width: width * scale, height: height * scale }}>
        <div style={{ width, height, transformOrigin: "top left", transform: `scale(${scale})` }}>
          {children}
        </div>
      </div>
    </div>
  );
}
