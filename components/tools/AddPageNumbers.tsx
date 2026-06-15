"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { FileDropzone } from "./FileDropzone";
import { FileInfoBar } from "./FileInfoBar";
import { SuccessPanel, ErrorBanner } from "./ResultPanels";
import { Spinner } from "./Spinner";
import { ProgressPanel } from "./ProgressPanel";
import { ScaledPreview } from "./ScaledPreview";
import { IconCheck, IconChevron } from "@/components/shared/icons";
import {
  formatPageNumber,
  type PageNumPosition,
  type PageNumFormat,
  type PageNumberOptions,
} from "@/lib/pdf/addPageNumbers";
import { createThumbLoader, type Thumb, type ThumbLoader } from "@/lib/pdf/thumbnailLoader";
import { runPdfOp } from "@/lib/workers/pdfOpsClient";
import { isPdf } from "@/lib/pdf/common";
import { downloadBlob, baseName, MAX_FILE_BYTES } from "@/lib/format";
import { analytics } from "@/lib/analytics";

type Status = "idle" | "loading" | "ready" | "processing" | "done" | "error";

const PREVIEW_SCALE = 0.7;
const SWATCHES = ["#0F0F0F", "#6B7280", "#6B5CE7", "#F43F5E", "#3B82F6", "#FFFFFF"];
const FORMATS: { id: PageNumFormat; label: string }[] = [
  { id: "plain", label: "1, 2, 3" },
  { id: "of", label: "Page 1 of 24" },
  { id: "short", label: "1 of 24" },
  { id: "roman", label: "i, ii, iii" },
  { id: "alpha", label: "A, B, C" },
];
const POSITIONS: PageNumPosition[] = ["TL", "TC", "TR", "ML", "MC", "MR", "BL", "BC", "BR"];

export function AddPageNumbers() {
  const t = useTranslations("ToolUI");
  const tp = useTranslations("ToolPages.addPageNumbers");
  const [file, setFile] = useState<File | null>(null);
  const loaderRef = useRef<ThumbLoader | null>(null);
  const [total, setTotal] = useState(0);
  const [thumb, setThumb] = useState<Thumb | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<Blob | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>();
  const [fmtOpen, setFmtOpen] = useState(false);
  const [previewPage, setPreviewPage] = useState(1);
  const [progress, setProgress] = useState({ page: 0, total: 0 });

  const [opts, setOpts] = useState<PageNumberOptions>({
    position: "BC",
    format: "of",
    startPage: 1,
    startNum: 1,
    skipFirst: false,
    size: 11,
    color: "#0F0F0F",
    margin: 28,
  });
  const set = <K extends keyof PageNumberOptions>(k: K, v: PageNumberOptions[K]) =>
    setOpts((p) => ({ ...p, [k]: v }));

  const previewLabel = useMemo(() => {
    if (opts.skipFirst && previewPage === 1) return null;
    if (previewPage < opts.startPage) return null;
    const num = opts.startNum + (previewPage - opts.startPage);
    return formatPageNumber(opts.format, num, total);
  }, [opts, previewPage, total]);

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
      setTotal(await loader.pageCount());
      setPreviewPage(1);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }

  async function run() {
    if (!file) return;
    setStatus("processing");
    setProgress({ page: 0, total: 0 });
    try {
      setResult(await runPdfOp("pageNumbers", file, { opts }, (page, t2) => setProgress({ page, total: t2 })));
      setStatus("done");
      analytics.toolUsed("add-page-numbers");
    } catch {
      setStatus("error");
    }
  }

  function reset() {
    loaderRef.current?.destroy();
    loaderRef.current = null;
    setFile(null);
    setTotal(0);
    setThumb(null);
    setResult(null);
    setStatus("idle");
    setErrorMsg(undefined);
    setPreviewPage(1);
  }

  if (status === "done" && result) {
    return (
      <SuccessPanel
        title={tp("successTitle")}
        meta={`${baseName(file!.name)}-numbered.pdf`}
        onDownload={() => downloadBlob(result, `${baseName(file!.name)}-numbered.pdf`)}
        onReset={reset}
      />
    );
  }

  if (!file) {
    return (
      <div>
        <FileDropzone toolId="add-page-numbers" accept="pdf" checkPages onFiles={onFiles} title={tp("emptyTitle")} />
        {errorMsg && (
          <div className="mt-4">
            <ErrorBanner message={errorMsg} onRetry={() => setErrorMsg(undefined)} />
          </div>
        )}
      </div>
    );
  }

  const vert = opts.position[0];
  const horiz = opts.position[1];

  const numStyle: React.CSSProperties = {
    position: "absolute",
    color: opts.color,
    fontFamily: "var(--font-mono)",
    fontSize: opts.size * PREVIEW_SCALE,
    fontWeight: 500,
    textShadow: opts.color === "#FFFFFF" ? "0 1px 2px rgba(0,0,0,0.4)" : "none",
    ...(vert === "T"
      ? { top: opts.margin * PREVIEW_SCALE }
      : vert === "B"
        ? { bottom: opts.margin * PREVIEW_SCALE }
        : { top: "50%" }),
    ...(horiz === "L"
      ? { left: opts.margin * PREVIEW_SCALE }
      : horiz === "R"
        ? { right: opts.margin * PREVIEW_SCALE }
        : { left: "50%" }),
    transform: `${horiz === "C" ? "translateX(-50%)" : ""} ${vert === "M" ? "translateY(-50%)" : ""}`.trim() || undefined,
  };

  const curFmt = FORMATS.find((f) => f.id === opts.format);

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[380px_1fr]">
      {/* Settings */}
      <div className="flex flex-col gap-5">
        <FileInfoBar file={file} pages={total || undefined} onRemove={reset} />

        <div className="pp-card" style={{ padding: 24 }}>
          <h3 className="pp-mono mb-5 text-[13px] font-medium uppercase tracking-[0.04em]" style={{ color: "var(--text-3)" }}>
            {tp("panelTitle")}
          </h3>

          {/* Position */}
          <div className="mb-5">
            <div className="mb-2 text-[13px] font-medium">{tp("position")}</div>
            <div className="flex items-center gap-4">
              <div className="grid shrink-0 grid-cols-3 gap-1.5" style={{ width: 120, aspectRatio: "1 / 1.3" }}>
                {POSITIONS.map((id) => {
                  const active = opts.position === id;
                  const v = id[0];
                  const h = id[1];
                  return (
                    <button
                      key={id}
                      type="button"
                      title={id}
                      onClick={() => set("position", id)}
                      className="flex rounded-md p-1.5 transition-colors"
                      style={{
                        background: active ? "rgba(107,92,231,0.18)" : "var(--bg-2)",
                        border: active ? "1px solid var(--indigo)" : "1px solid var(--line)",
                        alignItems: v === "T" ? "flex-start" : v === "B" ? "flex-end" : "center",
                        justifyContent: h === "L" ? "flex-start" : h === "R" ? "flex-end" : "center",
                      }}
                    >
                      <span
                        className="size-1.5 rounded-full"
                        style={{ background: active ? "#BFB5FF" : "var(--text-3)", boxShadow: active ? "0 0 6px #BFB5FF" : "none" }}
                      />
                    </button>
                  );
                })}
              </div>
              <div className="text-[12.5px] leading-relaxed" style={{ color: "var(--text-2)" }}>
                {tp("positionHint")} <span className="pp-mono" style={{ color: "#BFB5FF" }}>{opts.position}</span>
              </div>
            </div>
          </div>

          {/* Format */}
          <div className="mb-5">
            <div className="mb-2 text-[13px] font-medium">{tp("format")}</div>
            <div className="relative">
              <button
                type="button"
                className="pp-input flex items-center justify-between text-left"
                onClick={() => setFmtOpen((o) => !o)}
              >
                <span>{curFmt?.label}</span>
                <IconChevron size={14} color="var(--text-3)" style={{ transform: fmtOpen ? "rotate(90deg)" : "none" }} />
              </button>
              {fmtOpen && (
                <div
                  className="absolute left-0 right-0 z-30 mt-1 rounded-[10px] p-1"
                  style={{ top: "100%", background: "var(--card-hi)", border: "1px solid var(--line-2)", boxShadow: "var(--shadow-md)" }}
                >
                  {FORMATS.map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => { set("format", o.id); setFmtOpen(false); }}
                      className="flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left text-[13.5px]"
                      style={{ background: o.id === opts.format ? "rgba(107,92,231,0.14)" : "transparent", color: o.id === opts.format ? "#BFB5FF" : "var(--text)" }}
                    >
                      {o.label}
                      {o.id === opts.format && <IconCheck size={13} />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Start page / first number */}
          <div className="mb-5 grid grid-cols-2 gap-3.5">
            <div>
              <div className="mb-2 text-[13px] font-medium">{tp("startPage")}</div>
              <input
                className="pp-input"
                type="number"
                min={1}
                value={opts.startPage}
                onChange={(e) => set("startPage", Math.max(1, +e.target.value || 1))}
              />
            </div>
            <div>
              <div className="mb-2 text-[13px] font-medium">{tp("firstNumber")}</div>
              <input
                className="pp-input"
                type="number"
                min={1}
                value={opts.startNum}
                onChange={(e) => set("startNum", Math.max(1, +e.target.value || 1))}
              />
            </div>
          </div>

          {/* Skip first */}
          <div className="mb-5 flex items-center justify-between border-y py-3" style={{ borderColor: "var(--line)" }}>
            <div>
              <div className="text-[13.5px] font-medium">{tp("skipFirst")}</div>
              <div className="text-[12px]" style={{ color: "var(--text-3)" }}>{tp("skipFirstHint")}</div>
            </div>
            <button
              type="button"
              onClick={() => set("skipFirst", !opts.skipFirst)}
              className="flex p-[3px]"
              style={{ width: 40, height: 24, borderRadius: 999, background: opts.skipFirst ? "var(--indigo)" : "var(--line-2)", justifyContent: opts.skipFirst ? "flex-end" : "flex-start", transition: "background 0.18s" }}
              aria-pressed={opts.skipFirst}
            >
              <span className="size-[18px] rounded-full bg-white" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }} />
            </button>
          </div>

          {/* Font size */}
          <div className="mb-5">
            <div className="mb-2 flex justify-between text-[13px] font-medium">
              <span>{tp("fontSize")}</span>
              <span className="pp-mono" style={{ color: "var(--text-2)" }}>{opts.size}pt</span>
            </div>
            <input type="range" min={8} max={24} value={opts.size} onChange={(e) => set("size", +e.target.value)} className="w-full" />
          </div>

          {/* Color */}
          <div className="mb-5">
            <div className="mb-2 text-[13px] font-medium">{tp("color")}</div>
            <div className="flex items-center gap-2">
              {SWATCHES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => set("color", c)}
                  className="size-[30px] rounded-lg"
                  style={{
                    background: c,
                    border: c === "#FFFFFF" ? "1px solid var(--line-2)" : "0",
                    boxShadow: opts.color === c ? `0 0 0 2px var(--card), 0 0 0 4px ${c === "#FFFFFF" ? "var(--indigo)" : c}` : "inset 0 0 0 1px rgba(255,255,255,0.08)",
                  }}
                  aria-label={c}
                />
              ))}
            </div>
          </div>

          {/* Margin */}
          <div className="mb-6">
            <div className="mb-2 flex justify-between text-[13px] font-medium">
              <span>{tp("margin")}</span>
              <span className="pp-mono" style={{ color: "var(--text-2)" }}>{opts.margin}pt</span>
            </div>
            <input type="range" min={10} max={50} value={opts.margin} onChange={(e) => set("margin", +e.target.value)} className="w-full" />
          </div>

          <button
            type="button"
            className="pp-btn pp-btn-lg w-full justify-center"
            onClick={run}
            disabled={status === "processing"}
          >
            {status === "processing" ? <><Spinner /> {t("processing")}</> : <><IconCheck size={15} sw={2} /> {tp("action", { count: total })}</>}
          </button>
          {status === "processing" && <ProgressPanel page={progress.page} total={progress.total} />}
        </div>
      </div>

      {/* Live preview */}
      <div
        className="relative flex flex-col items-center rounded-2xl p-9"
        style={{ background: "radial-gradient(70% 60% at 50% 30%, rgba(107,92,231,0.08), rgba(107,92,231,0) 70%), var(--bg-2)", border: "1px solid var(--line)", minHeight: 520 }}
      >
        <div className="absolute left-5 top-4 flex items-center gap-2">
          <span className="pp-mono text-[10.5px] uppercase tracking-[0.1em]" style={{ color: "var(--text-3)" }}>{tp("livePreview")}</span>
          <span className="size-1.5 rounded-full" style={{ background: "#34D399", boxShadow: "0 0 8px #34D399" }} />
        </div>

        {status === "loading" || !thumb ? (
          <div className="flex flex-1 items-center justify-center gap-2" style={{ color: "var(--text-3)" }}>
            <Spinner size={18} /> {t("processing")}
          </div>
        ) : (
          <>
            <ScaledPreview width={thumb.w} height={thumb.h} className="mt-8">
              <div className="relative" style={{ width: thumb.w, height: thumb.h }}>
              <img src={thumb.url} alt={`page ${previewPage}`} className="rounded shadow-lg" style={{ width: thumb.w, height: thumb.h }} draggable={false} />
              {previewLabel !== null ? (
                <div style={numStyle}>
                  {previewLabel}
                  <span className="pointer-events-none absolute rounded-[4px]" style={{ inset: -6, border: "1px dashed rgba(107,92,231,0.6)" }} />
                </div>
              ) : (
                <div
                  className="pp-mono absolute italic"
                  style={{ bottom: opts.margin * PREVIEW_SCALE, left: "50%", transform: "translateX(-50%)", fontSize: 10, color: "#C7C2BB" }}
                >
                  {tp("firstPageSkipped")}
                </div>
              )}
              </div>
            </ScaledPreview>

            <div className="mt-6 flex items-center gap-3.5">
              <button
                type="button"
                onClick={() => setPreviewPage((p) => Math.max(1, p - 1))}
                className="flex rounded-lg p-2"
                style={{ background: "var(--card)", border: "1px solid var(--line)", color: "var(--text-2)" }}
                aria-label="previous page"
              >
                <IconChevron size={14} style={{ transform: "rotate(180deg)" }} />
              </button>
              <span className="pp-mono text-[13px]">
                {tp("pageLabel", { n: previewPage })} <span style={{ color: "var(--text-3)" }}>/ {total}</span>
              </span>
              <button
                type="button"
                onClick={() => setPreviewPage((p) => Math.min(total, p + 1))}
                className="flex rounded-lg p-2"
                style={{ background: "var(--card)", border: "1px solid var(--line)", color: "var(--text-2)" }}
                aria-label="next page"
              >
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
