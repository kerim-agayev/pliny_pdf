"use client";

import { useEffect, useRef, type RefObject } from "react";

type PinchOpts = {
  /** current zoom — a factor (Annotate, 0.5–2) or a percent (Edit PDF, 50–200) */
  getScale: () => number;
  /** apply the next zoom; the caller is expected to clamp (both editors do) */
  setScale: (next: number) => void;
  /** optional scroll container to pan with the two-finger midpoint */
  panTarget?: () => HTMLElement | null;
  /** fired when a two-finger pinch starts (true) and ends (false), so callers can
   *  suspend single-finger drag / snap-guide logic while zooming (Wave 8D) */
  onPinchChange?: (active: boolean) => void;
};

/** distance + midpoint between the first two active touches */
function pinchInfo(touches: TouchList) {
  const a = touches[0], b = touches[1];
  const dx = a.clientX - b.clientX;
  const dy = a.clientY - b.clientY;
  return { dist: Math.hypot(dx, dy), mx: (a.clientX + b.clientX) / 2, my: (a.clientY + b.clientY) / 2 };
}

/**
 * Two-finger pinch-to-zoom (and optional pan) on a touch surface. Single-finger
 * gestures are left untouched so the editors' own draw/select logic handles them.
 * The hook never owns zoom state — it multiplies the current scale by the pinch
 * ratio and hands it to `setScale`, which clamps.
 */
export function usePinchZoom(ref: RefObject<HTMLElement | null>, opts: PinchOpts, deps: unknown[] = []) {
  // keep the latest callbacks so the once-bound listeners never read stale zoom
  const optsRef = useRef(opts);
  optsRef.current = opts;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const getScale = () => optsRef.current.getScale();
    const setScale = (n: number) => optsRef.current.setScale(n);
    const panTarget = () => optsRef.current.panTarget?.() ?? null;
    const pinchChange = (a: boolean) => optsRef.current.onPinchChange?.(a);

    let startDist = 0;
    let startScale = 0;
    let lastMx = 0;
    let lastMy = 0;

    function onStart(e: TouchEvent) {
      if (e.touches.length !== 2) return;
      e.preventDefault();
      const p = pinchInfo(e.touches);
      startDist = p.dist;
      startScale = getScale();
      lastMx = p.mx;
      lastMy = p.my;
      pinchChange(true);
    }

    function onMove(e: TouchEvent) {
      if (e.touches.length !== 2 || startDist === 0) return;
      e.preventDefault();
      const p = pinchInfo(e.touches);
      setScale((startScale * p.dist) / startDist);
      const target = panTarget();
      if (target) {
        target.scrollLeft -= p.mx - lastMx;
        target.scrollTop -= p.my - lastMy;
      }
      lastMx = p.mx;
      lastMy = p.my;
    }

    function onEnd() {
      if (startDist !== 0) pinchChange(false);
      startDist = 0;
    }

    el.addEventListener("touchstart", onStart, { passive: false });
    el.addEventListener("touchmove", onMove, { passive: false });
    el.addEventListener("touchend", onEnd);
    el.addEventListener("touchcancel", onEnd);
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onEnd);
      el.removeEventListener("touchcancel", onEnd);
    };
    // re-bind when the surface (re)mounts — e.g. EditorTool swaps the empty state
    // for the editor, or switches between desktop and the mobile takeover (Wave 9B)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, ...deps]);
}
