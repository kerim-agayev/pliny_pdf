"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { FileDropzone } from "./FileDropzone";
import { FileInfoBar } from "./FileInfoBar";
import { SuccessPanel, ErrorBanner } from "./ResultPanels";
import { Spinner } from "./Spinner";
import { IconGrayscale } from "@/components/shared/icons";
import { grayscalePdf } from "@/lib/pdf/grayscale";
import { isPdf } from "@/lib/pdf/common";
import { downloadBlob, baseName, MAX_FILE_BYTES } from "@/lib/format";
import { analytics } from "@/lib/analytics";

type Status = "idle" | "processing" | "done" | "error";

export function GrayscalePdf() {
  const t = useTranslations("ToolUI");
  const tp = useTranslations("ToolPages.grayscalePdf");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<Blob | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>();
  const [progress, setProgress] = useState({ page: 0, total: 0 });

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
  }

  async function run() {
    if (!file) return;
    setStatus("processing");
    setProgress({ page: 0, total: 0 });
    try {
      const res = await grayscalePdf(file, (page, total) => setProgress({ page, total }));
      setResult(res.blob);
      setStatus("done");
      if (res.inflated) toast.warning(tp("sizeGrew"));
      analytics.toolUsed("grayscale-pdf");
    } catch {
      setStatus("error");
    }
  }

  function reset() {
    setFile(null);
    setResult(null);
    setStatus("idle");
    setErrorMsg(undefined);
    setProgress({ page: 0, total: 0 });
  }

  if (status === "done" && result) {
    return (
      <SuccessPanel
        title={tp("successTitle")}
        meta={`${baseName(file!.name)}-grayscale.pdf`}
        onDownload={() => downloadBlob(result, `${baseName(file!.name)}-grayscale.pdf`)}
        onReset={reset}
      />
    );
  }

  if (!file) {
    return (
      <div>
        <FileDropzone accept="pdf" onFiles={onFiles} title={tp("emptyTitle")} />
        {errorMsg && <div className="mt-4"><ErrorBanner message={errorMsg} onRetry={() => setErrorMsg(undefined)} /></div>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <FileInfoBar file={file} onRemove={reset} />

      <div className="rounded-[14px] p-[18px]" style={{ background: "rgba(127,127,127,0.05)", border: "1px solid var(--line)" }}>
        <p className="text-[12.5px]" style={{ color: "var(--text-2)" }}>{tp("rasterNote")}</p>
      </div>

      {status === "processing" && progress.total > 0 && (
        <div>
          <div className="pp-progress"><span style={{ width: `${(progress.page / progress.total) * 100}%` }} /></div>
          <p className="pp-mono mt-2 text-[12px]" style={{ color: "var(--text-3)" }}>{tp("progress", { n: progress.page, total: progress.total })}</p>
        </div>
      )}

      <button type="button" className="pp-btn pp-btn-lg justify-center" onClick={run} disabled={status === "processing"}>
        {status === "processing" ? <><Spinner /> {t("processing")}</> : <><IconGrayscale size={15} sw={1.7} /> {tp("action")}</>}
      </button>

      {status === "error" && <ErrorBanner onRetry={() => setStatus("idle")} />}
    </div>
  );
}
