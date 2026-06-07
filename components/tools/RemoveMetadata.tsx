"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { FileDropzone } from "./FileDropzone";
import { FileInfoBar } from "./FileInfoBar";
import { SuccessPanel, ErrorBanner } from "./ResultPanels";
import { Spinner } from "./Spinner";
import { IconTagOff, IconShield } from "@/components/shared/icons";
import { readMetadata, removeMetadata, META_FIELDS, type PdfMeta } from "@/lib/pdf/metadata";
import { isPdf } from "@/lib/pdf/common";
import { downloadBlob, baseName, MAX_FILE_BYTES } from "@/lib/format";
import { analytics } from "@/lib/analytics";

type Status = "idle" | "loading" | "ready" | "processing" | "done" | "error";

export function RemoveMetadata() {
  const t = useTranslations("ToolUI");
  const tp = useTranslations("ToolPages.removeMetadata");
  const [file, setFile] = useState<File | null>(null);
  const [meta, setMeta] = useState<PdfMeta | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<Blob | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>();

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
    setStatus("loading");
    try {
      setMeta(await readMetadata(f));
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }

  async function run() {
    if (!file) return;
    setStatus("processing");
    try {
      setResult(await removeMetadata(file));
      setStatus("done");
      analytics.toolUsed("remove-metadata");
    } catch {
      setStatus("error");
    }
  }

  function reset() {
    setFile(null);
    setMeta(null);
    setResult(null);
    setStatus("idle");
    setErrorMsg(undefined);
  }

  if (status === "done" && result) {
    return (
      <SuccessPanel
        title={tp("successTitle")}
        meta={`${baseName(file!.name)}-clean.pdf`}
        onDownload={() => downloadBlob(result, `${baseName(file!.name)}-clean.pdf`)}
        onReset={reset}
      />
    );
  }

  if (!file) {
    return (
      <div>
        <FileDropzone accept="pdf" checkPages onFiles={onFiles} title={tp("emptyTitle")} />
        {errorMsg && <div className="mt-4"><ErrorBanner message={errorMsg} onRetry={() => setErrorMsg(undefined)} /></div>}
      </div>
    );
  }

  const present = meta ? META_FIELDS.filter((k) => meta[k]?.trim()) : [];

  return (
    <div className="flex flex-col gap-5">
      <FileInfoBar file={file} onRemove={reset} />

      <div className="pp-card" style={{ padding: 24 }}>
        <h3 className="mb-4 text-[15px] tracking-[-0.015em]">{tp("currentTitle")}</h3>
        {status === "loading" ? (
          <div className="flex items-center gap-2 py-6" style={{ color: "var(--text-3)" }}><Spinner size={16} /> {t("processing")}</div>
        ) : present.length === 0 ? (
          <p className="text-[13.5px]" style={{ color: "var(--text-3)" }}>{tp("none")}</p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {present.map((k) => (
              <div key={k} className="flex gap-3 text-[13.5px]">
                <span className="pp-mono w-20 shrink-0 text-[12px]" style={{ color: "var(--text-3)" }}>{tp(`field_${k}`)}</span>
                <span className="min-w-0 break-words" style={{ color: "var(--text)" }}>{meta![k]}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 rounded-[14px] p-[18px]" style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.18)" }}>
        <IconShield size={15} color="#34D399" sw={1.7} />
        <p className="text-[12.5px]" style={{ color: "var(--text-2)" }}>{tp("note")}</p>
      </div>

      <button type="button" className="pp-btn pp-btn-lg justify-center" onClick={run} disabled={status === "processing"}>
        {status === "processing" ? <><Spinner /> {t("processing")}</> : <><IconTagOff size={15} sw={1.7} /> {tp("action")}</>}
      </button>

      {status === "error" && <ErrorBanner onRetry={() => setStatus("ready")} />}
    </div>
  );
}
