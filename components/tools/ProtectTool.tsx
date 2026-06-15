"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { FileDropzone } from "./FileDropzone";
import { FileInfoBar } from "./FileInfoBar";
import { SuccessPanel, ErrorBanner } from "./ResultPanels";
import { Spinner } from "./Spinner";
import { IconArrow, IconEye } from "@/components/shared/icons";
import { protectPdf } from "@/lib/pdf/password";
import { readPageCount, isPdf } from "@/lib/pdf/common";
import { downloadBlob, baseName } from "@/lib/format";
import { analytics } from "@/lib/analytics";

type Status = "idle" | "processing" | "done" | "error";

export function ProtectTool() {
  const t = useTranslations("ToolUI");
  const tp = useTranslations("ToolPages.protect");
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState(0);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<Blob | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>();

  const mismatch = confirm.length > 0 && password !== confirm;
  const canRun = file && password.length > 0 && password === confirm;

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
    if (!file || !canRun) return;
    setStatus("processing");
    try {
      setResult(await protectPdf(file, password));
      setStatus("done");
      analytics.toolUsed("password-protect");
    } catch {
      setStatus("error");
    }
  }

  function reset() {
    setFile(null);
    setResult(null);
    setPassword("");
    setConfirm("");
    setStatus("idle");
    setErrorMsg(undefined);
  }

  if (status === "done" && result) {
    return (
      <SuccessPanel
        title={tp("successTitle")}
        meta={`${baseName(file!.name)}-protected.pdf`}
        onDownload={() => downloadBlob(result, `${baseName(file!.name)}-protected.pdf`)}
        onReset={reset}
      />
    );
  }

  if (!file) {
    return (
      <div>
        <FileDropzone toolId="protect" accept="pdf" checkPages onFiles={onFiles} disablePasswordPrompt />
        {errorMsg && <div className="mt-4"><ErrorBanner message={errorMsg} onRetry={() => setErrorMsg(undefined)} /></div>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <FileInfoBar file={file} pages={pages} onRemove={reset} />

      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="pp-mono text-[11px] uppercase tracking-[0.06em]" style={{ color: "var(--text-3)" }}>{tp("password")}</span>
          <div className="relative">
            <input className="pp-input pr-10" type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} />
            <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-2.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-3)" }} aria-label="Toggle">
              <IconEye size={16} />
            </button>
          </div>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="pp-mono text-[11px] uppercase tracking-[0.06em]" style={{ color: "var(--text-3)" }}>{tp("confirm")}</span>
          <input className="pp-input" type={show ? "text" : "password"} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </label>
        {mismatch && <span className="text-[12.5px]" style={{ color: "#FDA4AF" }}>{tp("mismatch")}</span>}
      </div>

      <div className="flex justify-end">
        <button type="button" className="pp-btn pp-btn-lg min-w-[160px] justify-center" onClick={run} disabled={!canRun || status === "processing"}>
          {status === "processing" ? <><Spinner /> {t("processing")}</> : <>{tp("action")} <IconArrow size={15} /></>}
        </button>
      </div>

      {status === "error" && <ErrorBanner onRetry={() => setStatus("idle")} />}
    </div>
  );
}
