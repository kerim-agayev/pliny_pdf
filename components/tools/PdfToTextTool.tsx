"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { FileDropzone } from "./FileDropzone";
import { FileInfoBar } from "./FileInfoBar";
import { ErrorBanner } from "./ResultPanels";
import { Spinner } from "./Spinner";
import { IconText, IconDownload } from "@/components/shared/icons";
import { pdfToText } from "@/lib/pdf/pdfToText";
import { parsePageRanges } from "@/lib/pdf/extract";
import { isPdf, readPageCount } from "@/lib/pdf/common";
import { downloadBlob, baseName, formatBytes } from "@/lib/format";
import { analytics } from "@/lib/analytics";

type Status = "loaded" | "processing" | "done" | "error";
type Range = "all" | "range";
type Enc = "utf8" | "ascii";

const PREVIEW_CHARS = 500;

export function PdfToTextTool() {
  const t = useTranslations("ToolUI");
  const tp = useTranslations("ToolPages.pdfToText");
  const locale = useLocale();

  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState(0);
  const [preserve, setPreserve] = useState(true);
  const [range, setRange] = useState<Range>("all");
  const [rangeStr, setRangeStr] = useState("");
  const [enc, setEnc] = useState<Enc>("utf8");
  const [status, setStatus] = useState<Status>("loaded");
  const [result, setResult] = useState<{ text: string; words: number; pages: number; blob: Blob; filename: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>();

  const indices = useMemo(
    () => (range === "range" && pages ? parsePageRanges(rangeStr, pages) : []),
    [range, rangeStr, pages],
  );
  const rangeInvalid = range === "range" && rangeStr.trim() !== "" && indices.length === 0;
  const canExtract = range === "all" || indices.length > 0;

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
    if (!file || !canExtract) return;
    setStatus("processing");
    try {
      const out = await pdfToText(file, {
        indices: range === "range" ? indices : undefined,
        preserveLayout: preserve,
        encoding: enc,
      });
      if (!out.text.trim()) {
        setStatus("error");
        return;
      }
      const blob = new Blob([enc === "utf8" ? "﻿" + out.text : out.text], {
        type: "text/plain;charset=utf-8",
      });
      setResult({ text: out.text, words: out.words, pages: out.pages, blob, filename: `${baseName(file.name)}.txt` });
      setStatus("done");
      analytics.toolUsed("pdf-to-text");
    } catch {
      setStatus("error");
    }
  }

  function reset() {
    setFile(null);
    setPages(0);
    setResult(null);
    setStatus("loaded");
    setRange("all");
    setRangeStr("");
    setErrorMsg(undefined);
  }

  if (!file) {
    return (
      <div>
        <FileDropzone accept="pdf" checkPages onFiles={onFiles} title={tp("dropTitle")} />
        {errorMsg && <div className="mt-4"><ErrorBanner message={errorMsg} onRetry={() => setErrorMsg(undefined)} /></div>}
      </div>
    );
  }

  const preview = result ? result.text.slice(0, PREVIEW_CHARS) : "";
  const truncated = result ? result.text.length > PREVIEW_CHARS : false;

  return (
    <div className="flex flex-col gap-6">
      <FileInfoBar file={file} pages={pages || undefined} onRemove={reset} />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[340px_1fr]">
        {/* Controls */}
        <div className="pp-card self-start" style={{ padding: 26 }}>
          <h3 className="pp-mono mb-5 text-[13px] font-medium uppercase tracking-[0.04em]" style={{ color: "var(--text-3)" }}>
            {tp("optionsTitle")}
          </h3>

          {/* Preserve layout */}
          <div className="mb-[22px]">
            <label className="mb-2 block text-[13px] font-medium" style={{ color: "var(--text)" }}>{tp("preserveLabel")}</label>
            <div className="flex items-center justify-between gap-3">
              <span className="text-[12.5px] leading-snug" style={{ color: "var(--text-3)" }}>{tp("preserveHint")}</span>
              <Toggle on={preserve} onChange={dirty(setPreserve)} label={tp("preserveLabel")} />
            </div>
          </div>

          {/* Pages */}
          <div className="mb-[22px]">
            <label className="mb-2 block text-[13px] font-medium" style={{ color: "var(--text)" }}>{tp("pagesLabel")}</label>
            <Segmented<Range>
              value={range}
              onChange={dirty(setRange)}
              options={[{ value: "all", label: tp("modeAll") }, { value: "range", label: tp("modeRange") }]}
            />
            {range === "range" && (
              <>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  className="pp-input pp-mono mt-2.5"
                  value={rangeStr}
                  onChange={(e) => dirty(setRangeStr)(e.target.value)}
                  placeholder={tp("rangePlaceholder")}
                  style={{ borderColor: rangeInvalid ? "#F43F5E" : undefined }}
                />
                {rangeInvalid && (
                  <span className="mt-1.5 block text-[12px]" style={{ color: "#FDA4AF" }}>{tp("invalidRange", { count: pages })}</span>
                )}
              </>
            )}
          </div>

          {/* Encoding */}
          <div className="mb-6">
            <label className="mb-2 block text-[13px] font-medium" style={{ color: "var(--text)" }}>{tp("encodingLabel")}</label>
            <Segmented<Enc>
              value={enc}
              onChange={dirty(setEnc)}
              options={[{ value: "utf8", label: "UTF-8" }, { value: "ascii", label: "ASCII" }]}
            />
            <div className="pp-mono mt-2 text-[10.5px]" style={{ color: "var(--text-3)" }}>
              {enc === "utf8" ? tp("encUtf8Hint") : tp("encAsciiHint")}
            </div>
          </div>

          {status === "done" && result ? (
            <button
              type="button"
              className="pp-btn pp-btn-lg w-full justify-center"
              onClick={() => downloadBlob(result.blob, result.filename)}
              style={{ background: "var(--emerald)", boxShadow: "0 8px 20px -10px rgba(16,185,129,0.6)" }}
            >
              <IconDownload size={15} /> {tp("downloadTxt")}
            </button>
          ) : (
            <button type="button" className="pp-btn pp-btn-lg w-full justify-center" onClick={run} disabled={status === "processing" || !canExtract}>
              {status === "processing" ? <><Spinner /> {tp("extracting")}</> : <><IconText size={15} sw={1.7} /> {tp("action")}</>}
            </button>
          )}
          <div className="mt-3 flex items-center justify-center gap-1.5 text-[11.5px]" style={{ color: "var(--text-3)" }}>
            <span className="pp-dot" style={{ color: "#34D399" }} /> {t("localNote")}
          </div>
        </div>

        {/* Output / preview */}
        <div
          className="flex min-h-[460px] flex-col overflow-hidden rounded-2xl"
          style={{ background: "var(--bg-2)", border: "1px solid var(--line)" }}
        >
          <div className="flex items-center justify-between border-b px-[18px] py-3.5" style={{ borderColor: "var(--line)" }}>
            <div className="flex items-center gap-2">
              <span className="pp-mono text-[10.5px] uppercase tracking-[0.1em]" style={{ color: "var(--text-3)" }}>
                {status === "done" ? tp("previewDone") : tp("previewTitle")}
              </span>
              {status === "done" && <span className="size-1.5 rounded-full" style={{ background: "#34D399", boxShadow: "0 0 8px #34D399" }} />}
            </div>
            {status === "done" && <span className="pp-mono text-[11px]" style={{ color: "var(--text-3)" }}>{tp("previewNote")}</span>}
          </div>

          {status === "error" ? (
            <div className="flex flex-1 items-center p-7">
              <ErrorBanner message={tp("scannedTitle")} note={tp("scannedBody")} onRetry={() => setStatus("loaded")} />
            </div>
          ) : status === "done" && result ? (
            <>
              <pre
                className="m-0 flex-1 overflow-hidden p-[26px]"
                style={{
                  fontFamily: "var(--font-mono)", fontSize: 13, lineHeight: 1.7, color: "var(--text)", whiteSpace: "pre-wrap",
                  maskImage: "linear-gradient(180deg, #000 78%, transparent)",
                  WebkitMaskImage: "linear-gradient(180deg, #000 78%, transparent)",
                }}
              >
                {preview}{truncated ? "…" : ""}
              </pre>
              <div className="flex items-center justify-between gap-3 border-t px-[18px] py-3.5" style={{ borderColor: "var(--line)" }}>
                <span className="pp-mono text-[12px]" style={{ color: "var(--text-2)" }}>
                  <span style={{ color: "#34D399" }}>●</span>{" "}
                  {tp("stat", {
                    size: formatBytes(result.blob.size),
                    words: result.words.toLocaleString(locale),
                    pages: result.pages,
                  })}
                </span>
                <button
                  type="button"
                  className="pp-btn"
                  onClick={() => downloadBlob(result.blob, result.filename)}
                  style={{ background: "var(--emerald)", boxShadow: "0 8px 20px -10px rgba(16,185,129,0.6)" }}
                >
                  <IconDownload size={14} /> {tp("downloadNamed", { name: result.filename })}
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
              <div
                className="flex size-16 items-center justify-center rounded-2xl"
                style={{ background: "rgba(96,165,250,0.12)", border: "1px solid rgba(96,165,250,0.25)", color: "#93C5FD" }}
              >
                <IconText size={28} sw={1.5} />
              </div>
              <p className="max-w-[320px] text-[13.5px]" style={{ color: "var(--text-2)" }}>
                {status === "processing" ? tp("readingLayer") : tp("readyHint")}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className="relative shrink-0 rounded-full transition-colors"
      style={{
        width: 40, height: 22,
        background: on ? "var(--indigo)" : "var(--line-2)",
        border: "1px solid " + (on ? "var(--indigo)" : "var(--line-2)"),
      }}
    >
      <span
        className="absolute top-1/2 rounded-full bg-white transition-all"
        style={{ width: 16, height: 16, left: on ? 20 : 2, transform: "translateY(-50%)" }}
      />
    </button>
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
    <div className="grid gap-1 rounded-[10px] p-1" style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)`, background: "var(--bg-2)", border: "1px solid var(--line)" }}>
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
