"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useEditorStore, type ShapeType, type MarkType } from "@/lib/stores/editorStore";
import { addText as apiAddText, uploadImage as apiUploadImage } from "@/lib/api/editor";
import {
  IconCursor, IconTextPlus, IconWhiteout, IconHighlight, IconStrike, IconPen, IconShapes,
  IconMessage, IconBold, IconItalic, IconUnderlineText, IconAlignLeft, IconAlignCenter,
  IconAlignRight, IconTrash, IconUndo, IconRedo, IconChevron, IconX, IconPlus,
  IconCopy, IconRect, IconCircleShape, IconArrowDraw, IconLineShape,
  IconImage, IconBolt, IconLink, IconCheck, type IconProps,
} from "@/components/shared/icons";
import { LinkDialog } from "./LinkDialog";
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

const FONTS = ["Helvetica", "Times", "Courier", "Noto Sans", "Noto Serif", "Noto Sans Mono"];
const SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32];
// shared palette + stroke widths for the drawing tools (Draw / Shapes / Strike)
const DRAW_COLORS = ["#0F0F0F", "#F43F5E", "#3B82F6", "#10B981", "#FACC15", "#FFFFFF"];
const STROKES = [1, 3, 6];
const DRAW_TOOLS = new Set(["draw", "shapes", "strike"]);
// Highlight gets its own pastel palette @ ~40% (Wave 6D).
const HIGHLIGHT_PALETTE = ["#FBBF24", "#34D399", "#60A5FA", "#F472B6", "#FB923C", "#FCA5A5"];
// Sticky-note colors (Wave 6D).
const COMMENT_PALETTE = ["#FBBF24", "#34D399", "#60A5FA", "#F472B6"];
// Quick-mark glyphs (Wave 6D): fixed default color per type.
const MARK_COLOR: Record<MarkType, string> = { check: "#16A34A", cross: "#DC2626", circle: "#2563EB" };

const STAMP_COLOR: Record<string, string> = {
  DRAFT: "#EF4444", VOID: "#EF4444", CONFIDENTIAL: "#EF4444",
  APPROVED: "#10B981",
  COPY: "#3B82F6", FINAL: "#3B82F6", RECEIVED: "#3B82F6", REVIEWED: "#3B82F6",
};
const STAMP_LABELS = ["DRAFT", "APPROVED", "CONFIDENTIAL", "COPY", "FINAL", "VOID", "RECEIVED", "REVIEWED"] as const;

let annStampId = 0;
const nextStampId = () => `stamp${++annStampId}`;

let annLinkId = 0;
const nextLinkId = () => `link${++annLinkId}`;

// Whiteout / blackout fill swatches (white default, black = blackout, + custom via picker).
const WHITEOUT_COLORS = ["#FFFFFF", "#000000", "#FEF08A", "#F87171"];

export function EditorToolbar() {
  const t = useTranslations("ToolPages.editPdf");
  const s = useEditorStore();
  const enabled = s.selectedBlock !== null;
  // A selected highlight annotation → toolbar shows the highlight palette so it can be
  // recolored from the toolbar (Wave 6D, GATE feedback).
  const selHighlight = s.annotations.find((a) => a.id === s.selectedAnnotId && a.type === "highlight") ?? null;
  // Text+ active → keep font/size/color live so the user styles the *next* new block
  const textMode = s.tool === "text";
  const fmtEnabled = enabled || textMode;
  const colorRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const whiteoutColorRef = useRef<HTMLInputElement>(null);
  const [shapesOpen, setShapesOpen] = useState(false);
  const [stampOpen, setStampOpen] = useState(false);
  const [marksOpen, setMarksOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);

  async function duplicateBlock() {
    const id = s.selectedBlock;
    if (!id || !s.sessionId) return;
    const page = s.pages[s.currentPage];
    if (!page) return;
    const block = page.textBlocks.find((b) => b.blockId === id);
    if (!block) return;
    const change = s.changes.get(id);
    const text = change?.newText ?? block.text;
    const fontSize = change?.fontSize ?? block.fontSize;
    const fontName = change?.fontName ?? block.fontName;
    const color = change?.color ?? block.color ?? "#1f1f1f";
    const bold = change?.bold ?? block.bold ?? false;
    const italic = change?.italic ?? block.italic ?? false;
    const posOverride = s.blockPositions[id];
    const newX = (posOverride?.x ?? block.x) + 20;
    const newY = (posOverride?.y ?? block.y) + 20;
    try {
      const { blockId } = await apiAddText(s.sessionId, {
        pageNum: page.pageNum, x: newX, y: newY + fontSize,
        text, fontSize, fontName, color, bold, italic,
      });
      s.addLocalBlock({ blockId, x: newX, y: newY, w: block.w, h: block.h, text, fontSize, fontName, color, bold, italic });
      s.bumpRender();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("saveFailed"));
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !s.sessionId) return;
    const page = s.pages[s.currentPage];
    if (!page) return;
    try {
      const { imageId } = await apiUploadImage(s.sessionId, file);
      // Determine initial size preserving aspect ratio (max side = 150 PDF pts).
      const img = new Image();
      const url = URL.createObjectURL(file);
      const [w, h] = await new Promise<[number, number]>((resolve) => {
        img.onload = () => { URL.revokeObjectURL(url); resolve([img.naturalWidth, img.naturalHeight]); };
        img.onerror = () => { URL.revokeObjectURL(url); resolve([150, 150]); };
        img.src = url;
      });
      const MAX = 150;
      const ratio = w / h;
      const iw = ratio >= 1 ? MAX : MAX * ratio;
      const ih = ratio >= 1 ? MAX / ratio : MAX;
      const cx = (page.width - iw) / 2;
      const cy = (page.height - ih) / 2;
      s.addAnnotation({ id: `img-${imageId}`, type: "image", pageNum: page.pageNum, x: cx, y: cy, w: iw, h: ih, color: "", imageId });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("saveFailed"));
    }
  }

  function addLink(uri: string) {
    setLinkOpen(false);
    const id = s.selectedBlock;
    const page = s.pages[s.currentPage];
    if (!id || !page) return;
    const block = page.textBlocks.find((b) => b.blockId === id);
    if (!block) return;
    const pos = s.blockPositions[id];
    const x = pos?.x ?? block.x;
    const y = pos?.y ?? block.y;
    s.addAnnotation({ id: nextLinkId(), type: "link", pageNum: page.pageNum, x, y, w: block.w, h: block.h, color: "#2563EB", uri });
  }

  function addStamp(label: string) {
    const page = s.pages[s.currentPage];
    if (!page) return;
    setStampOpen(false);
    const color = STAMP_COLOR[label] ?? "#3B82F6";
    const w = 160, h = 50;
    const cx = (page.width - w) / 2;
    const cy = (page.height - h) / 2;
    s.addAnnotation({ id: nextStampId(), type: "stamp", pageNum: page.pageNum, x: cx, y: cy, w, h, color, label });
  }

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
        <TBDiv />
        <TBtn icon={IconImage} label={t("toolImage")} disabled={!s.sessionId} onClick={() => imageInputRef.current?.click()} />
        <input ref={imageInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/bmp,image/webp" style={{ display: "none" }} onChange={handleImageUpload} />
        <TBtn icon={IconBolt} label={t("toolStamp")} hasCaret active={stampOpen} onClick={() => setStampOpen((v) => !v)} disabled={!s.sessionId} />
        <TBtn icon={IconCheck} label={t("toolMark")} hasCaret active={s.tool === "mark" || marksOpen} onClick={() => setMarksOpen((v) => !v)} />

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
              {s.tool === "shapes" && (s.shapeType === "rectangle" || s.shapeType === "circle") && (
                <>
                  <div style={{ width: 1, height: 18, background: "var(--line)", margin: "0 2px" }} />
                  <TBtn icon={IconRect} label={t("fill")} active={s.shapeFill} onClick={() => s.setShapeFill(!s.shapeFill)} />
                </>
              )}
            </div>
          </>
        )}

        {(s.tool === "highlight" || selHighlight) && (
          <>
            <TBDiv />
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {HIGHLIGHT_PALETTE.map((c) => {
                const activeColor = selHighlight ? selHighlight.color : s.highlightColor;
                return (
                  <button
                    key={c} type="button" title={c}
                    // Recolor the selected highlight if one is selected; always update the
                    // default so the next new highlight uses the chosen color too (Wave 6D).
                    onClick={() => { s.setHighlightColor(c); if (selHighlight) s.updateAnnotation(selHighlight.id, { color: c }); }}
                    style={{ width: 18, height: 18, borderRadius: 5, background: c, border: 0, cursor: "pointer", boxShadow: activeColor === c ? `0 0 0 2px var(--card), 0 0 0 3.5px ${c}` : "none" }}
                  />
                );
              })}
            </div>
          </>
        )}

        {s.tool === "comment" && (
          <>
            <TBDiv />
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {COMMENT_PALETTE.map((c) => (
                <button
                  key={c} type="button" title={c} onClick={() => s.setCommentColor(c)}
                  style={{ width: 18, height: 18, borderRadius: 5, background: c, border: 0, cursor: "pointer", boxShadow: s.commentColor === c ? `0 0 0 2px var(--card), 0 0 0 3.5px ${c}` : "none" }}
                />
              ))}
            </div>
          </>
        )}

        {s.tool === "whiteout" && (
          <>
            <TBDiv />
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {WHITEOUT_COLORS.map((c) => (
                <button
                  key={c} type="button" title={c === "#000000" ? t("blackout") : c} onClick={() => s.setWhiteout({ whiteoutColor: c })}
                  style={{ width: 18, height: 18, borderRadius: 5, background: c, border: c === "#FFFFFF" ? "1px solid var(--line-2)" : 0, cursor: "pointer", boxShadow: s.whiteoutColor === c ? `0 0 0 2px var(--card), 0 0 0 3.5px ${c === "#FFFFFF" ? "#6B5CE7" : c}` : "none" }}
                />
              ))}
              <button
                type="button" title={t("whiteoutColor")} onClick={() => whiteoutColorRef.current?.click()}
                style={{ width: 18, height: 18, borderRadius: 5, background: s.whiteoutColor, border: "1px solid var(--line-2)", cursor: "pointer", position: "relative" }}
              >
                <input ref={whiteoutColorRef} type="color" value={s.whiteoutColor} onChange={(e) => s.setWhiteout({ whiteoutColor: e.target.value })} style={{ position: "absolute", width: 0, height: 0, opacity: 0, pointerEvents: "none" }} />
              </button>
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

        {stampOpen && (
          <div
            style={{
              position: "absolute", right: 74, top: 46, zIndex: 40, width: 200, background: "var(--card)",
              border: "1px solid var(--line-2)", borderRadius: 12, padding: 6, boxShadow: "0 16px 40px -12px rgba(0,0,0,0.6)",
            }}
          >
            {STAMP_LABELS.map((lbl) => (
              <button
                key={lbl} type="button" className="pp-related"
                onClick={() => addStamp(lbl)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 8,
                  background: "transparent", border: 0, color: "var(--text)", fontSize: 13, cursor: "pointer", fontFamily: "inherit",
                }}
              >
                <span style={{ width: 10, height: 10, borderRadius: 3, border: `2px solid ${STAMP_COLOR[lbl]}`, flexShrink: 0 }} />
                <span style={{ color: STAMP_COLOR[lbl], fontWeight: 700, fontSize: 12, letterSpacing: "0.05em" }}>{lbl}</span>
              </button>
            ))}
          </div>
        )}

        {marksOpen && (
          <div
            style={{
              position: "absolute", right: 40, top: 46, zIndex: 40, width: 180, background: "var(--card)",
              border: "1px solid var(--line-2)", borderRadius: 12, padding: 6, boxShadow: "0 16px 40px -12px rgba(0,0,0,0.6)",
            }}
          >
            {([["check", IconCheck, t("markCheck")], ["cross", IconX, t("markCross")], ["circle", IconCircleShape, t("markCircle")]] as [MarkType, ComponentType<IconProps>, string][]).map(([k, Ic, label]) => (
              <button
                key={k} type="button" className="pp-related"
                onClick={() => { s.setMarkType(k); setMarksOpen(false); }}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 8,
                  background: s.tool === "mark" && s.markType === k ? "rgba(107,92,231,0.14)" : "transparent", border: 0,
                  color: "var(--text)", fontSize: 13, cursor: "pointer", fontFamily: "inherit",
                }}
              >
                <span style={{ color: MARK_COLOR[k], display: "inline-flex" }}><Ic size={17} sw={2.4} /></span> {label}
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
        <TBtn icon={IconLink} label={t("toolLink")} disabled={!enabled} onClick={() => setLinkOpen(true)} />
        <TBtn icon={IconCopy} label={t("duplicate")} disabled={!enabled} onClick={duplicateBlock} />
        <TBtn icon={IconTrash} label={t("deleteBlock")} danger disabled={!enabled} kbd="Del" onClick={() => s.selectedBlock && s.deleteBlock(s.selectedBlock)} />
      </div>

      {/* Row 3 — actions */}
      <div className="pp-ed-row" style={{ ...ROW, height: 46, gap: 5 }}>
        <TBtn icon={IconUndo} label={t("undo")} kbd="⌘Z" disabled={!s.undoStack.length} onClick={s.undo} />
        <TBtn icon={IconRedo} label={t("redo")} kbd="⌘⇧Z" disabled={!s.redoStack.length} onClick={s.redo} />
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

      <LinkDialog open={linkOpen} onConfirm={addLink} onClose={() => setLinkOpen(false)} />
    </div>
  );
}
