"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { FileDropzone } from "./FileDropzone";
import { FileInfoBar } from "./FileInfoBar";
import { SuccessPanel, ErrorBanner } from "./ResultPanels";
import { CloudProgress } from "./CloudProgress";
import { Spinner } from "./Spinner";
import { IconArrow } from "@/components/shared/icons";
import { readPageCount, isPdf } from "@/lib/pdf/common";
import { postBinary, ApiError } from "@/lib/api";
import { downloadBlob, baseName } from "@/lib/format";
import { analytics } from "@/lib/analytics";
import { useSession } from "@/lib/auth/client";
import { cloudMaxMB } from "@/lib/limits";

type Status = "idle" | "uploading" | "done" | "error";

export function PdfToJpgTool() {
  const t = useTranslations("ToolUI");
  const tp = useTranslations("ToolPages.pdfToJpg");
  const { data: session } = useSession();
  const maxMB = cloudMaxMB((session?.user as { plan?: "free" | "pro" })?.plan ?? null);
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState(0);
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<{ blob: Blob; filename: string; isZip: boolean } | null>(null);
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
    if (status === "done" || status === "error") {
      setStatus("idle");
      setResult(null);
    }
  }

  async function run() {
    if (!file) return;
    setStatus("uploading");
    setErrorMsg(undefined);
    const t0 = performance.now();
    try {
      const { blob, filename } = await postBinary("/api/tools/pdf-to-jpg", [file], `${baseName(file.name)}.jpg`);
      setResult({ blob, filename, isZip: filename.toLowerCase().endsWith(".zip") });
      setStatus("done");
      analytics.toolUsed("pdf-to-jpg", performance.now() - t0);
    } catch (e) {
      setErrorMsg(e instanceof ApiError && e.status === 429 ? t("rateLimited") : e instanceof Error ? e.message : undefined);
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
        <FileDropzone accept="pdf" maxSizeMB={maxMB} onFiles={onFiles} />
        {errorMsg && <div className="mt-4"><ErrorBanner message={errorMsg} onRetry={() => setErrorMsg(undefined)} /></div>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <FileInfoBar file={file} pages={pages} onRemove={reset} />
      <div className="flex justify-end">
        <button type="button" className="pp-btn pp-btn-lg min-w-[170px] justify-center" onClick={run} disabled={status === "uploading"}>
          {status === "uploading" ? <><Spinner /> {t("processing")}</> : <>{tp("action")} <IconArrow size={15} /></>}
        </button>
      </div>

      {status === "uploading" && <CloudProgress />}

      {status === "error" && <ErrorBanner message={errorMsg} note={t("cloudDeletedNote")} onRetry={() => { setStatus("idle"); setErrorMsg(undefined); }} />}
    </div>
  );
}
