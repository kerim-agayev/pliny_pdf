"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { FileDropzone } from "./FileDropzone";
import { SuccessPanel, ErrorBanner } from "./ResultPanels";
import { Spinner } from "./Spinner";
import { IconArrow, IconFile, IconX } from "@/components/shared/icons";
import { postFile, ApiError } from "@/lib/api";
import { formatBytes, downloadBlob, baseName } from "@/lib/format";
import { analytics } from "@/lib/analytics";
import { useSession } from "@/lib/auth/client";
import { officeMaxMB } from "@/lib/limits";

type Status = "idle" | "uploading" | "done" | "error";

// After this many seconds, swap to a stronger "still working" reassurance (Wave 3H).
const PATIENCE_THRESHOLD = 45;

/** mm:ss elapsed label. */
function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * Shared client for the two Gotenberg-backed cloud tools (PDF↔Word). Uploads a
 * single file to the backend, streams the converted result back, offers download.
 */
export function CloudConvertTool({
  namespace,
  accept,
  endpoint,
  outExt,
}: {
  namespace: string;
  accept: "pdf" | "word";
  endpoint: string;
  outExt: string;
}) {
  const t = useTranslations("ToolUI");
  const tp = useTranslations(namespace);
  const { data: session } = useSession();
  const maxMB = officeMaxMB((session?.user as { plan?: "free" | "pro" })?.plan ?? null);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<{ blob: Blob; name: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>();
  // Seconds spent converting — drives a live timer + patience message (Wave 3H),
  // so users know a long conversion is progressing, not stuck.
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (status !== "uploading") {
      setElapsed(0);
      return;
    }
    const startedAt = performance.now();
    const id = setInterval(() => setElapsed(Math.floor((performance.now() - startedAt) / 1000)), 1000);
    return () => clearInterval(id);
  }, [status]);

  function onFiles(files: File[]) {
    setErrorMsg(undefined);
    setFile(files[0] ?? null);
    if (status === "done" || status === "error") {
      setStatus("idle");
      setResult(null);
    }
  }

  async function start() {
    if (!file) return;
    setStatus("uploading");
    setErrorMsg(undefined);
    const t0 = performance.now();
    try {
      const blob = await postFile(endpoint, file);
      setResult({ blob, name: `${baseName(file.name)}${outExt}` });
      setStatus("done");
      analytics.toolUsed(endpoint.includes("pdf-to-word") ? "pdf-to-word" : "word-to-pdf", performance.now() - t0);
    } catch (e) {
      if (e instanceof ApiError && e.status === 429) {
        setErrorMsg(t("rateLimited"));
      } else {
        setErrorMsg(e instanceof Error ? e.message : undefined);
      }
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
        meta={`${result.name} · ${formatBytes(result.blob.size)}`}
        onDownload={() => downloadBlob(result.blob, result.name)}
        onReset={reset}
      />
    );
  }

  return (
    <div>
      <FileDropzone
        accept={accept}
        toolId={endpoint.includes("pdf-to-word") ? "pdf-to-word" : "word-to-pdf"}
        maxSizeMB={maxMB}
        onFiles={onFiles}
        title={accept === "word" ? t("dropWordTitle") : undefined}
      />

      {errorMsg && (
        <div className="mt-4">
          <ErrorBanner
            message={errorMsg}
            note={t("cloudDeletedNote")}
            onRetry={() => {
              setStatus("idle");
              setErrorMsg(undefined);
            }}
          />
        </div>
      )}

      {file && status !== "done" && (
        <div className="mt-7">
          <div className="pp-filerow">
            <div
              className="flex h-11 w-9 shrink-0 items-center justify-center rounded"
              style={{ background: "rgba(96,165,250,0.14)", border: "1px solid rgba(96,165,250,0.35)", color: "#60A5FA" }}
            >
              <IconFile size={18} sw={1.7} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium" style={{ color: "var(--text)" }}>{file.name}</div>
              <div className="pp-mono mt-0.5 text-[11.5px]" style={{ color: "var(--text-3)" }}>
                {formatBytes(file.size)}
              </div>
            </div>
            {status !== "uploading" && (
              <button
                type="button"
                onClick={reset}
                className="flex size-[30px] items-center justify-center rounded-lg"
                style={{ border: "1px solid var(--line)", color: "var(--text-2)" }}
                aria-label={t("clear")}
              >
                <IconX size={14} />
              </button>
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-end gap-2.5">
            {status !== "uploading" && (
              <button type="button" className="pp-btn pp-btn-ghost pp-btn-lg" onClick={reset}>
                {t("clear")}
              </button>
            )}
            {status === "uploading" ? (
              <button type="button" className="pp-btn pp-btn-lg min-w-[180px] justify-center" disabled>
                <Spinner /> {t("converting")}
              </button>
            ) : (
              <button
                type="button"
                className="pp-btn pp-btn-lg min-w-[180px] justify-center"
                onClick={start}
              >
                {tp("action")} <IconArrow size={15} />
              </button>
            )}
          </div>

          {status === "uploading" && (
            <div
              className="mt-4 rounded-xl p-4"
              style={{ background: "var(--bg-2)", border: "1px solid var(--line)" }}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="text-[13px]" style={{ color: "var(--text)" }}>{t("cloudProcessing")}</div>
                <span className="pp-mono text-[12px]" style={{ color: "var(--text-3)" }}>{formatElapsed(elapsed)}</span>
              </div>
              <div className="pp-progress mt-3" data-indeterminate><span /></div>
              <div className="mt-2.5 text-[12px] leading-relaxed" style={{ color: "var(--text-2)" }}>
                {elapsed >= PATIENCE_THRESHOLD ? t("cloudPatienceLong") : t("cloudPatience")}
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-xs" style={{ color: "var(--text-3)" }}>
                <span className="pp-dot" style={{ color: "#60A5FA" }} /> {t("cloudNote")}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
