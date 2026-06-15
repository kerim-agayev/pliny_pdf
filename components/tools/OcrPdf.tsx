"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { FileDropzone } from "./FileDropzone";
import { SuccessPanel, ErrorBanner } from "./ResultPanels";
import { Spinner } from "./Spinner";
import { IconArrow, IconFile, IconX } from "@/components/shared/icons";
import { postFileForm, ApiError } from "@/lib/api";
import { formatBytes, downloadBlob, baseName } from "@/lib/format";
import { analytics } from "@/lib/analytics";
import { useSession } from "@/lib/auth/client";
import { officeMaxMB } from "@/lib/limits";

type Status = "idle" | "uploading" | "done" | "error";
type Lang = "eng" | "tur" | "rus";

const LOCALE_TO_LANG: Record<string, Lang> = { en: "eng", tr: "tur", ru: "rus" };

/**
 * OCR PDF — cloud tool. Uploads a (typically scanned) PDF plus a language to the
 * backend, which runs ocrmypdf and returns a searchable PDF with an invisible
 * text layer. Mirrors CloudConvertTool, with a language picker (default = locale).
 */
export function OcrPdf() {
  const t = useTranslations("ToolUI");
  const tp = useTranslations("ToolPages.ocrPdf");
  const locale = useLocale();
  const { data: session } = useSession();
  const maxMB = officeMaxMB((session?.user as { plan?: "free" | "pro" })?.plan ?? null);
  const [file, setFile] = useState<File | null>(null);
  const [lang, setLang] = useState<Lang>(LOCALE_TO_LANG[locale] ?? "eng");
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<{ blob: Blob; name: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>();

  function onFiles(files: File[]) {
    setErrorMsg(undefined);
    setFile(files[0] ?? null);
    if (status === "done" || status === "error") {
      setStatus("idle");
      setResult(null);
    }
  }

  async function start() {
    if (!file) return;
    setStatus("uploading");
    setErrorMsg(undefined);
    const t0 = performance.now();
    try {
      const blob = await postFileForm("/api/ocr", file, { lang });
      setResult({ blob, name: `${baseName(file.name)}-ocr.pdf` });
      setStatus("done");
      analytics.toolUsed("ocr-pdf", performance.now() - t0);
    } catch (e) {
      if (e instanceof ApiError && e.status === 429) {
        setErrorMsg(t("rateLimited"));
      } else {
        setErrorMsg(e instanceof Error ? e.message : undefined);
      }
      setStatus("error");
    }
  }

  function reset() {
    setFile(null);
    setResult(null);
    setStatus("idle");
    setErrorMsg(undefined);
  }

  if (status === "done" && result) {
    return (
      <SuccessPanel
        title={tp("successTitle")}
        meta={`${result.name} · ${formatBytes(result.blob.size)}`}
        onDownload={() => downloadBlob(result.blob, result.name)}
        onReset={reset}
      />
    );
  }

  return (
    <div>
      <FileDropzone toolId="ocr-pdf" accept="pdf" maxSizeMB={maxMB} onFiles={onFiles} />

      {errorMsg && (
        <div className="mt-4">
          <ErrorBanner
            message={errorMsg}
            note={t("cloudDeletedNote")}
            onRetry={() => {
              setStatus("idle");
              setErrorMsg(undefined);
            }}
          />
        </div>
      )}

      {file && status !== "done" && (
        <div className="mt-7">
          <div className="pp-filerow">
            <div
              className="flex h-11 w-9 shrink-0 items-center justify-center rounded"
              style={{ background: "rgba(96,165,250,0.14)", border: "1px solid rgba(96,165,250,0.35)", color: "#60A5FA" }}
            >
              <IconFile size={18} sw={1.7} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium" style={{ color: "var(--text)" }}>{file.name}</div>
              <div className="pp-mono mt-0.5 text-[11.5px]" style={{ color: "var(--text-3)" }}>
                {formatBytes(file.size)}
              </div>
            </div>
            {status !== "uploading" && (
              <button
                type="button"
                onClick={reset}
                className="flex size-[30px] items-center justify-center rounded-lg"
                style={{ border: "1px solid var(--line)", color: "var(--text-2)" }}
                aria-label={t("clear")}
              >
                <IconX size={14} />
              </button>
            )}
          </div>

          <div className="mt-6">
            <label className="mb-1.5 block text-[13px] font-medium" style={{ color: "var(--text)" }}>
              {tp("langLabel")}
            </label>
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as Lang)}
              disabled={status === "uploading"}
              className="pp-input w-full sm:max-w-[260px]"
            >
              <option value="eng">{tp("langEng")}</option>
              <option value="tur">{tp("langTur")}</option>
              <option value="rus">{tp("langRus")}</option>
            </select>
            <div className="mt-1.5 text-xs" style={{ color: "var(--text-3)" }}>{tp("langHint")}</div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-end gap-2.5">
            {status !== "uploading" && (
              <button type="button" className="pp-btn pp-btn-ghost pp-btn-lg" onClick={reset}>
                {t("clear")}
              </button>
            )}
            {status === "uploading" ? (
              <button type="button" className="pp-btn pp-btn-lg min-w-[180px] justify-center" disabled>
                <Spinner /> {t("converting")}
              </button>
            ) : (
              <button
                type="button"
                className="pp-btn pp-btn-lg min-w-[180px] justify-center"
                onClick={start}
              >
                {tp("action")} <IconArrow size={15} />
              </button>
            )}
          </div>

          {status === "uploading" && (
            <div
              className="mt-4 rounded-xl p-4"
              style={{ background: "var(--bg-2)", border: "1px solid var(--line)" }}
            >
              <div className="text-[13px]" style={{ color: "var(--text)" }}>{t("cloudProcessing")}</div>
              <div className="mt-2.5 flex items-center gap-1.5 text-xs" style={{ color: "var(--text-3)" }}>
                <span className="pp-dot" style={{ color: "#60A5FA" }} /> {t("cloudNote")}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
