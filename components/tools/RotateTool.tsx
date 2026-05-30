"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { FileDropzone } from "./FileDropzone";
import { FileInfoBar } from "./FileInfoBar";
import { SuccessPanel, ErrorBanner } from "./ResultPanels";
import { Spinner } from "./Spinner";
import { IconArrow, IconRotate } from "@/components/shared/icons";
import { rotatePdf } from "@/lib/pdf/rotate";
import { readPageCount, isPdf } from "@/lib/pdf/common";
import { downloadBlob, baseName } from "@/lib/format";

type Status = "idle" | "processing" | "done" | "error";

export function RotateTool() {
  const t = useTranslations("ToolUI");
  const tp = useTranslations("ToolPages.rotate");
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState(0);
  const [delta, setDelta] = useState(90);
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<Blob | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>();

  const options = [
    { value: 270, label: tp("rotateLeft") },
    { value: 90, label: tp("rotateRight") },
    { value: 180, label: tp("flip") },
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
      setResult(await rotatePdf(file, delta));
      setStatus("done");
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
        meta={`${baseName(file!.name)}-rotated.pdf`}
        onDownload={() => downloadBlob(result, `${baseName(file!.name)}-rotated.pdf`)}
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

      <div className="flex items-center justify-center gap-6 rounded-2xl py-10" style={{ background: "var(--bg-2)", border: "1px solid var(--line)" }}>
        <div
          className="flex size-24 items-center justify-center rounded-xl transition-transform"
          style={{ background: "var(--card)", border: "1px solid var(--line-2)", color: "#BFB5FF", transform: `rotate(${delta}deg)` }}
        >
          <IconRotate size={32} sw={1.5} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {options.map((o) => {
          const active = delta === o.value;
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => setDelta(o.value)}
              className="rounded-xl px-4 py-3 text-sm font-medium"
              style={{
                border: `1px solid ${active ? "var(--indigo)" : "var(--line)"}`,
                background: active ? "var(--indigo-dim)" : "var(--card)",
                color: "var(--text)",
              }}
            >
              {o.label}
            </button>
          );
        })}
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
