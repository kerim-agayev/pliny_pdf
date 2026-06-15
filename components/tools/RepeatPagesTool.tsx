"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { FileDropzone } from "./FileDropzone";
import { FileInfoBar } from "./FileInfoBar";
import { ErrorBanner } from "./ResultPanels";
import { Spinner } from "./Spinner";
import { IconCopy, IconDownload } from "@/components/shared/icons";
import { repeatPages, parsePageRanges, type Arrangement } from "@/lib/pdf/repeatPages";
import { isPdf, readPageCount } from "@/lib/pdf/common";
import { downloadBlob } from "@/lib/format";
import { repeatMaxOutputPages } from "@/lib/limits";
import { useSession } from "@/lib/auth/client";
import { analytics } from "@/lib/analytics";

type Status = "loaded" | "processing" | "done" | "error";
type Source = "all" | "single" | "range";

export function RepeatPagesTool() {
  const t = useTranslations("ToolUI");
  const tp = useTranslations("ToolPages.repeatPages");
  const { data: session } = useSession();
  const plan = (session?.user as { plan?: "free" | "pro" })?.plan ?? null;
  const maxOutputPages = repeatMaxOutputPages(plan);

  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState(0);
  const [source, setSource] = useState<Source>("all");
  const [singlePage, setSinglePage] = useState("1");
  const [rangeStr, setRangeStr] = useState("");
  const [count, setCount] = useState(2);
  const [arrangement, setArrangement] = useState<Arrangement>("sequential");
  const [status, setStatus] = useState<Status>("loaded");
  const [result, setResult] = useState<{ blob: Blob; filename: string; outputPages: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>();

  function getSrcIndices(): number[] {
    if (!pages) return [];
    if (source === "all") return Array.from({ length: pages }, (_, i) => i);
    if (source === "single") {
      const n = parseInt(singlePage, 10);
      return !isNaN(n) && n >= 1 && n <= pages ? [n - 1] : [];
    }
    return parsePageRanges(rangeStr, pages);
  }

  const srcIndices = getSrcIndices();
  const outputPages = srcIndices.length * count;
  const outputOverLimit = srcIndices.length > 0 && outputPages > maxOutputPages;

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
    if (!file || srcIndices.length === 0 || outputOverLimit) return;
    setStatus("processing");
    try {
      const out = await repeatPages(file, { srcIndices, count, arrangement });
      setResult({ blob: out.blob, filename: out.filename, outputPages: out.outputPages });
      setStatus("done");
      analytics.toolUsed("repeat-pages");
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
        <FileDropzone toolId="repeatPages" accept="pdf" onFiles={onFiles} checkPages title={tp("dropTitle")} />
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
          <h3
            className="pp-mono mb-5 text-[13px] font-medium uppercase tracking-[0.04em]"
            style={{ color: "var(--text-3)" }}
          >
            {tp("optionsTitle")}
          </h3>

          {/* Source selector */}
          <div className="mb-[22px]">
            <label className="mb-2 block text-[13px] font-medium" style={{ color: "var(--text)" }}>
              {tp("sourceLabel")}
            </label>
            <Segmented<Source>
              value={source}
              onChange={dirty(setSource)}
              options={[
                { value: "all", label: tp("sourceAll") },
                { value: "single", label: tp("sourceSingle") },
                { value: "range", label: tp("sourceRange") },
              ]}
            />
          </div>

          {source === "single" && (
            <div className="mb-[22px]">
              <label className="mb-2 block text-[13px] font-medium" style={{ color: "var(--text)" }}>
                {tp("pageNumberLabel")}
              </label>
              <input
                type="number"
                min={1}
                max={pages}
                value={singlePage}
                onChange={(e) => dirty(setSinglePage)(e.target.value)}
                className="pp-input w-full"
              />
            </div>
          )}

          {source === "range" && (
            <div className="mb-[22px]">
              <label className="mb-2 block text-[13px] font-medium" style={{ color: "var(--text)" }}>
                {tp("rangeLabel")}
              </label>
              <input
                type="text"
                placeholder={tp("rangePlaceholder")}
                value={rangeStr}
                onChange={(e) => dirty(setRangeStr)(e.target.value)}
                className="pp-input w-full"
              />
            </div>
          )}

          {/* Repeat count stepper */}
          <div className="mb-[22px]">
            <div className="mb-2 flex items-center justify-between">
              <label className="text-[13px] font-medium" style={{ color: "var(--text)" }}>
                {tp("countLabel")}
              </label>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => dirty(setCount)(Math.max(1, count - 1))}
                className="pp-btn pp-btn-sm"
                style={{ minWidth: 34, justifyContent: "center" }}
              >
                −
              </button>
              <input
                type="number"
                min={1}
                value={count}
                onChange={(e) => dirty(setCount)(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="pp-input w-16 text-center"
              />
              <button
                type="button"
                onClick={() => dirty(setCount)(count + 1)}
                className="pp-btn pp-btn-sm"
                style={{ minWidth: 34, justifyContent: "center" }}
              >
                +
              </button>
            </div>
          </div>

          {/* Arrangement */}
          <div className="mb-6">
            <label className="mb-2 block text-[13px] font-medium" style={{ color: "var(--text)" }}>
              {tp("arrangementLabel")}
            </label>
            <Segmented<Arrangement>
              value={arrangement}
              onChange={dirty(setArrangement)}
              options={[
                { value: "sequential", label: tp("sequential") },
                { value: "interleaved", label: tp("interleaved") },
              ]}
            />
          </div>

          {outputOverLimit && (
            <div className="mb-3">
              <ErrorBanner
                message={tp("limitError", { total: outputPages, limit: maxOutputPages })}
                onRetry={() => {}}
              />
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
              disabled={status === "processing" || outputOverLimit || srcIndices.length === 0}
            >
              {status === "processing" ? (
                <>
                  <Spinner /> {tp("generating")}
                </>
              ) : (
                <>
                  <IconCopy size={15} /> {tp("generate", { pages: outputPages || 0 })}
                </>
              )}
            </button>
          )}
          <div
            className="mt-3 flex items-center justify-center gap-1.5 text-[11.5px]"
            style={{ color: "var(--text-3)" }}
          >
            <span className="pp-dot" style={{ color: "#34D399" }} /> {t("localNote")}
          </div>
        </div>

        {/* Preview */}
        <div
          className="flex min-h-[300px] flex-col items-center justify-center gap-5 rounded-2xl p-8"
          style={{ background: "var(--bg-2)", border: "1px solid var(--line)" }}
        >
          {status === "error" ? (
            <ErrorBanner message={tp("errorTitle")} onRetry={() => setStatus("loaded")} />
          ) : (
            <ArrangementPreview
              srcCount={srcIndices.length}
              count={count}
              arrangement={arrangement}
              outputPages={outputPages}
              tp={tp}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function ArrangementPreview({
  srcCount,
  count,
  arrangement,
  outputPages,
  tp,
}: {
  srcCount: number;
  count: number;
  arrangement: Arrangement;
  outputPages: number;
  tp: ReturnType<typeof useTranslations>;
}) {
  const MAX_CHIPS = 12;
  const chips: number[] = [];

  if (arrangement === "sequential") {
    outer: for (let p = 0; p < Math.min(srcCount, 4); p++)
      for (let c = 0; c < Math.min(count, 3); c++) {
        chips.push(p + 1);
        if (chips.length >= MAX_CHIPS) break outer;
      }
  } else {
    outer: for (let c = 0; c < Math.min(count, 3); c++)
      for (let p = 0; p < Math.min(srcCount, 4); p++) {
        chips.push(p + 1);
        if (chips.length >= MAX_CHIPS) break outer;
      }
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        {chips.map((n, i) => (
          <span
            key={i}
            className="pp-mono inline-flex h-7 w-7 items-center justify-center rounded-md text-[11px] font-semibold"
            style={{
              background: "rgba(107,92,231,0.12)",
              color: "#BFB5FF",
              border: "1px solid rgba(107,92,231,0.25)",
            }}
          >
            {n}
          </span>
        ))}
        {outputPages > chips.length && (
          <span className="text-[13px]" style={{ color: "var(--text-3)" }}>
            …
          </span>
        )}
      </div>
      <div className="text-center">
        <div className="text-[24px] font-bold tabular-nums" style={{ color: "var(--text)" }}>
          {outputPages > 0 ? outputPages : "—"}
        </div>
        <div className="text-[12.5px]" style={{ color: "var(--text-3)" }}>
          {srcCount > 0
            ? tp("previewHint", { src: srcCount, count, total: outputPages })
            : tp("previewEmpty")}
        </div>
      </div>
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
      style={{
        gridTemplateColumns: `repeat(${options.length}, 1fr)`,
        background: "var(--bg-2)",
        border: "1px solid var(--line)",
      }}
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
