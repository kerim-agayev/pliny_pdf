"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { BottomSheet } from "./EditPdf/BottomSheet";
import {
  IconCursor, IconHighlight, IconUnderline, IconStrike, IconPen, IconSticky,
  IconType, IconRect, IconCircleShape, IconArrowDraw, IconLineShape, type IconProps,
} from "@/components/shared/icons";
import type { ComponentType } from "react";

// Mobile palette + stroke presets come straight from the Phase 9 design
// (`screen-annotate-mobile.jsx` / `phase9-kit.jsx`). Richer than the 6-swatch
// desktop strip, but the engine's `color`/`stroke` state takes any value.
export const ANNOT_MOBILE_COLORS = ["#FACC15", "#FB923C", "#F43F5E", "#EC4899", "#A855F7", "#6B5CE7", "#3B82F6", "#10B981"];
const STROKE_PRESETS = [1, 3, 6]; // thin / medium / thick — engine default 3 = medium

// Tools shown on the bottom row, in the design's order. Maps the design's
// `draw`/`note` ids to the engine's `pen`/`sticky`. No eraser on mobile —
// deletion is via the long-press context menu (matches the design).
const MOBILE_TOOLS: [string, ComponentType<IconProps>][] = [
  ["select", IconCursor], ["highlight", IconHighlight], ["underline", IconUnderline],
  ["strike", IconStrike], ["pen", IconPen], ["sticky", IconSticky], ["text", IconType],
  ["rect", IconRect], ["circle", IconCircleShape], ["line", IconLineShape], ["arrow", IconArrowDraw],
];

// every tool except select opens an options sheet; only these also show stroke width
const STROKE_TOOLS = new Set(["pen", "rect", "circle", "line", "arrow"]);

function ToolBtn({ Ic, label, active, onClick }: { Ic: ComponentType<IconProps>; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button" onClick={onClick} title={label}
      style={{
        flexShrink: 0, width: 58, height: 56, borderRadius: 12, border: "none", cursor: "pointer",
        background: active ? "rgba(107,92,231,0.18)" : "transparent",
        color: active ? "#BFB5FF" : "var(--text-2)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4,
        transition: "background .14s, color .14s",
      }}
    >
      <Ic size={21} sw={1.7} />
      <span style={{ fontSize: 9.5, fontWeight: 500, letterSpacing: "-0.01em" }}>{label.split(" ")[0]}</span>
    </button>
  );
}

export function SwatchGrid({ palette, value, onPick }: { palette: string[]; value?: string; onPick: (c: string) => void }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
      {palette.map((c) => (
        <button key={c} type="button" onClick={() => onPick(c)} aria-label={c}
          style={{
            width: 44, height: 44, borderRadius: 12, background: c, cursor: "pointer", padding: 0,
            border: c.toLowerCase() === "#ffffff" ? "1px solid var(--line-2)" : "none",
            boxShadow: value?.toLowerCase() === c.toLowerCase() ? "0 0 0 2px var(--card), 0 0 0 4px var(--indigo)" : "none",
          }} />
      ))}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="pp-mono" style={{ fontSize: 10.5, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 10 }}>{label}</div>
      {children}
    </div>
  );
}

/**
 * Bottom-fixed mobile toolbar for Annotate PDF (Wave 9B). Props/callback-driven —
 * unlike Edit PDF's store-driven MobileToolbar — because EditorTool keeps its tool /
 * color / stroke in local React state over a Fabric.js canvas. Tapping a tool selects
 * it and opens an options BottomSheet (Color, plus Stroke width for draw/shapes).
 */
export function MobileAnnotateToolbar({
  tool, color, stroke, onPickTool, onColor, onStroke,
}: {
  tool: string; color: string; stroke: number;
  onPickTool: (t: string) => void; onColor: (c: string) => void; onStroke: (w: number) => void;
}) {
  const t = useTranslations("ToolPages.editor");
  const [sheet, setSheet] = useState<string | null>(null);

  function pick(id: string) {
    onPickTool(id);
    setSheet(id === "select" ? null : id);
  }

  return (
    <>
      <div style={{ flexShrink: 0, background: "var(--card)", borderTop: "1px solid var(--line)", paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div style={{ display: "flex", gap: 2, overflowX: "auto", padding: "8px 8px 6px", scrollbarWidth: "none" }} className="pp-ed-row">
          {MOBILE_TOOLS.map(([id, Ic]) => (
            <ToolBtn key={id} Ic={Ic} label={t(`tools.${id}`)} active={tool === id} onClick={() => pick(id)} />
          ))}
        </div>
      </div>

      {sheet && (
        <BottomSheet title={t(`tools.${sheet}`)} subtitle={t("mobile.tapApply")} maxH="56%" onClose={() => setSheet(null)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {STROKE_TOOLS.has(sheet) && (
              <Field label={t("mobile.width")}>
                <div style={{ display: "flex", gap: 10 }}>
                  {STROKE_PRESETS.map((w) => (
                    <button key={w} type="button" onClick={() => onStroke(w)}
                      style={{ flex: 1, height: 52, borderRadius: 12, cursor: "pointer", border: stroke === w ? "1px solid var(--indigo)" : "1px solid var(--line)", background: stroke === w ? "rgba(107,92,231,0.16)" : "var(--bg-2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ width: 40, height: w + 1, borderRadius: 3, background: stroke === w ? "#BFB5FF" : "var(--text-2)" }} />
                    </button>
                  ))}
                </div>
              </Field>
            )}
            <Field label={t("mobile.color")}>
              <SwatchGrid palette={ANNOT_MOBILE_COLORS} value={color} onPick={onColor} />
            </Field>
          </div>
        </BottomSheet>
      )}
    </>
  );
}
