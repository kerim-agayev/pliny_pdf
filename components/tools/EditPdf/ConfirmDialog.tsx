"use client";

import { useEffect } from "react";

/** Minimal confirm modal — used before a hard-to-undo action (Wave 6C: duplicate to all pages). */
export function ConfirmDialog({ open, message, confirmLabel, cancelLabel, onConfirm, onCancel }: {
  open: boolean;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      onPointerDown={onCancel}
      style={{ position: "fixed", inset: 0, zIndex: 80, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
    >
      <div
        className="pp-card"
        onPointerDown={(e) => e.stopPropagation()}
        style={{ width: 360, maxWidth: "94%", padding: 20, boxShadow: "0 30px 70px -24px rgba(0,0,0,0.7)" }}
      >
        <p style={{ fontSize: 14, color: "var(--text)", lineHeight: 1.5, marginBottom: 20 }}>{message}</p>
        <div style={{ display: "flex", gap: 10 }}>
          <button type="button" className="pp-btn pp-btn-ghost" style={{ flex: 1, justifyContent: "center" }} onClick={onCancel}>
            {cancelLabel}
          </button>
          <button type="button" className="pp-btn" style={{ flex: 1, justifyContent: "center" }} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
