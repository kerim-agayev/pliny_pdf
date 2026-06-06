"use client";

import { useTranslations } from "next-intl";
import { IconClock, IconX } from "@/components/shared/icons";

/** Amber banner shown ~5 minutes before the server session expires. */
export function SessionWarning({ onSave, onDismiss }: { onSave: () => void; onDismiss: () => void }) {
  const t = useTranslations("ToolPages.editPdf");
  return (
    <div
      style={{
        position: "absolute", top: 18, left: "50%", transform: "translateX(-50%)", zIndex: 55, width: 540, maxWidth: "92%",
        background: "linear-gradient(180deg, rgba(245,158,11,0.16), rgba(245,158,11,0.08))",
        border: "1px solid rgba(245,158,11,0.4)", borderRadius: 12, padding: "14px 18px",
        display: "flex", alignItems: "center", gap: 14, boxShadow: "0 20px 50px -16px rgba(0,0,0,0.6)",
      }}
    >
      <div style={{ width: 34, height: 34, borderRadius: 9, background: "rgba(245,158,11,0.2)", color: "#FBBF24", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <IconClock size={17} sw={1.8} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{t("sessionExpiringTitle")}</div>
        <div style={{ fontSize: 12.5, color: "var(--text-2)", marginTop: 1 }}>{t("sessionExpiringDesc")}</div>
      </div>
      <button type="button" className="pp-btn" style={{ flexShrink: 0 }} onClick={onSave}>{t("saveNow")}</button>
      <button type="button" onClick={onDismiss} style={{ background: "transparent", border: 0, color: "var(--text-3)", cursor: "pointer", padding: 4, flexShrink: 0 }}>
        <IconX size={16} />
      </button>
    </div>
  );
}
