"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { FileDropzone } from "./FileDropzone";
import { FileInfoBar } from "./FileInfoBar";
import { SuccessPanel, ErrorBanner } from "./ResultPanels";
import { Spinner } from "./Spinner";
import { IconRefresh, IconArrow } from "@/components/shared/icons";
import { reversePages } from "@/lib/pdf/reversePages";
import { isPdf, readPageCount } from "@/lib/pdf/common";
import { downloadBlob } from "@/lib/format";
import { analytics } from "@/lib/analytics";

type Status = "loaded" | "processing" | "done" | "error";
const ACCENT = "#A78BFA";

/** Build the page-number sequence for the before/after strips. Up to 7 pages
 * are shown in full; longer documents collapse the middle with an ellipsis. */
function orderTokens(n: number, reversed: boolean): (number | "…")[] {
  if (n <= 0) return [];
  const asc = Array.from({ length: n }, (_, i) => i + 1);
  const seq = reversed ? [...asc].reverse() : asc;
  if (n <= 7) return seq;
  return [seq[0], seq[1], seq[2], "…", seq[n - 1]];
}

export function ReversePagesTool() {
  const t = useTranslations("ToolUI");
  const tp = useTranslations("ToolPages.reversePages");
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState(0);
  const [status, setStatus] = useState<Status>("loaded");
  const [result, setResult] = useState<{ blob: Blob; filename: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>();

  async function onFiles(files: File[]) {
    const f = files[0];
    if (!f || !isPdf(f)) {
      setErrorMsg(t("wrongTypePdf"));
      return;
    }
    setErrorMsg(undefined);
    setFile(f);
    setStatus("loaded");
    setPages(await readPageCount(f).catch(() => 0));
  }

  async function run() {
    if (!file) return;
    setStatus("processing");
    try {
      const res = await reversePages(file);
      setResult({ blob: res.blob, filename: res.filename });
      setStatus("done");
      analytics.toolUsed("reverse-pages");
    } catch {
      setStatus("error");
    }
  }

  function reset() {
    setFile(null);
    setPages(0);
    setResult(null);
    setStatus("loaded");
    setErrorMsg(undefined);
  }

  if (status === "done" && result) {
    return (
      <SuccessPanel
        title={tp("successTitle", { pages })}
        meta={result.filename}
        onDownload={() => downloadBlob(result.blob, result.filename)}
        onReset={reset}
      />
    );
  }

  if (!file) {
    return (
      <div>
        <FileDropzone accept="pdf" checkPages onFiles={onFiles} title={tp("dropTitle")} />
        {errorMsg && <div className="mt-4"><ErrorBanner message={errorMsg} onRetry={() => setErrorMsg(undefined)} /></div>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <FileInfoBar file={file} pages={pages || undefined} onRemove={reset} />
      {pages > 0 && (
        <span className="pp-mono -mt-3 text-[12px]" style={{ color: "var(--text-3)" }}>
          {tp("willReverse", { pages })}
        </span>
      )}

      <div className="rounded-[18px] px-6 py-10 sm:px-10" style={{ background: "var(--bg-2)", border: "1px solid var(--line)" }}>
        <div className="flex items-center justify-center gap-4 sm:gap-6">
          <OrderStrip label={tp("originalOrder")} tokens={orderTokens(pages, false)} />
          <div className="flex shrink-0 flex-col items-center gap-2">
            <div
              className="flex size-11 items-center justify-center rounded-full"
              style={{ background: "rgba(107,92,231,0.14)", border: "1px solid var(--indigo-line)", color: "#BFB5FF" }}
            >
              {status === "processing" ? <Spinner /> : <IconArrow size={18} />}
            </div>
            <span className="pp-mono text-[9.5px]" style={{ color: "var(--text-3)" }}>{tp("reverse")}</span>
          </div>
          <OrderStrip label={tp("newOrder")} tokens={orderTokens(pages, true)} />
        </div>

        <div className="mt-10 flex flex-col items-center gap-3">
          <button
            type="button"
            className="pp-btn pp-btn-lg min-w-[240px] justify-center"
            onClick={run}
            disabled={status === "processing"}
            style={{ fontSize: 15 }}
          >
            {status === "processing" ? <><Spinner /> {tp("reversing")}</> : <><IconRefresh size={17} sw={1.8} /> {tp("action")}</>}
          </button>
          <div className="flex items-center gap-1.5 text-[11.5px]" style={{ color: "var(--text-3)" }}>
            <span className="pp-dot" style={{ color: "#34D399" }} /> {t("localNote")}
          </div>
        </div>
      </div>

      {status === "error" && <ErrorBanner onRetry={() => setStatus("loaded")} />}
    </div>
  );
}

function OrderStrip({ label, tokens }: { label: string; tokens: (number | "…")[] }) {
  return (
    <div className="flex-1">
      <div className="pp-mono mb-4 text-center text-[10px] uppercase tracking-[0.12em]" style={{ color: "var(--text-3)" }}>{label}</div>
      <div className="flex items-center justify-center gap-2 sm:gap-2.5">
        {tokens.map((tok, i) =>
          tok === "…" ? (
            <span key={i} className="pp-mono px-0.5 text-[14px]" style={{ color: "var(--text-3)" }}>…</span>
          ) : (
            <PageTile key={i} n={tok} highlight={i === 0} />
          ),
        )}
      </div>
    </div>
  );
}

function PageTile({ n, highlight }: { n: number; highlight: boolean }) {
  return (
    <div className="relative shrink-0">
      <div
        className="flex flex-col gap-[3px] overflow-hidden p-[7px]"
        style={{
          width: 52, height: 67, borderRadius: 5, background: "#FAFAF9",
          border: highlight ? `2px solid ${ACCENT}` : "1px solid var(--line-2)",
          boxShadow: highlight ? `0 0 0 4px ${ACCENT}22, 0 8px 18px -8px rgba(0,0,0,0.5)` : "0 5px 14px -8px rgba(0,0,0,0.5)",
        }}
      >
        <div style={{ height: 3, width: "55%", background: ACCENT, opacity: 0.6, borderRadius: 1 }} />
        {[0.9, 0.7, 0.85].map((w, i) => (
          <div key={i} style={{ height: 1.5, width: `${w * 100}%`, background: "#C9C6C0", borderRadius: 1 }} />
        ))}
      </div>
      <span
        className="pp-mono absolute left-1/2 whitespace-nowrap rounded-full"
        style={{
          bottom: -8, transform: "translateX(-50%)", padding: "1px 7px", fontSize: 10,
          background: highlight ? ACCENT : "var(--card)", color: highlight ? "white" : "var(--text-2)",
          border: `1px solid ${highlight ? ACCENT : "var(--line-2)"}`,
        }}
      >
        {n}
      </span>
    </div>
  );
}
