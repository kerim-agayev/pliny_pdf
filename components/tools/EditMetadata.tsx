"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { FileDropzone } from "./FileDropzone";
import { FileInfoBar } from "./FileInfoBar";
import { SuccessPanel, ErrorBanner } from "./ResultPanels";
import { Spinner } from "./Spinner";
import { IconCheck } from "@/components/shared/icons";
import { readMetadata, setMetadata, META_FIELDS, type PdfMeta } from "@/lib/pdf/metadata";
import { isPdf } from "@/lib/pdf/common";
import { downloadBlob, baseName, MAX_FILE_BYTES } from "@/lib/format";
import { analytics } from "@/lib/analytics";

type Status = "idle" | "loading" | "ready" | "processing" | "done" | "error";
const EMPTY: PdfMeta = { title: "", author: "", subject: "", keywords: "", creator: "", producer: "" };

export function EditMetadata() {
  const t = useTranslations("ToolUI");
  const tp = useTranslations("ToolPages.editMetadata");
  const [file, setFile] = useState<File | null>(null);
  const [meta, setMeta] = useState<PdfMeta>(EMPTY);
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
      setResult(await setMetadata(file, meta));
      setStatus("done");
      analytics.toolUsed("edit-metadata");
    } catch {
      setStatus("error");
    }
  }

  function reset() {
    setFile(null);
    setMeta(EMPTY);
    setResult(null);
    setStatus("idle");
    setErrorMsg(undefined);
  }

  if (status === "done" && result) {
    return (
      <SuccessPanel
        title={tp("successTitle")}
        meta={`${baseName(file!.name)}-edited.pdf`}
        onDownload={() => downloadBlob(result, `${baseName(file!.name)}-edited.pdf`)}
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

  return (
    <div className="flex flex-col gap-5">
      <FileInfoBar file={file} onRemove={reset} />

      {status === "loading" ? (
        <div className="flex items-center gap-2 py-10" style={{ color: "var(--text-3)" }}><Spinner size={16} /> {t("processing")}</div>
      ) : (
        <div className="pp-card flex flex-col gap-4" style={{ padding: 24 }}>
          {META_FIELDS.map((k) => (
            <div key={k}>
              <label className="mb-1.5 block text-[13px] font-medium" htmlFor={`meta-${k}`}>{tp(`field_${k}`)}</label>
              {k === "subject" ? (
                <textarea
                  id={`meta-${k}`}
                  className="pp-input"
                  rows={2}
                  value={meta[k]}
                  onChange={(e) => setMeta((m) => ({ ...m, [k]: e.target.value }))}
                />
              ) : (
                <input
                  id={`meta-${k}`}
                  className="pp-input"
                  value={meta[k]}
                  onChange={(e) => setMeta((m) => ({ ...m, [k]: e.target.value }))}
                />
              )}
              {k === "keywords" && <p className="mt-1 text-[12px]" style={{ color: "var(--text-3)" }}>{tp("keywordsHint")}</p>}
            </div>
          ))}
        </div>
      )}

      <button type="button" className="pp-btn pp-btn-lg justify-center" onClick={run} disabled={status === "processing" || status === "loading"}>
        {status === "processing" ? <><Spinner /> {t("processing")}</> : <><IconCheck size={15} sw={2} /> {tp("action")}</>}
      </button>

      {status === "error" && <ErrorBanner onRetry={() => setStatus("ready")} />}
    </div>
  );
}
