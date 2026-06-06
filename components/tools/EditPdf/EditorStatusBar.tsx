"use client";

import { useTranslations } from "next-intl";
import { useEditorStore } from "@/lib/stores/editorStore";
import { IconChevron, IconClock } from "@/components/shared/icons";

/** mm:ss from a millisecond remaining value. */
function fmt(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const sec = total % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

/** Bottom bar: page nav, cloud badge, optional extra, and the session countdown. */
export function EditorStatusBar({ remainingMs, extra }: { remainingMs: number; extra?: React.ReactNode }) {
  const t = useTranslations("ToolPages.editPdf");
  const currentPage = useEditorStore((s) => s.currentPage);
  const pageCount = useEditorStore((s) => s.pageCount);
  const setCurrentPage = useEditorStore((s) => s.setCurrentPage);
  const urgent = remainingMs <= 5 * 60 * 1000;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "0 18px", height: 40, flexShrink: 0, background: "var(--card)", borderTop: "1px solid var(--line)", fontSize: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button type="button" onClick={() => setCurrentPage(currentPage - 1)} style={{ background: "transparent", border: 0, color: "var(--text-2)", display: "flex", cursor: "pointer", padding: 2 }}>
          <IconChevron size={13} style={{ transform: "rotate(180deg)" }} />
        </button>
        <span className="pp-mono" style={{ color: "var(--text-2)" }}>
          {t("pageLabel")} <span style={{ color: "var(--text)" }}>{currentPage + 1}</span> {t("of")} {pageCount}
        </span>
        <button type="button" onClick={() => setCurrentPage(currentPage + 1)} style={{ background: "transparent", border: 0, color: "var(--text-2)", display: "flex", cursor: "pointer", padding: 2 }}>
          <IconChevron size={13} />
        </button>
      </div>
      <div className="pp-ed-hide-sm" style={{ width: 1, height: 18, background: "var(--line)" }} />
      <div className="pp-badge cloud pp-ed-hide-sm" style={{ fontSize: 11, padding: "3px 9px" }}>
        <span className="pp-dot" /> {t("cloudSecure")}
      </div>
      {extra}
      <div style={{ flex: 1 }} />
      <div style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 11.5, fontWeight: urgent ? 600 : 400, color: urgent ? "#FBBF24" : "var(--text-2)" }}>
        <IconClock size={13} color={urgent ? "#FBBF24" : "var(--text-2)"} />
        <span className="pp-mono">{fmt(remainingMs)} {t("remaining")}</span>
      </div>
    </div>
  );
}
