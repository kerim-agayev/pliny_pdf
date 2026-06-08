"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useEditorStore, type ShapeType } from "@/lib/stores/editorStore";
import {
  IconCursor, IconTextPlus, IconWhiteout, IconHighlight, IconStrike, IconPen, IconShapes,
  IconMessage, IconBold, IconItalic, IconUnderlineText, IconAlignLeft, IconAlignCenter,
  IconAlignRight, IconTrash, IconUndo, IconRedo, IconSearch, IconChevron, IconX, IconPlus,
  IconRect, IconCircleShape, IconArrowDraw, IconLineShape, type IconProps,
} from "@/components/shared/icons";
import type { ComponentType } from "react";

const ROW: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 4, padding: "7px 16px", flexShrink: 0,
  background: "var(--card)", borderBottom: "1px solid var(--line)",
};

function TBtn({ icon: Ic, label, active, disabled, danger, hasCaret, kbd, onClick }: {
  icon: ComponentType<IconProps>; label: string; active?: boolean; disabled?: boolean;
  danger?: boolean; hasCaret?: boolean; kbd?: string; onClick?: () => void;
}) {
  return (
    <button
      type="button" onClick={onClick} disabled={disabled} title={label} className="pp-edtool"
      style={{
        height: 32, minWidth: 32, padding: hasCaret ? "0 6px 0 7px" : 0, borderRadius: 7,
        background: active ? "rgba(107,92,231,0.18)" : "transparent",
        border: active ? "1px solid rgba(107,92,231,0.42)" : "1px solid transparent",
        color: disabled ? "var(--text-3)" : danger ? "#F87171" : active ? "#BFB5FF" : "var(--text)",
        opacity: disabled ? 0.4 : 1, cursor: disabled ? "not-allowed" : "pointer",
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 4, flexShrink: 0,
      }}
    >
      <Ic size={16.5} sw={1.7} />
      {hasCaret && <IconChevron size={12} style={{ transform: "rotate(90deg)", opacity: 0.6 }} />}
      {kbd && <span className="pp-mono" style={{ fontSize: 9.5, color: "var(--text-3)", marginLeft: 2 }}>{kbd}</span>}
    </button>
  );
}

const TBDiv = () => <div style={{ width: 1, height: 20, background: "var(--line)", flexShrink: 0, margin: "0 3px" }} />;

const FONTS = ["Helvetica", "Times", "Courier"];
const SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32];
// shared palette + stroke widths for the drawing tools (Draw / Shapes / Highlight / Strike)
const DRAW_COLORS = ["#0F0F0F", "#F43F5E", "#3B82F6", "#10B981", "#FACC15", "#FFFFFF"];
const STROKES = [1, 3, 6];
const DRAW_TOOLS = new Set(["draw", "shapes", "highlight", "strike"]);

export function EditorToolbar() {
  const t = useTranslations("ToolPages.editPdf");
  const s = useEditorStore();
  const enabled = s.selectedBlock !== null;
  // Text+ active → keep font/size/color live so the user styles the *next* new block
  const textMode = s.tool === "text";
  const fmtEnabled = enabled || textMode;
  const colorRef = useRef<HTMLInputElement>(null);
  const [shapesOpen, setShapesOpen] = useState(false);

  return (
    <div style={{ position: "relative" }}>
      {/* Row 1 — tools */}
      <div className="pp-ed-row" style={{ ...ROW, height: 48, gap: 2 }}>
        <TBtn icon={IconCursor} label={t("toolSelect")} active={s.tool === "select"} onClick={() => s.setTool("select")} />
        <TBDiv />
        <TBtn icon={IconTextPlus} label={t("toolText")} active={s.tool === "text"} onClick={() => s.setTool("text")} />
        <TBtn icon={IconWhiteout} label={t("toolWhiteout")} active={s.tool === "whiteout"} onClick={() => s.setTool("whiteout")} />
        <TBtn icon={IconHighlight} label={t("toolHighlight")} active={s.tool === "highlight"} onClick={() => s.setTool("highlight")} />
        <TBtn icon={IconStrike} label={t("toolStrike")} active={s.tool === "strike"} onClick={() => s.setTool("strike")} />
        <TBDiv />
        <TBtn icon={IconPen} label={t("toolDraw")} active={s.tool === "draw"} onClick={() => s.setTool("draw")} />
        <TBtn icon={IconShapes} label={t("toolShapes")} hasCaret active={s.tool === "shapes"} onClick={() => { s.setTool("shapes"); setShapesOpen((v) => !v); }} />
        <TBtn icon={IconMessage} label={t("toolComment")} active={s.tool === "comment"} onClick={() => s.setTool("comment")} />

        {DRAW_TOOLS.has(s.tool) && (
          <>
            <TBDiv />
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {DRAW_COLORS.map((c) => (
                <button
                  key={c} type="button" title={c} onClick={() => s.setStroke({ strokeColor: c })}
                  style={{ width: 18, height: 18, borderRadius: 5, background: c, border: c === "#FFFFFF" ? "1px solid var(--line-2)" : 0, cursor: "pointer", boxShadow: s.strokeColor === c ? `0 0 0 2px var(--card), 0 0 0 3.5px ${c === "#FFFFFF" ? "#6B5CE7" : c}` : "none" }}
                />
              ))}
              <div style={{ width: 1, height: 18, background: "var(--line)", margin: "0 2px" }} />
              {STROKES.map((w) => (
                <button
                  key={w} type="button" title={`${w}px`} onClick={() => s.setStroke({ strokeWidth: w })}
                  style={{ width: 22, height: 22, borderRadius: 6, border: s.strokeWidth === w ? "1px solid var(--indigo)" : "1px solid var(--line)", background: s.strokeWidth === w ? "rgba(107,92,231,0.14)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                >
                  <span style={{ width: 12, height: w, background: s.strokeWidth === w ? "#BFB5FF" : "var(--text-3)", borderRadius: 2 }} />
                </button>
              ))}
            </div>
          </>
        )}

        <div style={{ flex: 1 }} />
        <div className="pp-badge cloud pp-ed-hide-sm" style={{ fontSize: 11, padding: "3px 9px" }}>
          <span className="pp-dot" /> {t("cloudEditor")}
        </div>

        {shapesOpen && (
          <div
            style={{
              position: "absolute", left: 296, top: 46, zIndex: 40, width: 188, background: "var(--card)",
              border: "1px solid var(--line-2)", borderRadius: 12, padding: 6, boxShadow: "0 16px 40px -12px rgba(0,0,0,0.6)",
            }}
          >
            {([["rectangle", IconRect, t("shapeRectangle")], ["circle", IconCircleShape, t("shapeCircle")], ["arrow", IconArrowDraw, t("shapeArrow")], ["line", IconLineShape, t("shapeLine")]] as [ShapeType, ComponentType<IconProps>, string][]).map(([k, Ic, label]) => (
              <button
                key={k} type="button" className="pp-related"
                onClick={() => { s.setShapeType(k); setShapesOpen(false); }}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 8,
                  background: s.shapeType === k ? "rgba(107,92,231,0.14)" : "transparent", border: 0,
                  color: s.shapeType === k ? "#BFB5FF" : "var(--text)", fontSize: 13, cursor: "pointer", fontFamily: "inherit",
                }}
              >
                <Ic size={16} sw={1.7} /> {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Row 2 — text formatting */}
      <div className="pp-ed-row" style={{ ...ROW, height: 46, gap: 5, opacity: fmtEnabled ? 1 : 0.55 }}>
        <select
          className="pp-edtool" value={s.fontFamily} disabled={!fmtEnabled}
          onChange={(e) => s.setFormat({ fontFamily: e.target.value })}
          style={{ height: 30, width: 104, borderRadius: 7, background: "var(--bg-2)", border: "1px solid var(--line)", color: "var(--text)", fontSize: 12.5, padding: "0 8px", fontFamily: "inherit", appearance: "none", cursor: fmtEnabled ? "pointer" : "not-allowed" }}
        >
          {FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
        <select
          className="pp-edtool" value={s.fontSize} disabled={!fmtEnabled}
          onChange={(e) => s.setFormat({ fontSize: Number(e.target.value) })}
          style={{ height: 30, width: 58, borderRadius: 7, background: "var(--bg-2)", border: "1px solid var(--line)", color: "var(--text)", fontSize: 12.5, padding: "0 8px", fontFamily: "inherit", appearance: "none", cursor: fmtEnabled ? "pointer" : "not-allowed" }}
        >
          {SIZES.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
        <TBDiv />
        <TBtn icon={IconBold} label={t("bold")} active={enabled && s.bold} disabled={!enabled} onClick={() => s.setFormat({ bold: !s.bold })} />
        <TBtn icon={IconItalic} label={t("italic")} active={enabled && s.italic} disabled={!enabled} onClick={() => s.setFormat({ italic: !s.italic })} />
        <TBtn icon={IconUnderlineText} label={t("underline")} active={enabled && s.underline} disabled={!enabled} onClick={() => s.setFormat({ underline: !s.underline })} />
        <TBDiv />
        <button
          type="button" disabled={!fmtEnabled} className="pp-edtool" title={t("color")}
          onClick={() => colorRef.current?.click()}
          style={{ height: 30, padding: "0 6px", borderRadius: 7, background: "var(--bg-2)", border: "1px solid var(--line)", display: "inline-flex", alignItems: "center", gap: 6, cursor: fmtEnabled ? "pointer" : "not-allowed", opacity: fmtEnabled ? 1 : 0.5 }}
        >
          <span style={{ width: 16, height: 16, borderRadius: 4, background: s.fontColor, border: "1px solid var(--line-2)" }} />
          <IconChevron size={11} style={{ transform: "rotate(90deg)", opacity: 0.6, color: "var(--text-2)" }} />
          <input ref={colorRef} type="color" value={s.fontColor} onChange={(e) => s.setFormat({ fontColor: e.target.value })} style={{ position: "absolute", width: 0, height: 0, opacity: 0, pointerEvents: "none" }} />
        </button>
        <TBDiv />
        <div style={{ display: "flex", gap: 1, padding: 2, background: "var(--bg-2)", border: "1px solid var(--line)", borderRadius: 8, opacity: enabled ? 1 : 0.5 }}>
          {([["left", IconAlignLeft], ["center", IconAlignCenter], ["right", IconAlignRight]] as const).map(([k, Ic]) => (
            <button key={k} type="button" disabled={!enabled} onClick={() => s.setFormat({ textAlign: k })}
              style={{ width: 26, height: 24, borderRadius: 5, border: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", background: enabled && s.textAlign === k ? "rgba(107,92,231,0.2)" : "transparent", color: enabled && s.textAlign === k ? "#BFB5FF" : "var(--text-2)", cursor: enabled ? "pointer" : "not-allowed" }}>
              <Ic size={15} sw={1.7} />
            </button>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <TBtn icon={IconTrash} label={t("deleteBlock")} danger disabled={!enabled} kbd="Del" onClick={() => s.selectedBlock && s.deleteBlock(s.selectedBlock)} />
      </div>

      {/* Row 3 — actions */}
      <div className="pp-ed-row" style={{ ...ROW, height: 46, gap: 5 }}>
        <TBtn icon={IconUndo} label={t("undo")} kbd="⌘Z" disabled={!s.undoStack.length} onClick={s.undo} />
        <TBtn icon={IconRedo} label={t("redo")} kbd="⌘⇧Z" disabled={!s.redoStack.length} onClick={s.redo} />
        <TBDiv />
        <button type="button" onClick={s.openFindReplace} className="pp-edtool"
          style={{ height: 30, padding: "0 12px", borderRadius: 7, background: "var(--bg-2)", border: "1px solid var(--line)", color: "var(--text)", display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12.5, cursor: "pointer" }}>
          <IconSearch size={14} /> {t("findReplace")}
          <span className="pp-mono" style={{ fontSize: 9.5, color: "var(--text-3)" }}>⌘H</span>
        </button>
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", alignItems: "center", gap: 2, padding: 3, background: "var(--bg-2)", border: "1px solid var(--line)", borderRadius: 8 }}>
          <button type="button" className="pp-edtool" onClick={() => s.setZoom(s.zoom - 10)}
            style={{ width: 26, height: 24, borderRadius: 5, border: 0, background: "transparent", color: "var(--text-2)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <IconX size={13} style={{ transform: "rotate(45deg)" }} />
          </button>
          <span className="pp-mono" style={{ fontSize: 12, color: "var(--text)", minWidth: 42, textAlign: "center" }}>{s.zoom}%</span>
          <button type="button" className="pp-edtool" onClick={() => s.setZoom(s.zoom + 10)}
            style={{ width: 26, height: 24, borderRadius: 5, border: 0, background: "transparent", color: "var(--text-2)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <IconPlus size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
