"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { FileDropzone } from "./FileDropzone";
import { FileInfoBar } from "./FileInfoBar";
import { SuccessPanel, ErrorBanner } from "./ResultPanels";
import { Spinner } from "./Spinner";
import { ProgressPanel } from "./ProgressPanel";
import { IconRect, IconCheck, IconChevron, IconCompress, IconFile, IconCursor, IconRefresh, IconArrow, IconZoomIn } from "@/components/shared/icons";
import {
  getPageSizes,
  aspectInsets,
  detectMargins,
  type CropInsets,
  type CropScope,
  type PageSize,
} from "@/lib/pdf/crop";
import { parsePageRanges } from "@/lib/pdf/extract";
import { createThumbLoader, type Thumb, type ThumbLoader } from "@/lib/pdf/thumbnailLoader";
import { runPdfOp } from "@/lib/workers/pdfOpsClient";
import { isPdf } from "@/lib/pdf/common";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import { downloadBlob, baseName, MAX_FILE_BYTES } from "@/lib/format";
import { analytics } from "@/lib/analytics";

type Status = "idle" | "loading" | "ready" | "processing" | "done" | "error";
type Unit = "mm" | "in" | "px";
type PresetId = "margins" | "square" | "letter" | "a4" | "custom";

const PREVIEW_SCALE = 0.85;
const MAX_PREVIEW_W = 480;
const HANDLES = ["tl", "tr", "bl", "br", "tc", "bc", "ml", "mr"] as const;
type Handle = (typeof HANDLES)[number];

const PRESETS: { id: PresetId; icon: typeof IconRect; aspect?: number }[] = [
  { id: "margins", icon: IconCompress },
  { id: "square", icon: IconRect, aspect: 1 },
  { id: "letter", icon: IconFile, aspect: 8.5 / 11 },
  { id: "a4", icon: IconFile, aspect: 210 / 297 },
  { id: "custom", icon: IconCursor },
];

function ptToUnit(pt: number, unit: Unit): number {
  if (unit === "mm") return (pt * 25.4) / 72;
  if (unit === "in") return pt / 72;
  return pt; // px ~ pt at 72dpi
}
function unitToPt(v: number, unit: Unit): number {
  if (unit === "mm") return (v * 72) / 25.4;
  if (unit === "in") return v * 72;
  return v;
}

// Shared crop preview (page image + darkened scrim + draggable frame + 8 handles).
// Used by both the desktop two-column layout and the mobile full-screen editor.
// On touch the handles keep their 12px visual but gain a 44×44 transparent hit area.
function CropCanvas({
  thumb, displayW, insets, darken, frameRef, onHandleDown, isMobile, dimLabel,
}: {
  thumb: Thumb;
  displayW: number;
  insets: CropInsets;
  darken: string;
  frameRef: React.RefObject<HTMLDivElement | null>;
  onHandleDown: (h: Handle, e: React.PointerEvent) => void;
  isMobile: boolean;
  dimLabel: string;
}) {
  const HIT = isMobile ? 44 : 12;
  const half = HIT / 2;
  return (
    <div ref={frameRef} className="relative shrink-0 select-none" style={{ width: displayW, maxWidth: "100%", aspectRatio: `${thumb.w} / ${thumb.h}` }}>
      <img src={thumb.url} alt="page" className="h-full w-full rounded shadow-lg" draggable={false} />
      {/* darken */}
      <div className="pointer-events-none absolute inset-0">
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: `${insets.top}%`, background: darken }} />
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: `${insets.bottom}%`, background: darken }} />
        <div style={{ position: "absolute", top: `${insets.top}%`, bottom: `${insets.bottom}%`, left: 0, width: `${insets.left}%`, background: darken }} />
        <div style={{ position: "absolute", top: `${insets.top}%`, bottom: `${insets.bottom}%`, right: 0, width: `${insets.right}%`, background: darken }} />
      </div>
      {/* crop frame */}
      <div
        className="absolute"
        style={{ top: `${insets.top}%`, left: `${insets.left}%`, right: `${insets.right}%`, bottom: `${insets.bottom}%`, border: "1.5px solid var(--indigo)", boxShadow: "0 0 0 1px rgba(0,0,0,0.3)" }}
      >
        <div className="pointer-events-none absolute inset-0">
          <div style={{ position: "absolute", top: "33.33%", left: 0, right: 0, height: 1, background: "rgba(255,255,255,0.18)" }} />
          <div style={{ position: "absolute", top: "66.66%", left: 0, right: 0, height: 1, background: "rgba(255,255,255,0.18)" }} />
          <div style={{ position: "absolute", left: "33.33%", top: 0, bottom: 0, width: 1, background: "rgba(255,255,255,0.18)" }} />
          <div style={{ position: "absolute", left: "66.66%", top: 0, bottom: 0, width: 1, background: "rgba(255,255,255,0.18)" }} />
        </div>
        <div className="pp-mono absolute" style={{ left: 6, top: 6, fontSize: 10, color: "white", background: "rgba(107,92,231,0.9)", borderRadius: 4, padding: "2px 7px" }}>
          {dimLabel}
        </div>
        {HANDLES.map((h) => {
          const corner = h.length === 2 && !h.includes("c");
          const style: React.CSSProperties = {
            position: "absolute", width: HIT, height: HIT, zIndex: 4, touchAction: "none",
            display: "flex", alignItems: "center", justifyContent: "center",
          };
          if (h.includes("t")) style.top = -half;
          if (h.includes("b")) style.bottom = -half;
          if (h.includes("l")) style.left = -half;
          if (h.includes("r")) style.right = -half;
          if (h === "tc" || h === "bc") { style.left = "50%"; style.marginLeft = -half; style.cursor = "ns-resize"; }
          else if (h === "ml" || h === "mr") { style.top = "50%"; style.marginTop = -half; style.cursor = "ew-resize"; }
          else style.cursor = h === "tl" || h === "br" ? "nwse-resize" : "nesw-resize";
          return (
            <div key={h} style={style} onPointerDown={(e) => onHandleDown(h, e)}>
              <div style={{ width: 12, height: 12, borderRadius: corner ? 3 : 6, background: "white", border: "2px solid var(--indigo)", boxShadow: "0 2px 6px rgba(0,0,0,0.4)" }} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function CropPdf() {
  const t = useTranslations("ToolUI");
  const tp = useTranslations("ToolPages.cropPdf");
  const isMobile = useMediaQuery("(max-width: 767px)");
  const [file, setFile] = useState<File | null>(null);
  const loaderRef = useRef<ThumbLoader | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [thumb, setThumb] = useState<Thumb | null>(null);
  const [progress, setProgress] = useState({ page: 0, total: 0 });
  const [sizes, setSizes] = useState<PageSize[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<Blob | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>();
  const [previewPage, setPreviewPage] = useState(1);
  const [preset, setPreset] = useState<PresetId>("custom");
  const [scope, setScope] = useState<"all" | "current" | "range">("all");
  const [rangeStr, setRangeStr] = useState("1-5, 7, 10-15");
  const [unit, setUnit] = useState<Unit>("mm");
  const [insets, setInsets] = useState<CropInsets>({ top: 8, right: 8, bottom: 8, left: 8 });

  const frameRef = useRef<HTMLDivElement>(null);
  const drag = useRef<Handle | null>(null);

  const total = pageCount;
  const size = sizes[previewPage - 1] ?? { w: 595, h: 842 };

  // Render only the selected preview page, on demand (cached by the loader).
  useEffect(() => {
    const loader = loaderRef.current;
    if (!loader || status === "idle" || total === 0) return;
    let cancelled = false;
    loader
      .renderPage(previewPage - 1, PREVIEW_SCALE)
      .then((th) => {
        if (!cancelled) setThumb(th);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [previewPage, total, status]);

  async function onFiles(files: File[]) {
    const f = files[0];
    if (!f || !isPdf(f)) {
      setErrorMsg(t("wrongTypePdf"));
      return;
    }
    if (f.size > MAX_FILE_BYTES) {
      setErrorMsg(t("tooLarge"));
      return;
    }
    setErrorMsg(undefined);
    setFile(f);
    setStatus("loading");
    setThumb(null);
    loaderRef.current?.destroy();
    const loader = createThumbLoader(f);
    loaderRef.current = loader;
    try {
      const [n, ps] = await Promise.all([loader.pageCount(), getPageSizes(f)]);
      setPageCount(n);
      setSizes(ps);
      setPreviewPage(1);
      setInsets({ top: 8, right: 8, bottom: 8, left: 8 });
      setPreset("custom");
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }

  function clampInsets(next: CropInsets): CropInsets {
    const top = Math.max(0, Math.min(next.top, 95));
    const bottom = Math.max(0, Math.min(next.bottom, 95));
    const left = Math.max(0, Math.min(next.left, 95));
    const right = Math.max(0, Math.min(next.right, 95));
    return {
      top: top + bottom > 95 ? 95 - bottom : top,
      bottom,
      left: left + right > 95 ? 95 - right : left,
      right,
    };
  }

  function onHandleDown(h: Handle, e: React.PointerEvent) {
    e.preventDefault();
    drag.current = h;
    setPreset("custom");
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }
  function onMove(e: PointerEvent) {
    const h = drag.current;
    const rect = frameRef.current?.getBoundingClientRect();
    if (!h || !rect) return;
    const px = ((e.clientX - rect.left) / rect.width) * 100;
    const py = ((e.clientY - rect.top) / rect.height) * 100;
    setInsets((prev) => {
      const next = { ...prev };
      if (h.includes("t")) next.top = py;
      if (h.includes("b")) next.bottom = 100 - py;
      if (h.includes("l")) next.left = px;
      if (h.includes("r")) next.right = 100 - px;
      return clampInsets(next);
    });
  }
  function onUp() {
    drag.current = null;
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
  }

  function applyPreset(id: PresetId) {
    setPreset(id);
    if (id === "custom") return;
    if (id === "margins") {
      if (thumb) detectMargins(thumb.url).then((m) => setInsets(clampInsets(m))).catch(() => {});
      return;
    }
    const p = PRESETS.find((x) => x.id === id);
    if (p?.aspect) setInsets(aspectInsets(size.w, size.h, p.aspect));
  }

  function setEdge(edge: keyof CropInsets, value: number) {
    const dim = edge === "top" || edge === "bottom" ? size.h : size.w;
    const pct = (unitToPt(value, unit) / dim) * 100;
    setPreset("custom");
    setInsets((prev) => clampInsets({ ...prev, [edge]: pct }));
  }

  async function run() {
    if (!file) return;
    let cropScope: CropScope;
    if (scope === "all") cropScope = { mode: "all" };
    else if (scope === "current") cropScope = { mode: "current", index: previewPage - 1 };
    else cropScope = { mode: "range", indices: parsePageRanges(rangeStr, total) };
    if (cropScope.mode === "range" && cropScope.indices.length === 0) return;
    setStatus("processing");
    setProgress({ page: 0, total: 0 });
    try {
      setResult(await runPdfOp("crop", file, { insets, scope: cropScope }, (page, t2) => setProgress({ page, total: t2 })));
      setStatus("done");
      analytics.toolUsed("crop-pdf");
    } catch {
      setStatus("error");
    }
  }

  function reset() {
    loaderRef.current?.destroy();
    loaderRef.current = null;
    setFile(null);
    setPageCount(0);
    setThumb(null);
    setSizes([]);
    setResult(null);
    setStatus("idle");
    setErrorMsg(undefined);
    setPreviewPage(1);
  }

  if (status === "done" && result) {
    return (
      <SuccessPanel
        title={tp("successTitle")}
        meta={`${baseName(file!.name)}-cropped.pdf`}
        onDownload={() => downloadBlob(result, `${baseName(file!.name)}-cropped.pdf`)}
        onReset={reset}
      />
    );
  }

  if (!file) {
    return (
      <div>
        <FileDropzone toolId="crop-pdf" accept="pdf" checkPages onFiles={onFiles} title={tp("emptyTitle")} />
        {errorMsg && (
          <div className="mt-4">
            <ErrorBanner message={errorMsg} onRetry={() => setErrorMsg(undefined)} />
          </div>
        )}
      </div>
    );
  }

  const displayW = thumb ? Math.min(thumb.w, MAX_PREVIEW_W) : MAX_PREVIEW_W;
  const outW = ptToUnit(size.w * (1 - (insets.left + insets.right) / 100), unit);
  const outH = ptToUnit(size.h * (1 - (insets.top + insets.bottom) / 100), unit);
  const darken = "rgba(10,10,12,0.72)";
  const edgeVals: [keyof CropInsets, string][] = [
    ["top", tp("top")], ["right", tp("right")], ["bottom", tp("bottom")], ["left", tp("left")],
  ];
  const rangeIndices = scope === "range" ? parsePageRanges(rangeStr, total) : [];

  if (isMobile) {
    const mobileW = thumb ? Math.min(thumb.w, 240) : 240;
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", flexDirection: "column", background: "var(--bg)" }}>
        {/* header */}
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "env(safe-area-inset-top) 8px 0", height: "calc(52px + env(safe-area-inset-top))", flexShrink: 0, background: "var(--card)", borderBottom: "1px solid var(--line)" }}>
          <button type="button" onClick={reset} aria-label={tp("mobile.back")} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 40, height: 40, borderRadius: 10, border: "1px solid var(--line)", background: "var(--bg-2)", color: "var(--text-2)" }}>
            <IconChevron size={18} style={{ transform: "rotate(180deg)" }} />
          </button>
          <div style={{ flex: 1, minWidth: 0, textAlign: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{tp("mobile.title")}</div>
            <div className="pp-mono" style={{ fontSize: 10.5, color: "var(--text-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file!.name}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
            <button type="button" onClick={() => setPreviewPage((p) => Math.max(1, p - 1))} aria-label="previous page" style={{ width: 30, height: 30, borderRadius: 8, background: "transparent", border: 0, color: "var(--text-2)", display: "flex", alignItems: "center", justifyContent: "center" }}><IconChevron size={15} style={{ transform: "rotate(180deg)" }} /></button>
            <span className="pp-mono" style={{ fontSize: 12, color: "var(--text)", minWidth: 30, textAlign: "center" }}>{previewPage}/{total}</span>
            <button type="button" onClick={() => setPreviewPage((p) => Math.min(total, p + 1))} aria-label="next page" style={{ width: 30, height: 30, borderRadius: 8, background: "transparent", border: 0, color: "var(--text-2)", display: "flex", alignItems: "center", justifyContent: "center" }}><IconChevron size={15} /></button>
          </div>
        </header>

        {/* preview */}
        <div style={{ flex: 1, position: "relative", overflow: "hidden", background: "repeating-linear-gradient(45deg, rgba(127,127,127,0.04) 0 1px, transparent 1px 16px), var(--bg-2)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          {status === "loading" || !thumb ? (
            <div className="flex items-center gap-2" style={{ color: "var(--text-3)" }}><Spinner size={18} /> {t("processing")}</div>
          ) : (
            <>
              <CropCanvas thumb={thumb} displayW={mobileW} insets={insets} darken={darken} frameRef={frameRef} onHandleDown={onHandleDown} isMobile dimLabel={`${Math.round(outW)} × ${Math.round(outH)} ${unit}`} />
              <div style={{ position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)", display: "flex", alignItems: "center", gap: 7, padding: "6px 12px", borderRadius: 999, background: "rgba(15,15,15,0.62)", backdropFilter: "blur(6px)", border: "1px solid var(--line-2)", fontSize: 11, color: "var(--text-2)", whiteSpace: "nowrap" }}><IconZoomIn size={13} /> {tp("mobile.hint")}</div>
            </>
          )}
        </div>

        {/* bottom panel */}
        <div style={{ flexShrink: 0, background: "var(--card)", borderTop: "1px solid var(--line)", borderRadius: "20px 20px 0 0", padding: "8px 16px calc(8px + env(safe-area-inset-bottom))", boxShadow: "0 -10px 30px -16px rgba(0,0,0,0.5)" }}>
          <div style={{ width: 40, height: 5, borderRadius: 3, background: "var(--line-2)", margin: "4px auto 14px" }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <div className="pp-mono" style={{ fontSize: 10, letterSpacing: "0.1em", color: "var(--text-3)", marginBottom: 9 }}>{tp("presets").toUpperCase()}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {PRESETS.map((p) => {
                  const on = preset === p.id;
                  return (
                    <button key={p.id} type="button" onClick={() => applyPreset(p.id)} style={{ height: 36, padding: "0 14px", borderRadius: 10, fontSize: 13, border: on ? "1px solid var(--indigo)" : "1px solid var(--line)", background: on ? "rgba(107,92,231,0.16)" : "var(--bg-2)", color: on ? "#BFB5FF" : "var(--text-2)", fontWeight: on ? 600 : 400 }}>{tp(`preset_${p.id}`)}</button>
                  );
                })}
              </div>
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
              <div style={{ flex: 1 }}>
                <div className="pp-mono" style={{ fontSize: 10, letterSpacing: "0.1em", color: "var(--text-3)", marginBottom: 9 }}>{tp("applyTo").toUpperCase()}</div>
                <div style={{ display: "flex", gap: 3, padding: 4, background: "var(--bg-2)", border: "1px solid var(--line)", borderRadius: 11 }}>
                  {(["all", "current"] as const).map((s) => {
                    const on = scope === s;
                    return <button key={s} type="button" onClick={() => setScope(s)} style={{ flex: 1, height: 38, borderRadius: 8, border: 0, background: on ? "var(--card-hi)" : "transparent", color: on ? "var(--text)" : "var(--text-2)", fontSize: 13, fontWeight: on ? 600 : 500, boxShadow: on ? "0 1px 3px rgba(0,0,0,0.25)" : "none" }}>{tp(`scope_${s}`)}</button>;
                  })}
                </div>
              </div>
              <button type="button" onClick={() => { setInsets({ top: 8, right: 8, bottom: 8, left: 8 }); setPreset("custom"); }} style={{ height: 46, padding: "0 16px", borderRadius: 11, background: "var(--bg-2)", border: "1px solid var(--line)", color: "var(--text-2)", fontSize: 13, display: "inline-flex", alignItems: "center", gap: 7 }}><IconRefresh size={14} /> {tp("mobile.reset")}</button>
            </div>
          </div>
          <div style={{ padding: "14px 0 4px" }}>
            <button type="button" className="pp-btn pp-btn-lg" style={{ width: "100%", justifyContent: "center", boxShadow: "0 12px 30px -14px rgba(107,92,231,0.6)" }} onClick={run} disabled={status === "processing"}>
              {status === "processing" ? <><Spinner /> {t("processing")}</> : <>{tp("action")} <IconArrow size={15} /></>}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[340px_1fr]">
      {/* Settings */}
      <div className="flex flex-col gap-5">
        <FileInfoBar file={file} pages={total || undefined} onRemove={reset} />
        <div className="pp-card flex flex-col gap-5" style={{ padding: 24 }}>
          <h3 className="pp-mono text-[13px] font-medium uppercase tracking-[0.04em]" style={{ color: "var(--text-3)" }}>
            {tp("panelTitle")}
          </h3>

          {/* Apply to */}
          <div>
            <div className="mb-2 text-[13px] font-medium">{tp("applyTo")}</div>
            <div className="grid grid-cols-3 gap-1 rounded-lg p-1" style={{ background: "var(--bg-2)", border: "1px solid var(--line)" }}>
              {(["all", "current", "range"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setScope(s)}
                  className="rounded-md py-1.5 text-[12.5px] transition-colors"
                  style={{ background: scope === s ? "var(--indigo)" : "transparent", color: scope === s ? "#fff" : "var(--text-2)" }}
                >
                  {tp(`scope_${s}`)}
                </button>
              ))}
            </div>
            {scope === "range" && (
              <input
                className="pp-input pp-mono mt-2.5"
                value={rangeStr}
                onChange={(e) => setRangeStr(e.target.value)}
                placeholder="e.g. 1-5, 7, 10-15"
                style={{ borderColor: rangeIndices.length === 0 ? "#F43F5E" : undefined }}
              />
            )}
          </div>

          {/* Presets */}
          <div>
            <div className="mb-2 text-[13px] font-medium">{tp("presets")}</div>
            <div className="flex flex-col gap-2">
              {PRESETS.map((p) => {
                const Ic = p.icon;
                const active = preset === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => applyPreset(p.id)}
                    className="flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-left"
                    style={{ background: active ? "rgba(107,92,231,0.1)" : "var(--bg-2)", border: active ? "1px solid var(--indigo)" : "1px solid var(--line)" }}
                  >
                    <div className="flex size-[30px] items-center justify-center rounded-lg" style={{ border: "1px solid var(--line)", color: active ? "#BFB5FF" : "var(--text-2)" }}>
                      <Ic size={15} sw={1.7} />
                    </div>
                    <div className="flex-1">
                      <div className="text-[13.5px] font-medium" style={{ color: "var(--text)" }}>{tp(`preset_${p.id}`)}</div>
                      <div className="pp-mono text-[11px]" style={{ color: "var(--text-3)" }}>{tp(`preset_${p.id}_sub`)}</div>
                    </div>
                    {active && <IconCheck size={15} color="#BFB5FF" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Manual */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[13px] font-medium">{tp("manual")}</span>
              <div className="flex gap-0.5 rounded-lg p-[3px]" style={{ background: "var(--bg-2)", border: "1px solid var(--line)" }}>
                {(["mm", "in", "px"] as Unit[]).map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setUnit(u)}
                    className="pp-mono rounded px-2.5 py-1 text-[11.5px]"
                    style={{ background: unit === u ? "rgba(107,92,231,0.18)" : "transparent", color: unit === u ? "#BFB5FF" : "var(--text-3)" }}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {edgeVals.map(([edge, label]) => {
                const dim = edge === "top" || edge === "bottom" ? size.h : size.w;
                const val = ptToUnit((insets[edge] / 100) * dim, unit);
                return (
                  <div key={edge}>
                    <div className="pp-mono mb-1 text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--text-3)" }}>{label}</div>
                    <div className="relative">
                      <input
                        className="pp-input"
                        type="number"
                        value={Math.round(val * 10) / 10}
                        onChange={(e) => setEdge(edge, Math.max(0, +e.target.value || 0))}
                        style={{ paddingRight: 32 }}
                      />
                      <span className="pp-mono absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px]" style={{ color: "var(--text-3)" }}>{unit}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button type="button" className="pp-btn pp-btn-lg w-full justify-center" onClick={run} disabled={status === "processing" || (scope === "range" && rangeIndices.length === 0)}>
            {status === "processing" ? <><Spinner /> {t("processing")}</> : <><IconRect size={15} sw={1.7} /> {tp("action")}</>}
          </button>
          {status === "processing" && <ProgressPanel page={progress.page} total={progress.total} />}
        </div>
      </div>

      {/* Canvas */}
      <div
        className="relative flex flex-col items-center rounded-2xl p-9"
        style={{ background: "repeating-linear-gradient(45deg, rgba(127,127,127,0.04) 0 1px, transparent 1px 14px), var(--bg-2)", border: "1px solid var(--line)", minHeight: 560 }}
      >
        <div className="absolute left-5 top-4">
          <span className="pp-mono text-[10.5px] uppercase tracking-[0.1em]" style={{ color: "var(--text-3)" }}>
            {tp("cropLabel")} · {tp("pageLabel", { n: previewPage })} / {total}
          </span>
        </div>

        {status === "loading" || !thumb ? (
          <div className="flex flex-1 items-center justify-center gap-2" style={{ color: "var(--text-3)" }}>
            <Spinner size={18} /> {t("processing")}
          </div>
        ) : (
          <>
            <div className="mt-6">
              <CropCanvas thumb={thumb} displayW={displayW} insets={insets} darken={darken} frameRef={frameRef} onHandleDown={onHandleDown} isMobile={false} dimLabel={`${Math.round(outW)} × ${Math.round(outH)} ${unit}`} />
            </div>

            {/* page navigator + thumb strip */}
            <div className="mt-8 flex items-center gap-3.5">
              <button type="button" onClick={() => setPreviewPage((p) => Math.max(1, p - 1))} className="flex rounded-lg p-2" style={{ background: "var(--card)", border: "1px solid var(--line)", color: "var(--text-2)" }} aria-label="previous page">
                <IconChevron size={14} style={{ transform: "rotate(180deg)" }} />
              </button>
              <span className="pp-mono text-[13px]">{tp("pageLabel", { n: previewPage })} <span style={{ color: "var(--text-3)" }}>/ {total}</span></span>
              <button type="button" onClick={() => setPreviewPage((p) => Math.min(total, p + 1))} className="flex rounded-lg p-2" style={{ background: "var(--card)", border: "1px solid var(--line)", color: "var(--text-2)" }} aria-label="next page">
                <IconChevron size={14} />
              </button>
            </div>
          </>
        )}

        {status === "error" && (
          <div className="mt-4 w-full max-w-md">
            <ErrorBanner onRetry={() => setStatus("ready")} />
          </div>
        )}
      </div>
    </div>
  );
}
