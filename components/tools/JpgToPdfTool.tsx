"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { FileDropzone } from "./FileDropzone";
import { SuccessPanel, ErrorBanner } from "./ResultPanels";
import { Spinner } from "./Spinner";
import { IconArrow, IconX, IconImage } from "@/components/shared/icons";
import { jpgToPdf, jpgToPdfSeparate } from "@/lib/pdf/jpgToPdf";
import { isImage } from "@/lib/pdf/common";
import { downloadBlob, formatBytes } from "@/lib/format";
import { analytics } from "@/lib/analytics";
import { useSession } from "@/lib/auth/client";
import { jpgToPdfMaxImages } from "@/lib/limits";

type Status = "idle" | "processing" | "done" | "error";
type Mode = "combine" | "separate";

export function JpgToPdfTool() {
  const t = useTranslations("ToolUI");
  const te = useTranslations("Errors");
  const tp = useTranslations("ToolPages.jpgToPdf");
  const { data: session } = useSession();
  const maxImages = jpgToPdfMaxImages((session?.user as { plan?: "free" | "pro" })?.plan ?? null);
  const [files, setFiles] = useState<File[]>([]);
  const [mode, setMode] = useState<Mode>("combine");
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<{ blob: Blob; filename: string; meta: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>();

  // Preview blob URLs: created per files change, revoked on change + unmount (no leak).
  const [previews, setPreviews] = useState<string[]>([]);
  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);

  function addFiles(incoming: File[]) {
    const imgs = incoming.filter(isImage);
    const room = Math.max(0, maxImages - files.length);
    // Inline error (not toast) — over the image-count cap or wrong type.
    if (imgs.length !== incoming.length) setErrorMsg(t("wrongTypeImage"));
    else if (imgs.length > room) setErrorMsg(te("tooManyImages", { max: maxImages }));
    else setErrorMsg(undefined);
    setFiles((prev) => [...prev, ...imgs.slice(0, Math.max(0, maxImages - prev.length))]);
  }

  async function run() {
    if (!files.length) return;
    setStatus("processing");
    try {
      if (mode === "separate") {
        const res = await jpgToPdfSeparate(files);
        setResult({ blob: res.blob, filename: res.filename, meta: `${res.filename} · ${tp("zipNote")}` });
      } else {
        const blob = await jpgToPdf(files);
        setResult({ blob, filename: "combined.pdf", meta: `combined.pdf · ${formatBytes(blob.size)}` });
      }
      setStatus("done");
      analytics.toolUsed("jpg-to-pdf");
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
        meta={result.meta}
        onDownload={() => downloadBlob(result.blob, result.filename)}
        onReset={reset}
      />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <FileDropzone toolId="jpg-to-pdf" accept="image" multiple onFiles={addFiles} />
      {errorMsg && <ErrorBanner message={errorMsg} onRetry={() => setErrorMsg(undefined)} />}

      {files.length > 0 && (
        <>
          <div className="flex items-center gap-1.5 text-[12.5px]" style={{ color: "var(--text-3)" }}>
            <IconImage size={14} /> {t("imagesCount", { count: files.length, max: maxImages })}
          </div>
          <div className="grid grid-cols-2 gap-1 rounded-[10px] p-1 sm:max-w-md" style={{ background: "var(--bg-2)", border: "1px solid var(--line)" }}>
            {([
              { k: "combine", label: tp("combineOne") },
              { k: "separate", label: tp("separateEach") },
            ] as const).map(({ k, label }) => {
              const active = mode === k;
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setMode(k)}
                  className="rounded-[7px] px-3 py-2 text-[12.5px] font-medium"
                  style={{
                    background: active ? "rgba(107,92,231,0.18)" : "transparent",
                    color: active ? "#BFB5FF" : "var(--text-2)",
                    border: active ? "1px solid rgba(107,92,231,0.3)" : "1px solid transparent",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {files.map((f, i) => (
              <div key={i} className="group relative aspect-[3/4] overflow-hidden rounded-lg" style={{ border: "1px solid var(--line)", background: "var(--bg-2)" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previews[i]} alt={f.name} className="size-full object-cover" />
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
