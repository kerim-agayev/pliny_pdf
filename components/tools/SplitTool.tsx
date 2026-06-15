"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { FileDropzone } from "./FileDropzone";
import { FileInfoBar } from "./FileInfoBar";
import { SuccessPanel, ErrorBanner } from "./ResultPanels";
import { Spinner } from "./Spinner";
import { IconArrow } from "@/components/shared/icons";
import { splitRange, splitEach } from "@/lib/pdf/split";
import { readPageCount, isPdf } from "@/lib/pdf/common";
import { downloadBlob } from "@/lib/format";
import { analytics } from "@/lib/analytics";

type Status = "idle" | "processing" | "done" | "error";

/** "Every page" mode is capped to keep the zip generation reasonable; range mode is unlimited. */
const EACH_CAP = 500;

export function SplitTool() {
  const t = useTranslations("ToolUI");
  const tp = useTranslations("ToolPages.split");
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState(0);
  const [mode, setMode] = useState<"range" | "each">("range");
  const [from, setFrom] = useState(1);
  const [to, setTo] = useState(1);
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<{ blob: Blob; filename: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>();

  async function onFiles(files: File[]) {
    const f = files[0];
    if (!f || !isPdf(f)) {
      setErrorMsg(t("wrongTypePdf"));
      return;
    }
    setErrorMsg(undefined);
    setFile(f);
    const n = await readPageCount(f).catch(() => 0);
    setPages(n);
    setFrom(1);
    setTo(n || 1);
    // Every-page mode is capped — fall back to range for very large PDFs.
    if (n > EACH_CAP) setMode("range");
  }

  async function run() {
    if (!file) return;
    setStatus("processing");
    try {
      const res = mode === "range" ? await splitRange(file, from, to) : await splitEach(file);
      setResult({ blob: res.blob, filename: res.filename });
      setStatus("done");
      analytics.toolUsed("split-pdf");
    } catch {
      setStatus("error");
    }
  }

  function reset() {
    setFile(null);
    setResult(null);
    setStatus("idle");
    setErrorMsg(undefined);
  }

  if (status === "done" && result) {
    return (
      <SuccessPanel
        title={tp("successTitle")}
        meta={result.filename}
        onDownload={() => downloadBlob(result.blob, result.filename)}
        onReset={reset}
      />
    );
  }

  if (!file) {
    return (
      <div>
        <FileDropzone toolId="split" accept="pdf" checkPages onFiles={onFiles} />
        {errorMsg && <div className="mt-4"><ErrorBanner message={errorMsg} onRetry={() => setErrorMsg(undefined)} /></div>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <FileInfoBar file={file} pages={pages} onRemove={reset} />

      <div className="flex flex-col gap-2.5">
        <ModeOption active={mode === "range"} label={tp("modeRange")} onClick={() => setMode("range")} />
        {mode === "range" && (
          <div className="flex items-end gap-3 pl-1">
            <NumberField label={tp("from")} value={from} min={1} max={pages} onChange={setFrom} />
            <NumberField label={tp("to")} value={to} min={from} max={pages} onChange={setTo} />
          </div>
        )}
        <ModeOption
          active={mode === "each"}
          label={tp("modeEach")}
          disabled={pages > EACH_CAP}
          onClick={() => setMode("each")}
        />
        {pages > EACH_CAP && (
          <p className="pl-1 text-[12.5px]" style={{ color: "var(--text-2)" }}>
            {tp("eachCapped", { pages, cap: EACH_CAP })}
          </p>
        )}
      </div>

      <div className="flex justify-end">
        <button type="button" className="pp-btn pp-btn-lg min-w-[160px] justify-center" onClick={run} disabled={status === "processing"}>
          {status === "processing" ? <><Spinner /> {t("processing")}</> : <>{tp("action")} <IconArrow size={15} /></>}
        </button>
      </div>

      {status === "error" && <ErrorBanner onRetry={() => setStatus("idle")} />}
    </div>
  );
}

function ModeOption({
  active,
  label,
  onClick,
  disabled = false,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-3 rounded-xl px-4 py-3.5 text-left text-sm"
      style={{
        border: `1px solid ${active ? "var(--indigo)" : "var(--line)"}`,
        background: active ? "var(--indigo-dim)" : "var(--bg-2)",
        color: "var(--text)",
        opacity: disabled ? 0.45 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      <span
        className="flex size-4 items-center justify-center rounded-full"
        style={{ border: `2px solid ${active ? "var(--indigo)" : "var(--line-2)"}` }}
      >
        {active && <span className="size-2 rounded-full" style={{ background: "var(--indigo)" }} />}
      </span>
      {label}
    </button>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="pp-mono text-[11px] uppercase tracking-[0.06em]" style={{ color: "var(--text-3)" }}>{label}</span>
      <input
        type="number"
        className="pp-input"
        style={{ width: 96 }}
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(Math.max(min, Math.min(max, Number(e.target.value) || min)))}
      />
    </label>
  );
}
