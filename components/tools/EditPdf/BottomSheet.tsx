"use client";

import { useEffect, useRef } from "react";
import { IconX } from "@/components/shared/icons";

/**
 * Native-feeling bottom sheet (Wave 8D) — ported from the Phase 8 mobile redesign
 * (`edit-redesign-mobile.jsx`). Spring entry, drag-handle + swipe-down to dismiss,
 * dimmed backdrop (tap to close), Esc to close. Rendered inside the fixed editor
 * SHELL, so it is `position:absolute; inset:0` rather than viewport-fixed.
 */
export function BottomSheet({
  title,
  subtitle,
  onClose,
  children,
  maxH = "74%",
}: {
  title?: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  maxH?: string;
}) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);

  // animate out, then unmount via onClose
  const dismiss = () => {
    const sheet = sheetRef.current;
    const back = backRef.current;
    if (sheet) { sheet.style.transition = "transform .26s cubic-bezier(.3,.7,.4,1)"; sheet.style.transform = "translateY(110%)"; }
    if (back) { back.style.transition = "opacity .26s ease"; back.style.opacity = "0"; }
    window.setTimeout(onClose, 240);
  };

  // Esc closes (chat constraint: "click outside or Esc to close")
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") dismiss(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // drag the handle to dismiss (release past 96px) or spring back
  const onHandleDown = (e: React.PointerEvent) => {
    e.preventDefault();
    const sheet = sheetRef.current;
    const back = backRef.current;
    if (!sheet) return;
    const startY = e.clientY;
    const h = sheet.offsetHeight;
    sheet.style.transition = "none";
    let dy = 0;
    const move = (ev: PointerEvent) => {
      dy = Math.max(0, ev.clientY - startY);
      sheet.style.transform = `translateY(${dy}px)`;
      if (back) back.style.opacity = String(Math.max(0, 1 - dy / h));
    };
    const up = () => {
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerup", up);
      if (dy > 96) { dismiss(); return; }
      sheet.style.transition = "transform .34s cubic-bezier(.2,1.05,.3,1)";
      sheet.style.transform = "translateY(0)";
      if (back) { back.style.transition = "opacity .2s"; back.style.opacity = "1"; }
    };
    document.addEventListener("pointermove", move);
    document.addEventListener("pointerup", up);
  };

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 90 }}>
      <div
        ref={backRef}
        onClick={dismiss}
        style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(2px)", opacity: 1, animation: "rdFade .26s ease" }}
      />
      <div
        ref={sheetRef}
        style={{
          position: "absolute", left: 0, right: 0, bottom: 0, maxHeight: maxH,
          background: "var(--card)", borderTopLeftRadius: 24, borderTopRightRadius: 24,
          boxShadow: "0 -24px 60px -24px rgba(0,0,0,0.7), 0 0 0 1px var(--line)",
          display: "flex", flexDirection: "column", touchAction: "none",
          animation: "rdSheetUp .36s cubic-bezier(.2,1,.3,1)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <div onPointerDown={onHandleDown} style={{ padding: "11px 0 4px", cursor: "grab", touchAction: "none", flexShrink: 0 }}>
          <div style={{ width: 40, height: 5, borderRadius: 3, background: "var(--line-2)", margin: "0 auto" }} />
        </div>
        {title && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 20px 12px", borderBottom: "1px solid var(--line)", flexShrink: 0 }}>
            <div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 600, color: "var(--text)" }}>{title}</div>
              {subtitle && <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 1 }}>{subtitle}</div>}
            </div>
            <button
              type="button" onClick={dismiss} aria-label="Close"
              style={{ width: 30, height: 30, borderRadius: 15, background: "var(--bg-2)", border: "1px solid var(--line)", color: "var(--text-2)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}
            >
              <IconX size={15} />
            </button>
          </div>
        )}
        <div style={{ padding: 20, overflow: "auto" }}>{children}</div>
      </div>
    </div>
  );
}
