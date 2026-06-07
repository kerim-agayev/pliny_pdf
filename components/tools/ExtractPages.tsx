"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { FileDropzone } from "./FileDropzone";
import { FileInfoBar } from "./FileInfoBar";
import { SuccessPanel, ErrorBanner } from "./ResultPanels";
import { Spinner } from "./Spinner";
import { IconArrow, IconExtract, IconCheck } from "@/components/shared/icons";
import { extractPages, parsePageRanges } from "@/lib/pdf/extract";
import { renderThumbnails, type Thumb } from "@/lib/pdf/thumbnails";
import { isPdf } from "@/lib/pdf/common";
import { downloadBlob, baseName, MAX_FILE_BYTES } from "@/lib/format";
import { analytics } from "@/lib/analytics";

type Status = "idle" | "loading" | "ready" | "processing" | "done" | "error";

export function ExtractPages() {
  const t = useTranslations("ToolUI");
  const tp = useTranslations("ToolPages.extractPages");
  const [file, setFile] = useState<File | null>(null);
  const [thumbs, setThumbs] = useState<Thumb[]>([]);
  const [range, setRange] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<Blob | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>();

  const indices = useMemo(
    () => (thumbs.length ? parsePageRanges(range, thumbs.length) : []),
    [range, thumbs.length],
  );
  const selectedSet = useMemo(() => new Set(indices), [indices]);
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
      const th = await renderThumbnails(f);
      setThumbs(th);
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
    setThumbs([]);
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
      <FileInfoBar file={file} pages={thumbs.length || undefined} onRemove={reset} />

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
        {invalid && thumbs.length > 0 && (
          <span className="text-[12px]" style={{ color: "#FDA4AF" }}>
            {tp("invalidRange", { count: thumbs.length })}
          </span>
        )}
      </div>

      {status === "loading" ? (
        <div className="flex items-center justify-center gap-2 py-16" style={{ color: "var(--text-3)" }}>
          <Spinner size={18} /> {t("processing")}
        </div>
      ) : (
        <div
          className="grid max-h-[60vh] gap-3 overflow-auto rounded-xl p-4"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", background: "var(--bg-2)", border: "1px solid var(--line)" }}
        >
          {thumbs.map((th, i) => {
            const isSel = selectedSet.has(i);
            return (
              <div
                key={i}
                className="relative flex flex-col items-center gap-1.5 rounded-lg p-2 transition-colors"
                style={{ border: `1px solid ${isSel ? "var(--indigo)" : "var(--line)"}`, background: isSel ? "var(--indigo-dim)" : "var(--card)" }}
              >
                {isSel && (
                  <span
                    className="absolute right-1.5 top-1.5 z-10 flex size-4 items-center justify-center rounded-full"
                    style={{ background: "var(--indigo)", color: "#fff" }}
                  >
                    <IconCheck size={10} sw={3} />
                  </span>
                )}
                <img
                  src={th.url}
                  alt={`page ${i + 1}`}
                  className="max-h-[150px] w-auto rounded shadow-sm transition-opacity"
                  style={{ opacity: isSel ? 1 : 0.45 }}
                  draggable={false}
                />
                <span className="pp-mono text-[11px]" style={{ color: "var(--text-3)" }}>{i + 1}</span>
              </div>
            );
          })}
        </div>
      )}

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
