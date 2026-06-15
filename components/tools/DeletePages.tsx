"use client";

import { useCallback, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { FileDropzone } from "./FileDropzone";
import { FileInfoBar } from "./FileInfoBar";
import { SuccessPanel, ErrorBanner } from "./ResultPanels";
import { Spinner } from "./Spinner";
import { LazyThumb } from "./LazyThumb";
import { IconArrow, IconTrash, IconX } from "@/components/shared/icons";
import { deletePages } from "@/lib/pdf/delete";
import { createThumbLoader, type ThumbLoader } from "@/lib/pdf/thumbnailLoader";
import { isPdf } from "@/lib/pdf/common";
import { downloadBlob, baseName, MAX_FILE_BYTES } from "@/lib/format";
import { analytics } from "@/lib/analytics";

type Status = "idle" | "loading" | "ready" | "processing" | "done" | "error";

export function DeletePages() {
  const t = useTranslations("ToolUI");
  const tp = useTranslations("ToolPages.deletePages");
  const [file, setFile] = useState<File | null>(null);
  const loaderRef = useRef<ThumbLoader | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<Blob | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>();

  const loadPage = useCallback((i: number) => loaderRef.current!.renderPage(i, 0.4), []);

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
    loaderRef.current?.destroy();
    const loader = createThumbLoader(f);
    loaderRef.current = loader;
    try {
      setPageCount(await loader.pageCount());
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
    if (!file || selected.size === 0 || selected.size >= pageCount) return;
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
    loaderRef.current?.destroy();
    loaderRef.current = null;
    setFile(null);
    setPageCount(0);
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
        <FileDropzone toolId="delete-pages" accept="pdf" checkPages onFiles={onFiles} />
        {errorMsg && (
          <div className="mt-4">
            <ErrorBanner message={errorMsg} onRetry={() => setErrorMsg(undefined)} />
          </div>
        )}
      </div>
    );
  }

  const allSelected = pageCount > 0 && selected.size >= pageCount;

  return (
    <div className="flex flex-col gap-5">
      <FileInfoBar file={file} pages={pageCount || undefined} onRemove={reset} />

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
          {Array.from({ length: pageCount }, (_, i) => {
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
                <LazyThumb
                  index={i}
                  load={loadPage}
                  alt={`page ${i + 1}`}
                  className="flex w-full justify-center"
                  imgStyle={{ maxHeight: 150, width: "auto", borderRadius: 4, opacity: isSel ? 0.5 : 1 }}
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
