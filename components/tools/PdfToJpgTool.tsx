"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { FileDropzone } from "./FileDropzone";
import { FileInfoBar } from "./FileInfoBar";
import { SuccessPanel, ErrorBanner } from "./ResultPanels";
import { Spinner } from "./Spinner";
import { IconArrow } from "@/components/shared/icons";
import { pdfToJpg } from "@/lib/pdf/pdfToJpg";
import { readPageCount, isPdf } from "@/lib/pdf/common";
import { downloadBlob } from "@/lib/format";

type Status = "idle" | "processing" | "done" | "error";

export function PdfToJpgTool() {
  const t = useTranslations("ToolUI");
  const tp = useTranslations("ToolPages.pdfToJpg");
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState(0);
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<{ blob: Blob; isZip: boolean; count: number; filename: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>();

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
      setResult(await pdfToJpg(file));
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
        meta={`${result.filename}${result.isZip ? ` · ${tp("zipNote")}` : ""}`}
        onDownload={() => downloadBlob(result.blob, result.filename)}
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
      <div className="flex justify-end">
        <button type="button" className="pp-btn pp-btn-lg min-w-[170px] justify-center" onClick={run} disabled={status === "processing"}>
          {status === "processing" ? <><Spinner /> {t("processing")}</> : <>{tp("action")} <IconArrow size={15} /></>}
        </button>
      </div>
      {status === "error" && <ErrorBanner onRetry={() => setStatus("idle")} />}
    </div>
  );
}
