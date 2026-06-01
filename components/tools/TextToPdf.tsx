"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { SuccessPanel, ErrorBanner } from "./ResultPanels";
import { Spinner } from "./Spinner";
import { IconText } from "@/components/shared/icons";
import { textToPdf, type PageSizeId } from "@/lib/pdf/textToPdf";
import { downloadBlob } from "@/lib/format";
import { analytics } from "@/lib/analytics";

type Status = "idle" | "processing" | "done" | "error";

export function TextToPdf() {
  const t = useTranslations("ToolUI");
  const tp = useTranslations("ToolPages.textToPdf");
  const [text, setText] = useState("");
  const [pageSize, setPageSize] = useState<PageSizeId>("a4");
  const [fontSize, setFontSize] = useState(12);
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<Blob | null>(null);

  async function run() {
    if (!text.trim()) return;
    setStatus("processing");
    try {
      setResult(await textToPdf(text, { pageSize, fontSize }));
      setStatus("done");
      analytics.toolUsed("text-to-pdf");
    } catch {
      setStatus("error");
    }
  }

  function reset() {
    setResult(null);
    setStatus("idle");
  }

  if (status === "done" && result) {
    return (
      <SuccessPanel
        title={tp("successTitle")}
        meta="document.pdf"
        onDownload={() => downloadBlob(result, "document.pdf")}
        onReset={reset}
      />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <textarea
        className="pp-input"
        style={{ minHeight: 320, resize: "vertical", lineHeight: 1.6 }}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={tp("placeholder")}
      />

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-wrap items-end gap-5">
          <div>
            <div className="mb-1.5 text-[13px] font-medium">{tp("pageSize")}</div>
            <div className="flex gap-1 rounded-lg p-1" style={{ background: "var(--bg-2)", border: "1px solid var(--line)" }}>
              {(["a4", "letter"] as PageSizeId[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setPageSize(s)}
                  className="rounded-md px-3.5 py-1.5 text-[12.5px]"
                  style={{ background: pageSize === s ? "var(--indigo)" : "transparent", color: pageSize === s ? "#fff" : "var(--text-2)" }}
                >
                  {s === "a4" ? tp("sizeA4") : tp("sizeLetter")}
                </button>
              ))}
            </div>
          </div>
          <div className="min-w-[160px]">
            <div className="mb-1.5 flex justify-between text-[13px] font-medium">
              <span>{tp("fontSize")}</span>
              <span className="pp-mono" style={{ color: "var(--text-2)" }}>{fontSize}pt</span>
            </div>
            <input type="range" min={9} max={24} value={fontSize} onChange={(e) => setFontSize(+e.target.value)} className="w-full" />
          </div>
        </div>

        <button type="button" className="pp-btn pp-btn-lg min-w-[160px] justify-center" onClick={run} disabled={status === "processing" || !text.trim()}>
          {status === "processing" ? <><Spinner /> {t("processing")}</> : <><IconText size={15} sw={1.7} /> {tp("action")}</>}
        </button>
      </div>

      {status === "error" && <ErrorBanner onRetry={() => setStatus("idle")} />}
    </div>
  );
}
