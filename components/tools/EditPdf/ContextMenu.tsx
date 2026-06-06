"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { IconScissors, IconCopy, IconTrash, IconType, type IconProps } from "@/components/shared/icons";
import type { ComponentType } from "react";

export type ContextMenuState = {
  x: number;
  y: number;
  blockId: string | null;
  /** page-point (PDF coords) where the menu was opened — paste lands here */
  pt: { x: number; y: number };
};

type Row =
  | { sep: true }
  | { label: string; kbd: string; icon: ComponentType<IconProps> | null; action?: () => void; disabled?: boolean; danger?: boolean };

/** Right-click menu over the canvas (cut/copy/paste/delete/select-all/edit/font). */
export function ContextMenu({
  state,
  onClose,
  onCut,
  onCopy,
  onSelectAll,
  onDelete,
  onEdit,
}: {
  state: ContextMenuState;
  onClose: () => void;
  onCut: () => void;
  onCopy: () => void;
  onSelectAll: () => void;
  onDelete: () => void;
  onEdit: () => void;
}) {
  const t = useTranslations("ToolPages.editPdf");

  useEffect(() => {
    const close = () => onClose();
    window.addEventListener("mousedown", close);
    window.addEventListener("scroll", close, true);
    return () => {
      window.removeEventListener("mousedown", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [onClose]);

  const onBlock = state.blockId !== null;
  const rows: Row[] = [
    { label: t("ctxCut"), kbd: "⌘X", icon: IconScissors, action: onCut, disabled: !onBlock },
    { label: t("ctxCopy"), kbd: "⌘C", icon: IconCopy, action: onCopy, disabled: !onBlock },
    { label: t("ctxDelete"), kbd: "Del", icon: IconTrash, action: onDelete, disabled: !onBlock, danger: true },
    { sep: true },
    { label: t("ctxSelectAll"), kbd: "⌘A", icon: null, action: onSelectAll },
    { label: t("ctxEditText"), kbd: "", icon: IconType, action: onEdit, disabled: !onBlock },
  ];

  return (
    <div
      onMouseDown={(e) => e.stopPropagation()}
      style={{
        position: "fixed", left: state.x, top: state.y, zIndex: 80, width: 196,
        background: "var(--card)", border: "1px solid var(--line-2)", borderRadius: 10, padding: 5,
        boxShadow: "0 18px 44px -12px rgba(0,0,0,0.65)",
      }}
    >
      {rows.map((row, i) => {
        if ("sep" in row) return <div key={i} style={{ height: 1, background: "var(--line)", margin: "5px 6px" }} />;
        const { label, kbd, icon: Icon, action, disabled, danger } = row;
        return (
          <button
            key={i}
            type="button"
            className="pp-related"
            disabled={disabled}
            onMouseDown={() => { if (!disabled) { action?.(); onClose(); } }}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "7px 10px", borderRadius: 7,
              background: "transparent", border: 0, color: danger ? "#F87171" : "var(--text)", fontSize: 13,
              cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.4 : 1, fontFamily: "inherit",
            }}
          >
            {Icon ? <Icon size={14} sw={1.7} /> : <span style={{ width: 14 }} />}
            <span style={{ flex: 1, textAlign: "left" }}>{label}</span>
            {kbd && <span className="pp-mono" style={{ fontSize: 10.5, color: "var(--text-3)" }}>{kbd}</span>}
          </button>
        );
      })}
    </div>
  );
}
