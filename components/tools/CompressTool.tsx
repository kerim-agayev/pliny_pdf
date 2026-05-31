"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { FileDropzone } from "./FileDropzone";
import { FileInfoBar } from "./FileInfoBar";
import { SuccessPanel, ErrorBanner } from "./ResultPanels";
import { Spinner } from "./Spinner";
import { IconArrow, IconAlert } from "@/components/shared/icons";
import { compressPdf, type CompressPreset } from "@/lib/pdf/compress";
import { readPageCount, isPdf } from "@/lib/pdf/common";
import { formatBytes, downloadBlob, baseName } from "@/lib/format";
import { analytics } from "@/lib/analytics";

type Status = "idle" | "processing" | "done" | "error";

export function CompressTool() {
  const t = useTranslations("ToolUI");
  const tp = useTranslations("ToolPages.compress");
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState(0);
  const [preset, setPreset] = useState<CompressPreset>("balanced");
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<{ blob: Blob; originalSize: number; newSize: number; changed: boolean } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>();
  const SMALL = 1024 * 1024;

  const PRESETS: { key: CompressPreset; title: string; desc: string }[] = [
    { key: "screen", title: tp("presetScreen"), desc: tp("presetScreenDesc") },
    { key: "balanced", title: tp("presetBalanced"), desc: tp("presetBalancedDesc") },
    { key: "maximum", title: tp("presetMaximum"), desc: tp("presetMaximumDesc") },
  ];

  async function onFiles(files: File[]) {
    const f = files[0];
    if (!f || !isPdf(f)) {
      setErrorMsg(t("wrongTypePdf"));
      return;
    }
    setErrorMsg(undefined);
    setFile(f);
    setPages(await readPageCount(f).catch(() => 0));
  }

  async function run() {
    if (!file) return;
    setStatus("processing");
    try {
      setResult(await compressPdf(file, preset));
      setStatus("done");
      analytics.toolUsed("compress-pdf");
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
    const saved = Math.max(0, Math.round((1 - result.newSize / result.originalSize) * 100));
    return (
      <SuccessPanel
        title={result.changed ? tp("successTitle") : tp("alreadyOptimized")}
        meta={
          result.changed
            ? `${formatBytes(result.originalSize)} → ${formatBytes(result.newSize)}`
            : formatBytes(result.originalSize)
        }
        badge={result.changed ? tp("savedBadge", { percent: saved }) : undefined}
        onDownload={() => downloadBlob(result.blob, `${baseName(file!.name)}-compressed.pdf`)}
        onReset={reset}
      />
    );
  }

  if (!file) {
    return (
      <div>
        <FileDropzone accept="pdf" onFiles={onFiles} />
        {errorMsg && <div className="mt-4"><ErrorBanner message={errorMsg} onRetry={() => setErrorMsg(undefined)} /></div>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <FileInfoBar file={file} pages={pages} onRemove={reset} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {PRESETS.map((p) => {
          const active = preset === p.key;
          return (
            <button
              key={p.key}
              type="button"
              onClick={() => setPreset(p.key)}
              className="rounded-xl p-4 text-left"
              style={{
                border: `1px solid ${active ? "var(--indigo)" : "var(--line)"}`,
                background: active ? "var(--indigo-dim)" : "var(--card)",
              }}
            >
              <div className="text-sm font-semibold" style={{ color: "var(--text)" }}>{p.title}</div>
              <div className="mt-1 text-[12px] leading-snug" style={{ color: "var(--text-2)" }}>{p.desc}</div>
            </button>
          );
        })}
      </div>

      {file.size < SMALL && (
        <div className="flex items-start gap-2 text-[12px]" style={{ color: "var(--amber)" }}>
          <IconAlert size={14} color="var(--amber)" sw={1.7} />
          <span>{tp("smallFileNote")}</span>
        </div>
      )}

      <div className="flex items-start gap-2 text-[12px]" style={{ color: "var(--text-3)" }}>
        <IconAlert size={14} color="var(--amber)" sw={1.7} />
        <span>{tp("rasterNote")}</span>
      </div>

      <div className="flex justify-end">
        <button type="button" className="pp-btn pp-btn-lg min-w-[170px] justify-center" onClick={run} disabled={status === "processing"}>
          {status === "processing" ? <><Spinner /> {t("processing")}</> : <>{tp("action")} <IconArrow size={15} /></>}
        </button>
      </div>

      {status === "error" && <ErrorBanner onRetry={() => setStatus("idle")} />}
    </div>
  );
}
