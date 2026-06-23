"use client";

/* eslint-disable @next/next/no-img-element */
import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useEditorStore, type ShapeType, type MarkType } from "@/lib/stores/editorStore";
import { uploadImage as apiUploadImage } from "@/lib/api/editor";
import {
  IconCursor, IconTextPlus, IconHighlight, IconStrike, IconPen, IconShapes, IconMessage,
  IconImage, IconBolt, IconCheck, IconLink, IconWhiteout, IconBold, IconItalic, IconUnderlineText,
  IconAlignLeft, IconAlignCenter, IconAlignRight, IconRect, IconCircleShape, IconLineShape,
  IconArrowDraw, IconCircleShape as IconCircle, IconPipette, type IconProps,
} from "@/components/shared/icons";
import type { ComponentType } from "react";
import { BottomSheet } from "./BottomSheet";
import { LinkDialog } from "./LinkDialog";

// ── shared constants (mirror EditorToolbar so mobile == desktop, D1) ─────────
const FONTS = ["Helvetica", "Times", "Courier", "Noto Sans", "Noto Serif", "Noto Sans Mono"];
const SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32];
const DRAW_COLORS = ["#0F0F0F", "#F43F5E", "#3B82F6", "#10B981", "#FACC15", "#FFFFFF"];
const STROKES = [1, 3, 6];
const HIGHLIGHT_PALETTE = ["#FBBF24", "#34D399", "#60A5FA", "#F472B6", "#FB923C", "#FCA5A5"];
const COMMENT_PALETTE = ["#FBBF24", "#34D399", "#60A5FA", "#F472B6"];
const WHITEOUT_COLORS = ["#FFFFFF", "#000000", "#FEF08A", "#F87171"];
const TEXT_COLORS = ["#1F1F1F", "#6B5CE7", "#3B82F6", "#10B981", "#F43F5E", "#FB923C", "#FACC15"];
const MARK_COLOR: Record<MarkType, string> = { check: "#16A34A", cross: "#DC2626", circle: "#2563EB" };
const STAMP_COLOR: Record<string, string> = {
  DRAFT: "#EF4444", VOID: "#EF4444", CONFIDENTIAL: "#EF4444", APPROVED: "#10B981",
  COPY: "#3B82F6", FINAL: "#3B82F6", RECEIVED: "#3B82F6", REVIEWED: "#3B82F6",
};
const STAMP_LABELS = ["DRAFT", "APPROVED", "CONFIDENTIAL", "COPY", "FINAL", "VOID", "RECEIVED", "REVIEWED"] as const;
const SHAPE_TYPES: [ShapeType, ComponentType<IconProps>][] = [
  ["rectangle", IconRect], ["circle", IconCircleShape], ["line", IconLineShape], ["arrow", IconArrowDraw],
];

// distinct id prefixes from the desktop toolbar so a mid-session resize can't collide
let mStampId = 0;
const nextStampId = () => `mstamp${++mStampId}`;
let mLinkId = 0;
const nextLinkId = () => `mlink${++mLinkId}`;

// tools that open an options sheet when tapped (image/link/select do not)
const SHEET_TOOLS = new Set(["text", "highlight", "strike", "draw", "shapes", "comment", "whiteout"]);

type Sheet =
  | "text" | "highlight" | "strike" | "draw" | "shapes" | "comment" | "whiteout" | "stamp" | "marks" | null;

const TOOLS: [string, ComponentType<IconProps>, string][] = [
  ["select", IconCursor, "toolSelect"], ["text", IconTextPlus, "toolText"],
  ["highlight", IconHighlight, "toolHighlight"], ["strike", IconStrike, "toolStrike"],
  ["draw", IconPen, "toolDraw"], ["shapes", IconShapes, "toolShapes"],
  ["comment", IconMessage, "toolComment"], ["image", IconImage, "toolImage"],
  ["stamp", IconBolt, "toolStamp"], ["marks", IconCheck, "toolMark"],
  ["link", IconLink, "toolLink"], ["whiteout", IconWhiteout, "toolWhiteout"],
];

function ToolBtn({ Ic, label, active, onClick }: { Ic: ComponentType<IconProps>; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button" onClick={onClick} title={label}
      style={{
        flexShrink: 0, width: 60, height: 56, borderRadius: 12, border: "none", cursor: "pointer",
        background: active ? "rgba(107,92,231,0.18)" : "transparent",
        color: active ? "#BFB5FF" : "var(--text-2)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4,
        transition: "background .14s, color .14s",
      }}
    >
      <Ic size={21} sw={1.7} />
      <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: "-0.01em" }}>{label}</span>
    </button>
  );
}

export function MobileToolbar() {
  const t = useTranslations("ToolPages.editPdf");
  const s = useEditorStore();
  const [sheet, setSheet] = useState<Sheet>(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  function pickTool(id: string) {
    if (id === "image") { if (!s.sessionId) { toast.error(t("saveFailed")); return; } imageInputRef.current?.click(); return; }
    if (id === "link") {
      if (!s.selectedBlock) { toast.error(t("linkSelectFirst")); return; }
      setLinkOpen(true); return;
    }
    if (id === "stamp") { if (!s.sessionId) { toast.error(t("saveFailed")); return; } setSheet("stamp"); return; }
    if (id === "marks") { setSheet("marks"); return; }
    s.setTool(id as Parameters<typeof s.setTool>[0]);
    setSheet(SHEET_TOOLS.has(id) ? (id as Sheet) : null);
  }

  const active = (id: string) =>
    id === "stamp" ? sheet === "stamp"
    : id === "marks" ? sheet === "marks" || s.tool === "mark"
    : s.tool === id;

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !s.sessionId) return;
    const page = s.pages[s.currentPage];
    if (!page) return;
    try {
      const { imageId } = await apiUploadImage(s.sessionId, file);
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
      s.addAnnotation({ id: `img-${imageId}`, type: "image", pageNum: page.pageNum, x: (page.width - iw) / 2, y: (page.height - ih) / 2, w: iw, h: ih, color: "", imageId });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("saveFailed"));
    }
  }

  function addStamp(label: string) {
    const page = s.pages[s.currentPage];
    if (!page) return;
    const color = STAMP_COLOR[label] ?? "#3B82F6";
    const w = 160, h = 50;
    s.addAnnotation({ id: nextStampId(), type: "stamp", pageNum: page.pageNum, x: (page.width - w) / 2, y: (page.height - h) / 2, w, h, color, label });
    setSheet(null);
  }

  function addLink(uri: string) {
    setLinkOpen(false);
    const id = s.selectedBlock;
    const page = s.pages[s.currentPage];
    if (!id || !page) return;
    const block = page.textBlocks.find((b) => b.blockId === id);
    if (!block) return;
    const pos = s.blockPositions[id];
    s.addAnnotation({ id: nextLinkId(), type: "link", pageNum: page.pageNum, x: pos?.x ?? block.x, y: pos?.y ?? block.y, w: block.w, h: block.h, color: "#2563EB", uri });
  }

  function alignBlock(align: "left" | "center" | "right") {
    const id = s.selectedBlock;
    const page = s.pages[s.currentPage];
    if (!id || !page) return;
    const block = page.textBlocks.find((b) => b.blockId === id);
    if (!block) return;
    const MARGIN = 36;
    const w = s.blockSizes[id]?.w ?? block.w;
    const y = s.blockPositions[id]?.y ?? block.y;
    const x = align === "left" ? MARGIN : align === "center" ? (page.width - w) / 2 : page.width - w - MARGIN;
    s.moveBlock(id, x, y);
  }

  function stepSize(dir: 1 | -1) {
    const i = SIZES.indexOf(s.fontSize);
    const base = i === -1 ? SIZES.findIndex((n) => n >= s.fontSize) : i;
    const next = SIZES[Math.min(SIZES.length - 1, Math.max(0, (base < 0 ? SIZES.length - 1 : base) + dir))];
    s.setFormat({ fontSize: next });
  }

  return (
    <>
      <input ref={imageInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/bmp,image/webp" style={{ display: "none" }} onChange={handleImageUpload} />

      {/* bottom-fixed scrollable tool row */}
      <div style={{ flexShrink: 0, background: "var(--card)", borderTop: "1px solid var(--line)", paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div style={{ display: "flex", gap: 2, overflowX: "auto", padding: "8px 10px", scrollbarWidth: "none" }} className="pp-ed-row">
          {TOOLS.map(([id, Ic, key]) => (
            <ToolBtn key={id} Ic={Ic} label={t(key)} active={active(id)} onClick={() => pickTool(id)} />
          ))}
        </div>
      </div>

      {/* sheets */}
      {sheet === "text" && (
        <BottomSheet title={t("sheetText")} subtitle={t("sheetTextSub")} onClose={() => setSheet(null)}>
          <SheetText t={t} s={s} onAlign={alignBlock} onStepSize={stepSize} onClose={() => setSheet(null)} />
        </BottomSheet>
      )}
      {sheet === "highlight" && (
        <BottomSheet title={t("sheetHighlightColor")} maxH="48%" onClose={() => setSheet(null)}>
          <SwatchGrid palette={HIGHLIGHT_PALETTE} value={s.highlightColor} onPick={(c) => s.setHighlightColor(c)} />
        </BottomSheet>
      )}
      {sheet === "comment" && (
        <BottomSheet title={t("sheetColor")} maxH="48%" onClose={() => setSheet(null)}>
          <SwatchGrid palette={COMMENT_PALETTE} value={s.commentColor} onPick={(c) => s.setCommentColor(c)} />
        </BottomSheet>
      )}
      {sheet === "whiteout" && (
        <BottomSheet title={t("sheetColor")} maxH="48%" onClose={() => setSheet(null)}>
          <SwatchGrid palette={WHITEOUT_COLORS} value={s.whiteoutColor} onPick={(c) => s.setWhiteout({ whiteoutColor: c })} />
        </BottomSheet>
      )}
      {(sheet === "draw" || sheet === "strike") && (
        <BottomSheet title={t("sheetColor")} maxH="56%" onClose={() => setSheet(null)}>
          <Field label={t("fieldColor")}><SwatchGrid palette={DRAW_COLORS} value={s.strokeColor} onPick={(c) => s.setStroke({ strokeColor: c })} /></Field>
          <div style={{ height: 18 }} />
          <Field label={t("fieldWidth")}><StrokeRow value={s.strokeWidth} onPick={(w) => s.setStroke({ strokeWidth: w })} /></Field>
        </BottomSheet>
      )}
      {sheet === "shapes" && (
        <BottomSheet title={t("sheetShapes")} onClose={() => setSheet(null)}>
          <Field label={t("fieldShape")}>
            <div style={{ display: "flex", gap: 8 }}>
              {SHAPE_TYPES.map(([k, Ic]) => (
                <button key={k} type="button" onClick={() => { s.setShapeType(k); s.setTool("shapes"); }}
                  style={tile(s.shapeType === k)}><Ic size={20} sw={1.7} /></button>
              ))}
            </div>
          </Field>
          <div style={{ height: 18 }} />
          <Field label={t("fieldColor")}><SwatchGrid palette={DRAW_COLORS} value={s.strokeColor} onPick={(c) => s.setStroke({ strokeColor: c })} /></Field>
          <div style={{ height: 18 }} />
          <Field label={t("fieldWidth")}><StrokeRow value={s.strokeWidth} onPick={(w) => s.setStroke({ strokeWidth: w })} /></Field>
          {(s.shapeType === "rectangle" || s.shapeType === "circle") && (
            <>
              <div style={{ height: 18 }} />
              <Field label={t("fieldFill")}>
                <button type="button" onClick={() => s.setShapeFill(!s.shapeFill)} style={tile(s.shapeFill)}>
                  <IconRect size={18} sw={1.7} />
                </button>
              </Field>
            </>
          )}
        </BottomSheet>
      )}
      {sheet === "stamp" && (
        <BottomSheet title={t("sheetStamps")} subtitle={t("sheetStampsSub")} onClose={() => setSheet(null)}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {STAMP_LABELS.map((label) => {
              const c = STAMP_COLOR[label];
              return (
                <button key={label} type="button" onClick={() => addStamp(label)}
                  style={{ height: 62, borderRadius: 12, border: `1.5px solid ${c}`, background: "var(--bg-2)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ border: `2px solid ${c}`, color: c, padding: "4px 12px", borderRadius: 5, fontSize: 13, fontWeight: 700, letterSpacing: "0.05em", transform: "rotate(-5deg)" }}>{label}</span>
                </button>
              );
            })}
          </div>
        </BottomSheet>
      )}
      {sheet === "marks" && (
        <BottomSheet title={t("sheetMarks")} subtitle={t("sheetMarksSub")} maxH="48%" onClose={() => setSheet(null)}>
          <div style={{ display: "flex", gap: 10 }}>
            {([["check", IconCheck, t("markCheck")], ["cross", IconStrike, t("markCross")], ["circle", IconCircle, t("markCircle")]] as [MarkType, ComponentType<IconProps>, string][]).map(([k, Ic, label]) => (
              <button key={k} type="button" title={label} onClick={() => { s.setMarkType(k); setSheet(null); }}
                style={{ width: 60, height: 60, borderRadius: 14, cursor: "pointer", border: s.markType === k && s.tool === "mark" ? "1px solid var(--indigo)" : "1px solid var(--line)", background: s.markType === k && s.tool === "mark" ? "rgba(107,92,231,0.16)" : "var(--bg-2)", color: MARK_COLOR[k], display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Ic size={24} sw={2.4} />
              </button>
            ))}
          </div>
        </BottomSheet>
      )}

      <LinkDialog open={linkOpen} onConfirm={addLink} onClose={() => setLinkOpen(false)} />
    </>
  );
}

// ── sheet sub-components ─────────────────────────────────────────────────────

const tile = (on: boolean): React.CSSProperties => ({
  width: 52, height: 44, borderRadius: 11, cursor: "pointer",
  border: on ? "1px solid var(--indigo)" : "1px solid var(--line)",
  background: on ? "rgba(107,92,231,0.16)" : "var(--bg-2)",
  color: on ? "#BFB5FF" : "var(--text)", display: "flex", alignItems: "center", justifyContent: "center",
});

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="pp-mono" style={{ fontSize: 10.5, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 10 }}>{label}</div>
      {children}
    </div>
  );
}

function SwatchGrid({ palette, value, onPick }: { palette: string[]; value: string; onPick: (c: string) => void }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
      {palette.map((c) => (
        <button key={c} type="button" onClick={() => onPick(c)}
          style={{
            width: 44, height: 44, borderRadius: 12, background: c, cursor: "pointer", padding: 0,
            border: c.toLowerCase() === "#ffffff" ? "1px solid var(--line-2)" : "none",
            boxShadow: value?.toLowerCase() === c.toLowerCase() ? "0 0 0 2px var(--card), 0 0 0 4px var(--indigo)" : "none",
          }} />
      ))}
    </div>
  );
}

function StrokeRow({ value, onPick }: { value: number; onPick: (w: number) => void }) {
  return (
    <div style={{ display: "flex", gap: 8 }}>
      {STROKES.map((w) => (
        <button key={w} type="button" onClick={() => onPick(w)} style={tile(value === w)}>
          <span style={{ width: 22, height: w, background: value === w ? "#BFB5FF" : "var(--text-2)", borderRadius: 2 }} />
        </button>
      ))}
    </div>
  );
}

type Store = ReturnType<typeof useEditorStore.getState>;

function SheetText({ t, s, onAlign, onStepSize, onClose }: {
  t: ReturnType<typeof useTranslations>; s: Store;
  onAlign: (a: "left" | "center" | "right") => void; onStepSize: (d: 1 | -1) => void;
  onClose: () => void;
}) {
  const enabled = s.selectedBlock !== null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <Field label={t("fieldFont")}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {FONTS.map((f) => {
            const on = s.fontFamily === f;
            return (
              <button key={f} type="button" onClick={() => s.setFormat({ fontFamily: f })}
                style={{ height: 44, padding: "0 14px", borderRadius: 11, fontSize: 14, cursor: "pointer", border: on ? "1px solid var(--indigo)" : "1px solid var(--line)", background: on ? "rgba(107,92,231,0.16)" : "var(--bg-2)", color: on ? "#BFB5FF" : "var(--text)" }}>{f}</button>
            );
          })}
        </div>
      </Field>
      <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
        <Field label={t("fieldSize")}>
          <div style={{ display: "flex", alignItems: "center", gap: 4, height: 44, padding: "0 6px", borderRadius: 11, background: "var(--bg-2)", border: "1px solid var(--line)", width: 130 }}>
            <button type="button" onClick={() => onStepSize(-1)} style={{ width: 36, height: 36, borderRadius: 9, border: 0, background: "transparent", color: "var(--text)", fontSize: 20, cursor: "pointer" }}>−</button>
            <span className="pp-mono" style={{ flex: 1, textAlign: "center", fontSize: 15 }}>{s.fontSize}</span>
            <button type="button" onClick={() => onStepSize(1)} style={{ width: 36, height: 36, borderRadius: 9, border: 0, background: "transparent", color: "var(--text)", fontSize: 20, cursor: "pointer" }}>+</button>
          </div>
        </Field>
        <Field label={t("fieldStyle")}>
          <div style={{ display: "flex", gap: 8 }}>
            {([
              [IconBold, "bold", s.bold, () => s.setFormat({ bold: !s.bold })],
              [IconItalic, "italic", s.italic, () => s.setFormat({ italic: !s.italic })],
              [IconUnderlineText, "underline", s.underline, () => s.setFormat({ underline: !s.underline })],
            ] as [ComponentType<IconProps>, string, boolean, () => void][]).map(([Ic, key, on, toggle]) => (
              <button key={key} type="button" disabled={!enabled} onClick={toggle}
                style={{ ...tile(enabled && on), width: 44, opacity: enabled ? 1 : 0.4, cursor: enabled ? "pointer" : "not-allowed" }}><Ic size={18} /></button>
            ))}
          </div>
        </Field>
      </div>
      <Field label={t("fieldAlign")}>
        <div style={{ display: "flex", gap: 8 }}>
          {([["left", IconAlignLeft], ["center", IconAlignCenter], ["right", IconAlignRight]] as ["left" | "center" | "right", ComponentType<IconProps>][]).map(([k, Ic]) => (
            <button key={k} type="button" disabled={!enabled} onClick={() => onAlign(k)}
              style={{ ...tile(false), width: 56, opacity: enabled ? 1 : 0.4, cursor: enabled ? "pointer" : "not-allowed" }}><Ic size={18} /></button>
          ))}
        </div>
      </Field>
      <Field label={t("fieldColor")}>
        <SwatchGrid palette={TEXT_COLORS} value={s.fontColor} onPick={(c) => s.setFormat({ fontColor: c })} />
      </Field>
      {/* Wave 11B — background/mask fill: swatches + tap-to-sample eyedropper (closes
          the sheet so the user can tap the page). Only meaningful for an existing block. */}
      {enabled && (
        <Field label={t("fieldBgColor")}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <SwatchGrid palette={WHITEOUT_COLORS} value={s.bgColor} onPick={(c) => s.setFormat({ bgColor: c })} />
            <button type="button" onClick={() => { s.setEyedropper(true); onClose(); }}
              style={{ ...tile(s.eyedropper), width: 44, display: "inline-flex", alignItems: "center", justifyContent: "center" }}
              title={t("eyedropper")}><IconPipette size={18} /></button>
          </div>
        </Field>
      )}
    </div>
  );
}
