"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { FileDropzone } from "./FileDropzone";
import { FileInfoBar } from "./FileInfoBar";
import { SuccessPanel, ErrorBanner } from "./ResultPanels";
import { Spinner } from "./Spinner";
import { IconArrow, IconEye } from "@/components/shared/icons";
import { removePassword } from "@/lib/pdf/password";
import { isPdf } from "@/lib/pdf/common";
import { downloadBlob, baseName } from "@/lib/format";
import { analytics } from "@/lib/analytics";

type Status = "idle" | "processing" | "done" | "error";

export function UnlockTool() {
  const t = useTranslations("ToolUI");
  const tp = useTranslations("ToolPages.unlock");
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
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
  }

  async function run() {
    if (!file || !password) return;
    setStatus("processing");
    setErrorMsg(undefined);
    try {
      setResult(await removePassword(file, password));
      setStatus("done");
      analytics.toolUsed("remove-password");
    } catch {
      setStatus("error");
      setErrorMsg(tp("wrongPassword"));
    }
  }

  function reset() {
    setFile(null);
    setResult(null);
    setPassword("");
    setStatus("idle");
    setErrorMsg(undefined);
  }

  if (status === "done" && result) {
    return (
      <SuccessPanel
        title={tp("successTitle")}
        meta={`${baseName(file!.name)}-unlocked.pdf`}
        onDownload={() => downloadBlob(result, `${baseName(file!.name)}-unlocked.pdf`)}
        onReset={reset}
      />
    );
  }

  if (!file) {
    return (
      <div>
        <FileDropzone accept="pdf" onFiles={onFiles} disablePasswordPrompt />
        {errorMsg && <div className="mt-4"><ErrorBanner message={errorMsg} onRetry={() => setErrorMsg(undefined)} /></div>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <FileInfoBar file={file} onRemove={reset} />

      <label className="flex flex-col gap-1.5">
        <span className="pp-mono text-[11px] uppercase tracking-[0.06em]" style={{ color: "var(--text-3)" }}>{tp("password")}</span>
        <div className="relative">
          <input
            className="pp-input pr-10"
            type={show ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && run()}
          />
          <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-2.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-3)" }} aria-label="Toggle">
            <IconEye size={16} />
          </button>
        </div>
      </label>

      {status === "error" && errorMsg && (
        <span className="text-[12.5px]" style={{ color: "#FDA4AF" }}>{errorMsg}</span>
      )}

      <div className="flex justify-end">
        <button type="button" className="pp-btn pp-btn-lg min-w-[160px] justify-center" onClick={run} disabled={!password || status === "processing"}>
          {status === "processing" ? <><Spinner /> {t("processing")}</> : <>{tp("action")} <IconArrow size={15} /></>}
        </button>
      </div>
    </div>
  );
}
