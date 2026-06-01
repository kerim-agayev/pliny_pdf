"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { FileDropzone } from "./FileDropzone";
import { FileInfoBar } from "./FileInfoBar";
import { SuccessPanel, ErrorBanner } from "./ResultPanels";
import { Spinner } from "./Spinner";
import { IconArrow, IconTrash, IconX } from "@/components/shared/icons";
import { deletePages } from "@/lib/pdf/delete";
import { renderThumbnails, type Thumb } from "@/lib/pdf/thumbnails";
import { isPdf } from "@/lib/pdf/common";
import { downloadBlob, baseName, MAX_FILE_BYTES } from "@/lib/format";
import { analytics } from "@/lib/analytics";

type Status = "idle" | "loading" | "ready" | "processing" | "done" | "error";

export function DeletePages() {
  const t = useTranslations("ToolUI");
  const tp = useTranslations("ToolPages.deletePages");
  const [file, setFile] = useState<File | null>(null);
  const [thumbs, setThumbs] = useState<Thumb[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
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
      const th = await renderThumbnails(f);
      setThumbs(th);
      setSelected(new Set());
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }

  function toggleSelect(i: number, multi: boolean) {
    setSelected((prev) => {
      const next = new Set(multi ? prev : prev.has(i) && prev.size === 1 ? [] : prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  async function run() {
    if (!file || selected.size === 0 || selected.size >= thumbs.length) return;
    setStatus("processing");
    try {
      setResult(await deletePages(file, selected));
      setStatus("done");
      analytics.toolUsed("delete-pages");
    } catch {
      setStatus("error");
    }
  }

  function reset() {
    setFile(null);
    setThumbs([]);
    setSelected(new Set());
    setResult(null);
    setStatus("idle");
    setErrorMsg(undefined);
  }

  if (status === "done" && result) {
    return (
      <SuccessPanel
        title={tp("successTitle")}
        meta={`${baseName(file!.name)}-pages-deleted.pdf`}
        onDownload={() => downloadBlob(result, `${baseName(file!.name)}-pages-deleted.pdf`)}
        onReset={reset}
      />
    );
  }

  if (!file) {
    return (
      <div>
        <FileDropzone accept="pdf" onFiles={onFiles} />
        {errorMsg && (
          <div className="mt-4">
            <ErrorBanner message={errorMsg} onRetry={() => setErrorMsg(undefined)} />
          </div>
        )}
      </div>
    );
  }

  const allSelected = thumbs.length > 0 && selected.size >= thumbs.length;

  return (
    <div className="flex flex-col gap-5">
      <FileInfoBar file={file} pages={thumbs.length || undefined} onRemove={reset} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-[12.5px]" style={{ color: "var(--text-3)" }}>
          {tp("selectHint")}
        </span>
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
            const isSel = selected.has(i);
            return (
              <button
                key={i}
                type="button"
                onClick={(e) => toggleSelect(i, e.ctrlKey || e.metaKey)}
                className="group relative flex flex-col items-center gap-1.5 rounded-lg p-2 transition-colors"
                style={{ border: `1px solid ${isSel ? "#F43F5E" : "var(--line)"}`, background: isSel ? "rgba(244,63,94,0.10)" : "var(--card)" }}
              >
                {isSel && (
                  <span
                    className="absolute right-1.5 top-1.5 z-10 flex size-4 items-center justify-center rounded-full"
                    style={{ background: "#F43F5E", color: "#fff" }}
                  >
                    <IconX size={10} sw={3} />
                  </span>
                )}
                <img
                  src={th.url}
                  alt={`page ${i + 1}`}
                  className="max-h-[150px] w-auto rounded shadow-sm transition-opacity"
                  style={{ opacity: isSel ? 0.5 : 1 }}
                  draggable={false}
                />
                <span className="pp-mono text-[11px]" style={{ color: "var(--text-3)" }}>{i + 1}</span>
              </button>
            );
          })}
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 text-[12.5px]" style={{ color: "var(--text-3)" }}>
          <IconTrash size={14} /> {selected.size}
        </div>
        <button
          type="button"
          className="pp-btn pp-btn-lg min-w-[160px] justify-center"
          onClick={run}
          disabled={status === "processing" || selected.size === 0 || allSelected}
        >
          {status === "processing" ? (
            <><Spinner /> {t("processing")}</>
          ) : (
            <>{tp("action", { count: selected.size })} <IconArrow size={15} /></>
          )}
        </button>
      </div>

      {allSelected && (
        <p className="text-[12.5px]" style={{ color: "#FDA4AF" }}>{tp("allSelected")}</p>
      )}

      {status === "error" && <ErrorBanner onRetry={() => setStatus("ready")} />}
    </div>
  );
}
