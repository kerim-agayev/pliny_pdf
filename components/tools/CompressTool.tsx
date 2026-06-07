"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { FileDropzone } from "./FileDropzone";
import { FileInfoBar } from "./FileInfoBar";
import { SuccessPanel, ErrorBanner } from "./ResultPanels";
import { CloudProgress } from "./CloudProgress";
import { Spinner } from "./Spinner";
import { IconArrow } from "@/components/shared/icons";
import { readPageCount, isPdf } from "@/lib/pdf/common";
import { postBinary, ApiError } from "@/lib/api";
import { formatBytes, downloadBlob, baseName } from "@/lib/format";
import { analytics } from "@/lib/analytics";
import { useSession } from "@/lib/auth/client";
import { cloudMaxMB } from "@/lib/limits";

type Status = "idle" | "uploading" | "done" | "error";

export function CompressTool() {
  const t = useTranslations("ToolUI");
  const tp = useTranslations("ToolPages.compress");
  const { data: session } = useSession();
  const maxMB = cloudMaxMB((session?.user as { plan?: "free" | "pro" })?.plan ?? null);
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState(0);
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<{ blob: Blob; originalSize: number; newSize: number; changed: boolean } | null>(null);
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
      const { blob } = await postBinary("/api/tools/compress", [file], `${baseName(file.name)}-compressed.pdf`);
      const changed = blob.size < file.size;
      setResult({ blob, originalSize: file.size, newSize: blob.size, changed });
      setStatus("done");
      if (changed) toast.success(`${formatBytes(file.size)} → ${formatBytes(blob.size)}`);
      analytics.toolUsed("compress-pdf", performance.now() - t0);
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
        quietToast
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

      {status === "uploading" && <CloudProgress accent="#F472B6" />}

      {status === "error" && <ErrorBanner message={errorMsg} note={t("cloudDeletedNote")} onRetry={() => { setStatus("idle"); setErrorMsg(undefined); }} />}
    </div>
  );
}
