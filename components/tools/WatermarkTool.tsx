"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { FileDropzone } from "./FileDropzone";
import { SuccessPanel, ErrorBanner } from "./ResultPanels";
import { Spinner } from "./Spinner";
import { IconWatermark, IconArrow, IconChevron } from "@/components/shared/icons";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import { getPdfjs } from "@/lib/pdf/pdfjs";
import { applyWatermark, type WatermarkPosition } from "@/lib/pdf/watermark";
import { isPdf } from "@/lib/pdf/common";
import { downloadBlob, baseName } from "@/lib/format";
import { analytics } from "@/lib/analytics";

type Status = "idle" | "processing" | "done" | "error";
const SWATCHES = ["#F9FAFB", "#6B5CE7", "#F43F5E", "#10B981", "#F59E0B", "#3B82F6"];
const PREVIEW_W = 460;

interface Settings {
  text: string;
  size: number;
  opacity: number;
  color: string;
  position: WatermarkPosition;
}

export function WatermarkTool() {
  const t = useTranslations("ToolUI");
  const tp = useTranslations("ToolPages.watermark");
  const isMobile = useMediaQuery("(max-width: 767px)");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<{ url: string; w: number; h: number } | null>(null);
  const [w, setW] = useState<Settings>({ text: "CONFIDENTIAL", size: 56, opacity: 0.32, color: "#F43F5E", position: "diagonal" });
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<Blob | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>();

  const update = <K extends keyof Settings>(k: K, v: Settings[K]) => setW((p) => ({ ...p, [k]: v }));

  async function onFiles(files: File[]) {
    const f = files[0];
    if (!f || !isPdf(f)) {
      setErrorMsg(t("wrongTypePdf"));
      return;
    }
    setErrorMsg(undefined);
    setFile(f);
    try {
      const pdfjs = await getPdfjs();
      const doc = await pdfjs.getDocument({ data: await f.arrayBuffer() }).promise;
      const page = await doc.getPage(1);
      const base = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({ scale: 2 });
      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      const ctx = canvas.getContext("2d")!;
      await page.render({ canvasContext: ctx, viewport, canvas }).promise;
      setPreview({ url: canvas.toDataURL("image/jpeg", 0.8), w: base.width, h: base.height });
    } catch {
      setErrorMsg(t("wrongTypePdf"));
    }
  }

  async function run() {
    if (!file) return;
    setStatus("processing");
    try {
      setResult(await applyWatermark(file, { ...w, fontSize: w.size, rotation: 0 }));
      setStatus("done");
      analytics.toolUsed("add-watermark");
    } catch {
      setStatus("error");
    }
  }

  function reset() {
    setFile(null);
    setPreview(null);
    setResult(null);
    setStatus("idle");
    setErrorMsg(undefined);
  }

  if (status === "done" && result) {
    return (
      <SuccessPanel
        title={tp("successTitle")}
        meta={`${baseName(file!.name)}-watermarked.pdf`}
        onDownload={() => downloadBlob(result, `${baseName(file!.name)}-watermarked.pdf`)}
        onReset={reset}
      />
    );
  }

  if (!file || !preview) {
    return (
      <div>
        <FileDropzone toolId="watermark" accept="pdf" checkPages onFiles={onFiles} />
        {errorMsg && <div className="mt-4"><ErrorBanner message={errorMsg} onRetry={() => setErrorMsg(undefined)} /></div>}
      </div>
    );
  }

  const previewW = isMobile ? Math.min(300, Math.round(300 * (preview.w / preview.h))) : PREVIEW_W;
  const scale = previewW / preview.w;
  const previewH = preview.h * scale;
  const pxSize = w.size * scale;

  if (isMobile) {
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", flexDirection: "column", background: "var(--bg)" }}>
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "env(safe-area-inset-top) 8px 0", height: "calc(52px + env(safe-area-inset-top))", flexShrink: 0, background: "var(--card)", borderBottom: "1px solid var(--line)" }}>
          <button type="button" onClick={reset} aria-label={t("removeFile")} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 40, height: 40, borderRadius: 10, border: "1px solid var(--line)", background: "var(--bg-2)", color: "var(--text-2)" }}>
            <IconChevron size={18} style={{ transform: "rotate(180deg)" }} />
          </button>
          <div style={{ flex: 1, minWidth: 0, textAlign: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{tp("mobileTitle")}</div>
            <div className="pp-mono" style={{ fontSize: 10.5, color: "var(--text-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.name}</div>
          </div>
          <div style={{ width: 40, flexShrink: 0 }} />
        </header>

        {/* Live preview at top */}
        <div style={{ flexShrink: 0, display: "flex", justifyContent: "center", alignItems: "center", padding: "16px 16px 12px", background: "radial-gradient(70% 60% at 50% 30%, rgba(107,92,231,0.08), rgba(107,92,231,0) 70%), var(--bg-2)", borderBottom: "1px solid var(--line)" }}>
          <div style={{ position: "relative", width: previewW, height: previewH, borderRadius: 6, overflow: "hidden", boxShadow: "var(--shadow-lg)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview.url} alt="page 1" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain" }} />
            <WatermarkOverlay settings={w} pxSize={pxSize} width={previewW} height={previewH} />
          </div>
        </div>

        {/* Controls */}
        <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
          <Row label={tp("text")}>
            <input className="pp-input" style={{ minHeight: 48 }} value={w.text} onChange={(e) => update("text", e.target.value)} />
          </Row>
          <Row label={tp("fontSize")} value={`${w.size}px`}>
            <input className="pp-range" type="range" min={12} max={120} value={w.size} onChange={(e) => update("size", Number(e.target.value))} />
          </Row>
          <Row label={tp("opacity")} value={`${Math.round(w.opacity * 100)}%`}>
            <input className="pp-range" type="range" min={0.05} max={1} step={0.01} value={w.opacity} onChange={(e) => update("opacity", Number(e.target.value))} />
          </Row>
          <Row label={tp("position")}>
            <div className="grid grid-cols-3 gap-1 rounded-[10px] p-1" style={{ background: "var(--bg-2)", border: "1px solid var(--line)" }}>
              {(["center", "diagonal", "tile"] as WatermarkPosition[]).map((pos) => {
                const active = w.position === pos;
                return (
                  <button
                    key={pos}
                    type="button"
                    onClick={() => update("position", pos)}
                    className="rounded-[7px] px-2 text-[13px] font-medium"
                    style={{
                      minHeight: 44,
                      background: active ? "rgba(107,92,231,0.18)" : "transparent",
                      color: active ? "#BFB5FF" : "var(--text-2)",
                      border: active ? "1px solid rgba(107,92,231,0.3)" : "1px solid transparent",
                    }}
                  >
                    {tp(pos === "center" ? "posCenter" : pos === "tile" ? "posTile" : "posDiagonal")}
                  </button>
                );
              })}
            </div>
          </Row>
          <Row label={tp("color")}>
            <div className="flex items-center gap-3">
              {SWATCHES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => update("color", c)}
                  className="rounded-lg"
                  style={{
                    width: 36,
                    height: 36,
                    background: c,
                    boxShadow: w.color === c ? `0 0 0 2px var(--bg), 0 0 0 4px ${c}` : "inset 0 0 0 1px rgba(127,127,127,0.3)",
                  }}
                  aria-label={c}
                />
              ))}
            </div>
          </Row>
          {status === "error" && <div className="mt-1"><ErrorBanner onRetry={() => setStatus("idle")} /></div>}
        </div>

        {/* Sticky apply */}
        <div style={{ flexShrink: 0, padding: "12px 16px calc(12px + env(safe-area-inset-bottom))", background: "var(--card)", borderTop: "1px solid var(--line)" }}>
          <button type="button" className="pp-btn pp-btn-lg" style={{ width: "100%", justifyContent: "center" }} onClick={run} disabled={status === "processing"}>
            {status === "processing" ? <><Spinner /> {t("processing")}</> : <><IconWatermark size={15} sw={1.7} /> {tp("action")}</>}
          </button>
          <div className="mt-2 flex items-center justify-center gap-1.5 text-[11.5px]" style={{ color: "var(--text-3)" }}>
            <span className="pp-dot" style={{ color: "#34D399" }} /> {t("localNote")}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[380px_1fr]">
      {/* Settings */}
      <div className="pp-card self-start" style={{ padding: 26 }}>
        <h3 className="pp-mono mb-5 text-[14px] font-medium uppercase tracking-[0.04em]" style={{ color: "var(--text-3)" }}>
          {tp("preview")}
        </h3>

        <Row label={tp("text")}>
          <input className="pp-input" value={w.text} onChange={(e) => update("text", e.target.value)} />
        </Row>
        <Row label={tp("fontSize")} value={`${w.size}px`}>
          <input className="pp-range" type="range" min={12} max={120} value={w.size} onChange={(e) => update("size", Number(e.target.value))} />
        </Row>
        <Row label={tp("opacity")} value={`${Math.round(w.opacity * 100)}%`}>
          <input className="pp-range" type="range" min={0.05} max={1} step={0.01} value={w.opacity} onChange={(e) => update("opacity", Number(e.target.value))} />
        </Row>
        <Row label={tp("position")}>
          <div className="grid grid-cols-3 gap-1 rounded-[10px] p-1" style={{ background: "var(--bg-2)", border: "1px solid var(--line)" }}>
            {(["center", "diagonal", "tile"] as WatermarkPosition[]).map((pos) => {
              const active = w.position === pos;
              return (
                <button
                  key={pos}
                  type="button"
                  onClick={() => update("position", pos)}
                  className="rounded-[7px] px-2 py-2 text-[12.5px] font-medium"
                  style={{
                    background: active ? "rgba(107,92,231,0.18)" : "transparent",
                    color: active ? "#BFB5FF" : "var(--text-2)",
                    border: active ? "1px solid rgba(107,92,231,0.3)" : "1px solid transparent",
                  }}
                >
                  {tp(pos === "center" ? "posCenter" : pos === "tile" ? "posTile" : "posDiagonal")}
                </button>
              );
            })}
          </div>
        </Row>
        <Row label={tp("color")}>
          <div className="flex items-center gap-2">
            {SWATCHES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => update("color", c)}
                className="size-8 rounded-lg"
                style={{
                  background: c,
                  boxShadow: w.color === c ? `0 0 0 2px var(--bg), 0 0 0 4px ${c}` : "inset 0 0 0 1px rgba(127,127,127,0.3)",
                }}
                aria-label={c}
              />
            ))}
          </div>
        </Row>

        <hr className="pp-hr" style={{ margin: "8px 0 22px" }} />

        <button type="button" className="pp-btn pp-btn-lg w-full justify-center" onClick={run} disabled={status === "processing"}>
          {status === "processing" ? <><Spinner /> {t("processing")}</> : <><IconWatermark size={15} sw={1.7} /> {tp("action")}</>}
        </button>
        <div className="mt-3 flex items-center justify-center gap-1.5 text-[11.5px]" style={{ color: "var(--text-3)" }}>
          <span className="pp-dot" style={{ color: "#34D399" }} /> {t("localNote")}
        </div>
        {status === "error" && <div className="mt-3"><ErrorBanner onRetry={() => setStatus("idle")} /></div>}
      </div>

      {/* Live preview — the real first page rendered via pdfjs */}
      <div
        className="flex flex-col items-center rounded-2xl p-6 sm:p-9"
        style={{
          background: "radial-gradient(70% 60% at 50% 30%, rgba(107,92,231,0.08), rgba(107,92,231,0) 70%), var(--bg-2)",
          border: "1px solid var(--line)",
        }}
      >
        <div className="mb-4 flex w-full items-center justify-between text-[12px]" style={{ color: "var(--text-3)" }}>
          <span className="pp-mono inline-flex items-center gap-2 uppercase tracking-[0.1em]">
            {tp("preview")}
            <span className="size-1.5 rounded-full" style={{ background: "#34D399", boxShadow: "0 0 8px #34D399", animation: "pppulse 1.6s ease-in-out infinite" }} />
          </span>
          <span className="pp-mono truncate">{file.name}</span>
        </div>

        <div
          className="relative overflow-hidden rounded-md"
          style={{ width: PREVIEW_W, maxWidth: "100%", height: previewH, boxShadow: "var(--shadow-lg)" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview.url} alt="page 1" className="absolute inset-0 size-full object-contain" />
          <WatermarkOverlay settings={w} pxSize={pxSize} width={PREVIEW_W} height={previewH} />
        </div>
      </div>
    </div>
  );
}

function WatermarkOverlay({ settings, pxSize, width, height }: { settings: Settings; pxSize: number; width: number; height: number }) {
  const base: React.CSSProperties = {
    position: "absolute",
    color: settings.color,
    opacity: settings.opacity,
    fontFamily: "var(--font-display)",
    fontWeight: 600,
    fontSize: pxSize,
    whiteSpace: "nowrap",
    pointerEvents: "none",
    letterSpacing: "-0.01em",
  };

  if (settings.position === "tile") {
    const stepX = Math.max(pxSize * settings.text.length * 0.6 + 40, 140);
    const stepY = Math.max(pxSize * 3, 80);
    const items: React.ReactElement[] = [];
    let key = 0;
    for (let y = 0; y < height + stepY; y += stepY) {
      for (let x = -stepX; x < width + stepX; x += stepX) {
        items.push(
          <span key={key++} style={{ ...base, left: x, top: y, transform: "rotate(-45deg)", transformOrigin: "left top" }}>
            {settings.text}
          </span>,
        );
      }
    }
    return <>{items}</>;
  }

  const transform =
    settings.position === "diagonal"
      ? "translate(-50%, -50%) rotate(-45deg)"
      : "translate(-50%, -50%)";
  return <span style={{ ...base, top: "50%", left: "50%", transform }}>{settings.text}</span>;
}

function Row({ label, value, children }: { label: string; value?: string; children: React.ReactNode }) {
  return (
    <div className="mb-[22px]">
      <div className="mb-2.5 flex items-center justify-between">
        <label className="text-[13px] font-medium" style={{ color: "var(--text)" }}>{label}</label>
        {value !== undefined && (
          <span className="pp-mono rounded-md px-2 py-0.5 text-[11.5px]" style={{ color: "var(--text-2)", background: "var(--bg-2)", border: "1px solid var(--line)" }}>
            {value}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}
