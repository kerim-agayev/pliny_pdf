"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { FileDropzone } from "./FileDropzone";
import { FileInfoBar } from "./FileInfoBar";
import { SuccessPanel, ErrorBanner } from "./ResultPanels";
import { CloudProgress } from "./CloudProgress";
import { Spinner } from "./Spinner";
import { IconGrayscale } from "@/components/shared/icons";
import { isPdf } from "@/lib/pdf/common";
import { postBinary, ApiError } from "@/lib/api";
import { downloadBlob, baseName } from "@/lib/format";
import { analytics } from "@/lib/analytics";
import { useSession } from "@/lib/auth/client";
import { cloudMaxMB } from "@/lib/limits";

type Status = "idle" | "uploading" | "done" | "error";

export function GrayscalePdf() {
  const t = useTranslations("ToolUI");
  const tp = useTranslations("ToolPages.grayscalePdf");
  const { data: session } = useSession();
  const maxMB = cloudMaxMB((session?.user as { plan?: "free" | "pro" })?.plan ?? null);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<Blob | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>();

  function onFiles(files: File[]) {
    const f = files[0];
    if (!f || !isPdf(f)) {
      setErrorMsg(t("wrongTypePdf"));
      return;
    }
    setErrorMsg(undefined);
    setFile(f);
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
      const { blob } = await postBinary("/api/tools/grayscale", [file], `${baseName(file.name)}-grayscale.pdf`);
      setResult(blob);
      setStatus("done");
      analytics.toolUsed("grayscale-pdf", performance.now() - t0);
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
        meta={`${baseName(file!.name)}-grayscale.pdf`}
        onDownload={() => downloadBlob(result, `${baseName(file!.name)}-grayscale.pdf`)}
        onReset={reset}
      />
    );
  }

  if (!file) {
    return (
      <div>
        <FileDropzone accept="pdf" maxSizeMB={maxMB} onFiles={onFiles} title={tp("emptyTitle")} />
        {errorMsg && <div className="mt-4"><ErrorBanner message={errorMsg} onRetry={() => setErrorMsg(undefined)} /></div>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <FileInfoBar file={file} onRemove={reset} />

      <button type="button" className="pp-btn pp-btn-lg justify-center" onClick={run} disabled={status === "uploading"}>
        {status === "uploading" ? <><Spinner /> {t("converting")}</> : <><IconGrayscale size={15} sw={1.7} /> {tp("action")}</>}
      </button>

      {status === "uploading" && <CloudProgress accent="#F472B6" />}

      {status === "error" && <ErrorBanner message={errorMsg} note={t("cloudDeletedNote")} onRetry={() => { setStatus("idle"); setErrorMsg(undefined); }} />}
    </div>
  );
}
