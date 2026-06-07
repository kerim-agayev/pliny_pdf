"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { FileDropzone } from "./FileDropzone";
import { FileInfoBar } from "./FileInfoBar";
import { SuccessPanel, ErrorBanner } from "./ResultPanels";
import { Spinner } from "./Spinner";
import { IconArrow, IconExtract } from "@/components/shared/icons";
import { extractPages, parsePageRanges } from "@/lib/pdf/extract";
import { isPdf, readPageCount } from "@/lib/pdf/common";
import { downloadBlob, baseName, MAX_FILE_BYTES } from "@/lib/format";
import { analytics } from "@/lib/analytics";

type Status = "idle" | "loading" | "ready" | "processing" | "done" | "error";

export function ExtractPages() {
  const t = useTranslations("ToolUI");
  const tp = useTranslations("ToolPages.extractPages");
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [range, setRange] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<Blob | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>();

  const indices = useMemo(
    () => (pageCount ? parsePageRanges(range, pageCount) : []),
    [range, pageCount],
  );
  const invalid = range.trim() !== "" && indices.length === 0;

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
      setPageCount(await readPageCount(f));
      setRange("");
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }

  async function run() {
    if (!file || indices.length === 0) return;
    setStatus("processing");
    try {
      setResult(await extractPages(file, indices));
      setStatus("done");
      analytics.toolUsed("extract-pages");
    } catch {
      setStatus("error");
    }
  }

  function reset() {
    setFile(null);
    setPageCount(0);
    setRange("");
    setResult(null);
    setStatus("idle");
    setErrorMsg(undefined);
  }

  if (status === "done" && result) {
    return (
      <SuccessPanel
        title={tp("successTitle")}
        meta={`${baseName(file!.name)}-extracted.pdf`}
        onDownload={() => downloadBlob(result, `${baseName(file!.name)}-extracted.pdf`)}
        onReset={reset}
      />
    );
  }

  if (!file) {
    return (
      <div>
        <FileDropzone accept="pdf" checkPages onFiles={onFiles} />
        {errorMsg && (
          <div className="mt-4">
            <ErrorBanner message={errorMsg} onRetry={() => setErrorMsg(undefined)} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <FileInfoBar file={file} pages={pageCount || undefined} onRemove={reset} />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="extract-range" className="text-[13px] font-medium" style={{ color: "var(--text)" }}>
          {tp("rangeLabel")}
        </label>
        <input
          id="extract-range"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={range}
          onChange={(e) => setRange(e.target.value)}
          placeholder={tp("rangePlaceholder")}
          className="pp-input pp-mono"
          style={{ borderColor: invalid ? "#F43F5E" : undefined }}
        />
        {invalid && pageCount > 0 ? (
          <span className="text-[12px]" style={{ color: "#FDA4AF" }}>
            {tp("invalidRange", { count: pageCount })}
          </span>
        ) : (
          pageCount > 0 && (
            <span className="text-[12px]" style={{ color: "var(--text-3)" }}>
              {tp("ofPages", { count: pageCount })}
            </span>
          )
        )}
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 text-[12.5px]" style={{ color: "var(--text-3)" }}>
          <IconExtract size={14} /> {indices.length}
        </div>
        <button
          type="button"
          className="pp-btn pp-btn-lg min-w-[160px] justify-center"
          onClick={run}
          disabled={status === "processing" || indices.length === 0}
        >
          {status === "processing" ? (
            <><Spinner /> {t("processing")}</>
          ) : (
            <>{tp("action", { count: indices.length })} <IconArrow size={15} /></>
          )}
        </button>
      </div>

      {status === "error" && <ErrorBanner onRetry={() => setStatus("ready")} />}
    </div>
  );
}
