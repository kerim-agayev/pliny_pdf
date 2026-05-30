"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { FileDropzone } from "./FileDropzone";
import { SuccessPanel, ErrorBanner } from "./ResultPanels";
import { Spinner } from "./Spinner";
import { IconArrow, IconX, IconImage } from "@/components/shared/icons";
import { jpgToPdf } from "@/lib/pdf/jpgToPdf";
import { isImage } from "@/lib/pdf/common";
import { downloadBlob, formatBytes } from "@/lib/format";

type Status = "idle" | "processing" | "done" | "error";

export function JpgToPdfTool() {
  const t = useTranslations("ToolUI");
  const tp = useTranslations("ToolPages.jpgToPdf");
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<Blob | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>();

  function addFiles(incoming: File[]) {
    const imgs = incoming.filter(isImage);
    if (imgs.length !== incoming.length) setErrorMsg(t("wrongTypeImage"));
    else setErrorMsg(undefined);
    setFiles((prev) => [...prev, ...imgs]);
  }

  async function run() {
    if (!files.length) return;
    setStatus("processing");
    try {
      setResult(await jpgToPdf(files));
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  function reset() {
    setFiles([]);
    setResult(null);
    setStatus("idle");
    setErrorMsg(undefined);
  }

  if (status === "done" && result) {
    return (
      <SuccessPanel
        title={tp("successTitle")}
        meta={`combined.pdf · ${formatBytes(result.size)}`}
        onDownload={() => downloadBlob(result, "combined.pdf")}
        onReset={reset}
      />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <FileDropzone accept="image" multiple onFiles={addFiles} />
      {errorMsg && <ErrorBanner message={errorMsg} onRetry={() => setErrorMsg(undefined)} />}

      {files.length > 0 && (
        <>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {files.map((f, i) => (
              <div key={i} className="group relative aspect-[3/4] overflow-hidden rounded-lg" style={{ border: "1px solid var(--line)", background: "var(--bg-2)" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={URL.createObjectURL(f)} alt={f.name} className="size-full object-cover" />
                <button
                  type="button"
                  onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                  className="absolute right-1.5 top-1.5 flex size-6 items-center justify-center rounded-md"
                  style={{ background: "rgba(0,0,0,0.6)", color: "#fff" }}
                  aria-label="Remove"
                >
                  <IconX size={13} />
                </button>
                <div className="pp-mono absolute bottom-1 left-1.5 flex items-center gap-1 text-[10px]" style={{ color: "#fff", textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}>
                  <IconImage size={10} /> {i + 1}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2.5">
            <button type="button" className="pp-btn pp-btn-ghost pp-btn-lg" onClick={reset}>{t("clear")}</button>
            <button type="button" className="pp-btn pp-btn-lg min-w-[160px] justify-center" onClick={run} disabled={status === "processing"}>
              {status === "processing" ? <><Spinner /> {t("processing")}</> : <>{tp("action")} <IconArrow size={15} /></>}
            </button>
          </div>
        </>
      )}

      {status === "error" && <ErrorBanner onRetry={() => setStatus("idle")} />}
    </div>
  );
}
