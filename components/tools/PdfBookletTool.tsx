"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { FileDropzone } from "./FileDropzone";
import { FileInfoBar } from "./FileInfoBar";
import { ErrorBanner } from "./ResultPanels";
import { Spinner } from "./Spinner";
import { IconBook, IconDownload } from "@/components/shared/icons";
import { pdfBooklet } from "@/lib/pdf/pdfBooklet";
import { isPdf, readPageCount } from "@/lib/pdf/common";
import { downloadBlob } from "@/lib/format";
import { analytics } from "@/lib/analytics";

type Status = "loaded" | "processing" | "done" | "error";
type Paper = "a4" | "letter" | "legal";

export function PdfBookletTool() {
  const t = useTranslations("ToolUI");
  const tp = useTranslations("ToolPages.pdfBooklet");

  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState(0);
  const [paper, setPaper] = useState<Paper>("a4");
  const [status, setStatus] = useState<Status>("loaded");
  const [result, setResult] = useState<{
    blob: Blob;
    filename: string;
    sheets: number;
    blankAdded: number;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>();

  const padded = pages ? Math.ceil(pages / 4) * 4 : 0;
  const sheets = padded / 4;
  const blankAdded = padded - pages;

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
    if (!file || pages === 0) return;
    setStatus("processing");
    try {
      const out = await pdfBooklet(file, { paper });
      setResult({
        blob: out.blob,
        filename: out.filename,
        sheets: out.sheets,
        blankAdded: out.blankAdded,
      });
      setStatus("done");
      analytics.toolUsed("pdf-booklet");
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
        <FileDropzone toolId="pdfBooklet" accept="pdf" onFiles={onFiles} checkPages title={tp("dropTitle")} />
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

          {/* Stats row */}
          {pages > 0 && (
            <div
              className="mb-5 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl px-4 py-3 text-[12.5px]"
              style={{ background: "var(--bg-2)", border: "1px solid var(--line)" }}
            >
              <span style={{ color: "var(--text-2)" }}>{tp("statsPages", { n: pages })}</span>
              {blankAdded > 0 && (
                <span style={{ color: "var(--text-3)" }}>
                  +{blankAdded} {tp("statsBlank")}
                </span>
              )}
              <span className="ml-auto pp-mono font-semibold" style={{ color: "var(--text)" }}>
                {tp("statsSheets", { n: sheets })}
              </span>
            </div>
          )}

          {/* Paper size */}
          <div className="mb-6">
            <label className="mb-2 block text-[13px] font-medium" style={{ color: "var(--text)" }}>
              {tp("paperLabel")}
            </label>
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
              disabled={status === "processing" || pages === 0}
            >
              {status === "processing" ? (
                <>
                  <Spinner /> {tp("generating")}
                </>
              ) : (
                <>
                  <IconBook size={15} /> {tp("generate", { sheets })}
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

        {/* Preview + print instructions */}
        <div className="flex flex-col gap-5">
          <div
            className="flex min-h-[220px] flex-col items-center justify-center gap-5 rounded-2xl p-8"
            style={{ background: "var(--bg-2)", border: "1px solid var(--line)" }}
          >
            {status === "error" ? (
              <ErrorBanner message={tp("errorTitle")} onRetry={() => setStatus("loaded")} />
            ) : (
              <BookletPreview sheets={sheets} paper={paper} tp={tp} />
            )}
          </div>

          {/* Print instructions */}
          <div className="pp-card" style={{ padding: 20 }}>
            <h4
              className="pp-mono mb-3 text-[12px] font-medium uppercase tracking-[0.04em]"
              style={{ color: "var(--text-3)" }}
            >
              {tp("instructionsTitle")}
            </h4>
            <ol className="flex flex-col gap-2">
              {([1, 2, 3, 4] as const).map((n) => (
                <li
                  key={n}
                  className="flex items-start gap-3 text-[13px]"
                  style={{ color: "var(--text-2)" }}
                >
                  <span
                    className="pp-mono mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold"
                    style={{ background: "rgba(107,92,231,0.12)", color: "#BFB5FF" }}
                  >
                    {n}
                  </span>
                  {tp(`step${n}`)}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

function BookletPreview({
  sheets,
  paper,
  tp,
}: {
  sheets: number;
  paper: string;
  tp: ReturnType<typeof useTranslations>;
}) {
  const W = 280,
    H = 100;
  return (
    <div className="flex flex-col items-center gap-3">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <rect x={3} y={5} width={W - 6} height={H - 14} rx={4} fill="rgba(0,0,0,0.3)" />
        <rect x={0} y={0} width={W} height={H - 10} rx={4} fill="white" />
        <line
          x1={W / 2}
          y1={6}
          x2={W / 2}
          y2={H - 14}
          stroke="#D1D5DB"
          strokeWidth={1}
          strokeDasharray="4 3"
        />
        <rect
          x={10}
          y={8}
          width={W / 2 - 18}
          height={H - 26}
          rx={2}
          fill="#F9FAFB"
          stroke="#E5E7EB"
          strokeWidth={1}
        />
        <rect
          x={W / 2 + 8}
          y={8}
          width={W / 2 - 18}
          height={H - 26}
          rx={2}
          fill="#F9FAFB"
          stroke="#E5E7EB"
          strokeWidth={1}
        />
        <text
          x={W / 2}
          y={H - 2}
          textAnchor="middle"
          fontSize={7}
          fill="#9CA3AF"
          fontFamily="monospace"
        >
          {tp("bookletFold")}
        </text>
      </svg>
      <div className="text-[12px]" style={{ color: "var(--text-3)" }}>
        {sheets > 0
          ? tp("bookletPreviewLabel", { n: sheets, paper: paper.toUpperCase() })
          : "—"}
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
