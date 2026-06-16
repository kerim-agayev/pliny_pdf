"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { FileDropzone } from "./FileDropzone";
import { FileInfoBar } from "./FileInfoBar";
import { ErrorBanner } from "./ResultPanels";
import { Spinner } from "./Spinner";
import { IconNup, IconDownload, IconArrow } from "@/components/shared/icons";
import { nupLayout, NUP_GRID, nupPerSheet, type NupLayoutId } from "@/lib/pdf/nupLayout";
import { isPdf, readPageCount } from "@/lib/pdf/common";
import { downloadBlob } from "@/lib/format";
import { nupMaxOutputPages } from "@/lib/limits";
import { useSession } from "@/lib/auth/client";
import { analytics } from "@/lib/analytics";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";

type Status = "loaded" | "processing" | "done" | "error";
type Paper = "a4" | "letter" | "legal";
type Orient = "portrait" | "landscape";

const LAYOUTS: { id: NupLayoutId; labelKey: string; subKey: string }[] = [
  { id: "2h", labelKey: "l2hLabel", subKey: "l2hSub" },
  { id: "2v", labelKey: "l2vLabel", subKey: "l2vSub" },
  { id: "4", labelKey: "l4Label", subKey: "l4Sub" },
  { id: "6", labelKey: "l6Label", subKey: "l6Sub" },
  { id: "9", labelKey: "l9Label", subKey: "l9Sub" },
];

export function NupLayoutTool() {
  const t = useTranslations("ToolUI");
  const tp = useTranslations("ToolPages.nupLayout");
  const { data: session } = useSession();
  const plan = (session?.user as { plan?: "free" | "pro" })?.plan ?? null;
  const maxOutput = nupMaxOutputPages(plan);

  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState(0);
  const [layout, setLayout] = useState<NupLayoutId>("4");
  const [paper, setPaper] = useState<Paper>("a4");
  const [orient, setOrient] = useState<Orient>("portrait");
  const [margin, setMargin] = useState(8);
  const [status, setStatus] = useState<Status>("loaded");
  const [result, setResult] = useState<{ blob: Blob; filename: string; outputPages: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>();

  const per = nupPerSheet(layout);
  const sheets = pages ? Math.ceil(pages / per) : 0;
  const overLimit = sheets > maxOutput;

  async function onFiles(files: File[]) {
    const f = files[0];
    if (!f || !isPdf(f)) {
      setErrorMsg(t("wrongTypePdf"));
      return;
    }
    setErrorMsg(undefined);
    setFile(f);
    setStatus("loaded");
    setResult(null);
    setPages(await readPageCount(f).catch(() => 0));
  }

  /** Any option change after a run invalidates the result — back to "loaded". */
  function dirty<T>(setter: (v: T) => void) {
    return (v: T) => {
      setter(v);
      if (status === "done" || status === "error") {
        setStatus("loaded");
        setResult(null);
      }
    };
  }

  async function run() {
    if (!file || overLimit) return;
    setStatus("processing");
    try {
      const out = await nupLayout(file, { layout, paper, orientation: orient, marginMm: margin });
      setResult({ blob: out.blob, filename: out.filename, outputPages: out.outputPages });
      setStatus("done");
      analytics.toolUsed("n-up-layout");
    } catch {
      setStatus("error");
    }
  }

  function reset() {
    setFile(null);
    setPages(0);
    setResult(null);
    setStatus("loaded");
    setErrorMsg(undefined);
  }

  if (!file) {
    return (
      <div>
        <FileDropzone toolId="nupLayout" accept="pdf" onFiles={onFiles} title={tp("dropTitle")} />
        {errorMsg && (
          <div className="mt-4">
            <ErrorBanner message={errorMsg} onRetry={() => setErrorMsg(undefined)} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <FileInfoBar file={file} pages={pages || undefined} onRemove={reset} />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[360px_1fr]">
        {/* Controls */}
        <div className="pp-card self-start" style={{ padding: 26 }}>
          <h3 className="pp-mono mb-5 text-[13px] font-medium uppercase tracking-[0.04em]" style={{ color: "var(--text-3)" }}>
            {tp("layoutTitle")}
          </h3>

          {/* Layout grid */}
          <div className="mb-6 grid grid-cols-3 gap-2">
            {LAYOUTS.map((l) => {
              const active = layout === l.id;
              const g = NUP_GRID[l.id];
              return (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => dirty(setLayout)(l.id)}
                  className="flex flex-col items-center gap-[7px] rounded-[10px] px-1.5 py-3 transition-colors"
                  style={{
                    background: active ? "rgba(107,92,231,0.1)" : "var(--bg-2)",
                    border: active ? "1px solid var(--indigo)" : "1px solid var(--line)",
                  }}
                >
                  <NupGlyph cols={g.cols} rows={g.rows} active={active} />
                  <div className="text-center">
                    <div className="text-[12.5px] font-semibold" style={{ color: active ? "var(--text)" : "var(--text-2)" }}>
                      {tp(l.labelKey)}
                    </div>
                    <div className="pp-mono text-[9px]" style={{ color: "var(--text-3)" }}>{tp(l.subKey)}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Margin */}
          <div className="mb-[22px]">
            <div className="mb-2 flex items-center justify-between">
              <label className="text-[13px] font-medium" style={{ color: "var(--text)" }}>{tp("marginLabel")}</label>
              <span className="pp-mono text-[11.5px]" style={{ color: "var(--text-2)" }}>{margin} mm</span>
            </div>
            <input type="range" min={0} max={20} value={margin} onChange={(e) => dirty(setMargin)(+e.target.value)} className="w-full" />
          </div>

          {/* Paper size */}
          <div className="mb-[22px]">
            <label className="mb-2 block text-[13px] font-medium" style={{ color: "var(--text)" }}>{tp("paperLabel")}</label>
            <Segmented<Paper>
              value={paper}
              onChange={dirty(setPaper)}
              options={[
                { value: "a4", label: "A4" },
                { value: "letter", label: "Letter" },
                { value: "legal", label: "Legal" },
              ]}
            />
          </div>

          {/* Orientation */}
          <div className="mb-6">
            <label className="mb-2 block text-[13px] font-medium" style={{ color: "var(--text)" }}>{tp("orientationLabel")}</label>
            <Segmented<Orient>
              value={orient}
              onChange={dirty(setOrient)}
              options={[
                { value: "portrait", label: tp("portrait") },
                { value: "landscape", label: tp("landscape") },
              ]}
            />
          </div>

          {overLimit && (
            <div className="mb-3">
              <ErrorBanner message={tp("limitError", { sheets, limit: maxOutput })} onRetry={() => dirty(setLayout)("9")} />
            </div>
          )}

          {status === "done" && result ? (
            <button
              type="button"
              className="pp-btn pp-btn-lg w-full justify-center"
              onClick={() => downloadBlob(result.blob, result.filename)}
              style={{ background: "var(--emerald)", boxShadow: "0 8px 20px -10px rgba(16,185,129,0.6)" }}
            >
              <IconDownload size={15} /> {tp("download")}
            </button>
          ) : (
            <button
              type="button"
              className="pp-btn pp-btn-lg w-full justify-center"
              onClick={run}
              disabled={status === "processing" || overLimit}
            >
              {status === "processing" ? (
                <><Spinner /> {tp("generating")}</>
              ) : (
                <><IconNup size={15} sw={1.7} /> {tp("generateSheets", { sheets })}</>
              )}
            </button>
          )}
          <div className="mt-3 flex items-center justify-center gap-1.5 text-[11.5px]" style={{ color: "var(--text-3)" }}>
            <span className="pp-dot" style={{ color: "#34D399" }} /> {t("localNote")}
          </div>
        </div>

        {/* Live preview */}
        <div
          className="flex min-h-[460px] flex-col items-center justify-center gap-7 rounded-2xl p-8"
          style={{ background: "var(--bg-2)", border: "1px solid var(--line)" }}
        >
          {status === "error" ? (
            <ErrorBanner message={tp("errorTitle")} onRetry={() => setStatus("loaded")} />
          ) : (
            <>
              <NupSheet layout={layout} orientation={orient} margin={margin} />
              <div className="flex flex-wrap items-center justify-center gap-3 text-[12.5px]" style={{ color: "var(--text-3)" }}>
                <span>
                  <span className="pp-mono" style={{ color: "var(--text-2)" }}>{pages || "—"}</span> {tp("pagesWord")}
                </span>
                <IconArrow size={13} />
                <span>
                  <span className="pp-mono" style={{ color: "#BFB5FF" }}>{per}</span>-up
                </span>
                <IconArrow size={13} />
                <span>
                  <span className="pp-mono" style={{ color: "var(--text-2)" }}>{sheets || "—"}</span> {tp("sheetsWord")} ·{" "}
                  {paper.toUpperCase()} {orient === "portrait" ? tp("portrait") : tp("landscape")}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/** Small grid glyph for a layout choice (ported from the design). */
function NupGlyph({ cols, rows, active }: { cols: number; rows: number; active: boolean }) {
  const stroke = active ? "#BFB5FF" : "var(--text-3)";
  const gap = 1.5, pad = 1.5, W = 24, H = 24;
  const cw = (W - pad * 2 - gap * (cols - 1)) / cols;
  const ch = (H - pad * 2 - gap * (rows - 1)) / rows;
  const cells = [];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      cells.push(
        <rect
          key={`${r}-${c}`}
          x={pad + c * (cw + gap)}
          y={pad + r * (ch + gap)}
          width={cw}
          height={ch}
          rx="0.6"
          fill={active ? "rgba(191,181,255,0.18)" : "transparent"}
          stroke={stroke}
          strokeWidth="1"
        />,
      );
  return <svg width="24" height="24" viewBox="0 0 24 24">{cells}</svg>;
}

/** Schematic preview of the imposed sheet — numbered placeholder tiles in a grid. */
function NupSheet({ layout, orientation, margin }: { layout: NupLayoutId; orientation: Orient; margin: number }) {
  const { cols, rows } = NUP_GRID[layout];
  const n = cols * rows;
  const portrait = orientation === "portrait";
  const isMobile = useMediaQuery("(max-width: 767px)");
  const longSide = isMobile ? 300 : 380; // 380 preserved on desktop → pixel-identical
  const shortSide = Math.round(longSide * 0.707);
  const sheetW = portrait ? shortSide : longSide;
  const sheetH = portrait ? longSide : shortSide;
  const pad = margin * 0.9 + 6;

  return (
    <div
      style={{
        width: sheetW,
        height: sheetH,
        background: "white",
        borderRadius: 4,
        boxShadow: "0 30px 70px -22px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.06)",
        padding: pad,
        flexShrink: 0,
      }}
    >
      <div
        style={{
          height: "100%",
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gridTemplateRows: `repeat(${rows}, 1fr)`,
          gap: Math.max(4, margin * 0.8),
        }}
      >
        {Array.from({ length: n }, (_, i) => (
          <NupTile key={i} n={i + 1} />
        ))}
      </div>
    </div>
  );
}

function NupTile({ n }: { n: number }) {
  return (
    <div
      style={{
        position: "relative",
        background: "#FAFAF9",
        borderRadius: 2,
        boxShadow: "0 1px 4px rgba(0,0,0,0.25)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        padding: "9% 10%",
        gap: "5%",
      }}
    >
      <div style={{ height: 3, width: "52%", background: "#A78BFA", opacity: 0.65, borderRadius: 1 }} />
      {[0.95, 0.8, 0.9, 0.6, 0.85].map((w, i) => (
        <div key={i} style={{ height: 1.5, width: `${w * 100}%`, background: "#C9C6C0", borderRadius: 1 }} />
      ))}
      <span className="pp-mono" style={{ position: "absolute", bottom: 3, right: 5, fontSize: 8, color: "#9CA3AF" }}>{n}</span>
    </div>
  );
}

function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div
      className="grid gap-1 rounded-[10px] p-1"
      style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)`, background: "var(--bg-2)", border: "1px solid var(--line)" }}
    >
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className="rounded-[7px] px-2 py-2 text-[12.5px] font-medium transition-colors"
            style={{
              background: active ? "rgba(107,92,231,0.18)" : "transparent",
              color: active ? "#BFB5FF" : "var(--text-2)",
              border: active ? "1px solid rgba(107,92,231,0.3)" : "1px solid transparent",
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
