"use client";

import { useCallback, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { FileDropzone } from "./FileDropzone";
import { FileInfoBar } from "./FileInfoBar";
import { SuccessPanel, ErrorBanner } from "./ResultPanels";
import { Spinner } from "./Spinner";
import { LazyThumb } from "./LazyThumb";
import { ProgressPanel } from "./ProgressPanel";
import { IconArrow, IconRotate, IconCheck } from "@/components/shared/icons";
import { createThumbLoader, type ThumbLoader } from "@/lib/pdf/thumbnailLoader";
import { runPdfOp } from "@/lib/workers/pdfOpsClient";
import { isPdf } from "@/lib/pdf/common";
import { downloadBlob, baseName } from "@/lib/format";
import { analytics } from "@/lib/analytics";

type Status = "idle" | "loading" | "ready" | "processing" | "done" | "error";

export function RotateTool() {
  const t = useTranslations("ToolUI");
  const tp = useTranslations("ToolPages.rotate");
  const [file, setFile] = useState<File | null>(null);
  const loaderRef = useRef<ThumbLoader | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [rotations, setRotations] = useState<Record<number, number>>({});
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<Blob | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>();
  const [progress, setProgress] = useState({ page: 0, total: 0 });

  const loadPage = useCallback((i: number) => loaderRef.current!.renderPage(i, 0.4), []);

  async function onFiles(files: File[]) {
    const f = files[0];
    if (!f || !isPdf(f)) {
      setErrorMsg(t("wrongTypePdf"));
      return;
    }
    setErrorMsg(undefined);
    setFile(f);
    setStatus("loading");
    loaderRef.current?.destroy();
    const loader = createThumbLoader(f);
    loaderRef.current = loader;
    try {
      setPageCount(await loader.pageCount());
      setRotations({});
      setSelected(new Set());
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }

  function toggleSelect(i: number, multi: boolean) {
    setSelected((prev) => {
      if (multi) {
        const next = new Set(prev);
        if (next.has(i)) next.delete(i);
        else next.add(i);
        return next;
      }
      // plain click: select only this page; clicking the sole selection clears it (= all pages)
      if (prev.has(i) && prev.size === 1) return new Set();
      return new Set([i]);
    });
  }

  function applyDelta(delta: number) {
    const targets = selected.size > 0 ? [...selected] : Array.from({ length: pageCount }, (_, i) => i);
    setRotations((prev) => {
      const next = { ...prev };
      for (const i of targets) next[i] = (((next[i] ?? 0) + delta) % 360 + 360) % 360;
      return next;
    });
  }

  async function run() {
    if (!file) return;
    setStatus("processing");
    setProgress({ page: 0, total: 0 });
    try {
      setResult(await runPdfOp("rotate", file, { rotations }, (page, t2) => setProgress({ page, total: t2 })));
      setStatus("done");
      analytics.toolUsed("rotate-pdf");
    } catch {
      setStatus("error");
    }
  }

  function reset() {
    loaderRef.current?.destroy();
    loaderRef.current = null;
    setFile(null);
    setPageCount(0);
    setRotations({});
    setSelected(new Set());
    setResult(null);
    setStatus("idle");
    setErrorMsg(undefined);
  }

  if (status === "done" && result) {
    return (
      <SuccessPanel
        title={tp("successTitle")}
        meta={`${baseName(file!.name)}-rotated.pdf`}
        onDownload={() => downloadBlob(result, `${baseName(file!.name)}-rotated.pdf`)}
        onReset={reset}
      />
    );
  }

  if (!file) {
    return (
      <div>
        <FileDropzone toolId="rotate" accept="pdf" checkPages onFiles={onFiles} />
        {errorMsg && <div className="mt-4"><ErrorBanner message={errorMsg} onRetry={() => setErrorMsg(undefined)} /></div>}
      </div>
    );
  }

  const hasRotation = Object.values(rotations).some((r) => r % 360 !== 0);

  return (
    <div className="flex flex-col gap-5">
      <FileInfoBar file={file} pages={pageCount || undefined} onRemove={reset} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <button type="button" className="pp-btn pp-btn-ghost" style={{ padding: "8px 14px" }} onClick={() => applyDelta(270)}>{tp("rotateLeft")}</button>
          <button type="button" className="pp-btn pp-btn-ghost" style={{ padding: "8px 14px" }} onClick={() => applyDelta(90)}>{tp("rotateRight")}</button>
          <button type="button" className="pp-btn pp-btn-ghost" style={{ padding: "8px 14px" }} onClick={() => applyDelta(180)}>{tp("flip")}</button>
        </div>
        <span className="text-[12.5px]" style={{ color: "var(--text-3)" }}>{tp("selectHint")}</span>
      </div>

      {status === "loading" ? (
        <div className="flex items-center justify-center gap-2 py-16" style={{ color: "var(--text-3)" }}>
          <Spinner size={18} /> {t("processing")}
        </div>
      ) : (
        <div
          className="grid max-h-[60vh] gap-3 overflow-auto rounded-xl p-4"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", background: "var(--bg-2)", border: "1px solid var(--line)" }}
        >
          {Array.from({ length: pageCount }, (_, i) => {
            const isSel = selected.has(i);
            const rot = rotations[i] ?? 0;
            return (
              <button
                key={i}
                type="button"
                onClick={(e) => toggleSelect(i, e.ctrlKey || e.metaKey)}
                className="group relative flex flex-col items-center gap-1.5 rounded-lg p-2 transition-colors"
                style={{ border: `1px solid ${isSel ? "var(--indigo)" : "var(--line)"}`, background: isSel ? "var(--indigo-dim)" : "var(--card)" }}
              >
                {isSel && (
                  <span className="absolute right-1.5 top-1.5 z-10 flex size-4 items-center justify-center rounded-full" style={{ background: "var(--indigo)", color: "#fff" }}>
                    <IconCheck size={10} sw={3} />
                  </span>
                )}
                <LazyThumb
                  index={i}
                  load={loadPage}
                  alt={`page ${i + 1}`}
                  className="flex w-full justify-center"
                  imgStyle={{ maxHeight: 150, width: "auto", borderRadius: 4, transform: `rotate(${rot}deg)`, transition: "transform 0.2s" }}
                />
                <span className="pp-mono text-[11px]" style={{ color: "var(--text-3)" }}>{i + 1}</span>
              </button>
            );
          })}
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 text-[12.5px]" style={{ color: "var(--text-3)" }}>
          <IconRotate size={14} /> {selected.size > 0 ? `${selected.size}` : (tp("scopeAll"))}
        </div>
        <button type="button" className="pp-btn pp-btn-lg min-w-[160px] justify-center" onClick={run} disabled={status === "processing" || !hasRotation}>
          {status === "processing" ? <><Spinner /> {t("processing")}</> : <>{tp("action")} <IconArrow size={15} /></>}
        </button>
      </div>

      {status === "processing" && <ProgressPanel page={progress.page} total={progress.total} />}

      {status === "error" && <ErrorBanner onRetry={() => setStatus("ready")} />}
    </div>
  );
}
