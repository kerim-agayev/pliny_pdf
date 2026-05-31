"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { FileDropzone } from "./FileDropzone";
import { ErrorBanner } from "./ResultPanels";
import { Spinner } from "./Spinner";
import { IconRefresh, IconCopy, IconCheck, IconArrow, IconFile } from "@/components/shared/icons";
import { postFileJson, ApiError } from "@/lib/api";
import { formatBytes } from "@/lib/format";
import { analytics } from "@/lib/analytics";

type Summary = {
  executive: string;
  outline: string[];
  sections: { title: string; summary: string }[];
};
type Result = { summary: Summary; meta: { pages: number; wordCount: number } };
type Status = "idle" | "loading" | "done" | "error";
type Tab = "executive" | "outline" | "sections";

export function SummarizeTool() {
  const t = useTranslations("ToolUI");
  const tp = useTranslations("ToolPages.summarize");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<Result | null>(null);
  const [tab, setTab] = useState<Tab>("executive");
  const [errorMsg, setErrorMsg] = useState<string>();
  const [needAuth, setNeedAuth] = useState(false);

  async function run(f: File) {
    setFile(f);
    setStatus("loading");
    setErrorMsg(undefined);
    setNeedAuth(false);
    const t0 = performance.now();
    try {
      const r = await postFileJson<Result>("/api/ai/summarize", f);
      setResult(r);
      setTab("executive");
      setStatus("done");
      analytics.toolUsed("summarize", performance.now() - t0);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        setNeedAuth(true);
        setErrorMsg(t("signInRequired"));
      } else if (e instanceof ApiError && e.status === 429) {
        setErrorMsg(t("aiLimitReached"));
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
    setNeedAuth(false);
  }

  if (status === "done" && result && file) {
    return <SummaryView result={result} file={file} tab={tab} setTab={setTab} onReset={reset} />;
  }

  return (
    <div>
      {status !== "loading" && (
        <FileDropzone accept="pdf" onFiles={(files) => files[0] && run(files[0])} />
      )}

      {status === "loading" && (
        <div className="pp-card flex items-center gap-3" style={{ padding: 24 }}>
          <Spinner /> <span style={{ color: "var(--text-2)" }}>{t("aiAnalyzing")}</span>
        </div>
      )}

      {status === "error" && errorMsg && (
        <div className="mt-4">
          <ErrorBanner message={errorMsg} note={t("cloudDeletedNote")} onRetry={reset} />
          {needAuth && (
            <div className="mt-3 flex gap-2.5">
              <Link href="/login" className="pp-btn">
                {t("signIn")} <IconArrow size={14} />
              </Link>
              <Link href="/signup" className="pp-btn pp-btn-ghost">
                {t("createAccount")}
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SummaryView({
  result,
  file,
  tab,
  setTab,
  onReset,
}: {
  result: Result;
  file: File;
  tab: Tab;
  setTab: (t: Tab) => void;
  onReset: () => void;
}) {
  const t = useTranslations("ToolUI");
  const { summary, meta } = result;
  const [copied, setCopied] = useState(false);
  const readMin = Math.max(1, Math.round(meta.wordCount / 200));

  function activeText(): string {
    if (tab === "executive") return summary.executive;
    if (tab === "outline") return summary.outline.map((o) => `• ${o}`).join("\n");
    return summary.sections.map((s) => `${s.title}\n${s.summary}`).join("\n\n");
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(activeText());
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "executive", label: t("tabExecutive") },
    { id: "outline", label: t("tabOutline") },
    { id: "sections", label: t("tabSections") },
  ];

  return (
    <div>
      {/* file info bar */}
      <div className="pp-card mb-4 flex flex-wrap items-center gap-4" style={{ padding: 16 }}>
        <div
          className="flex size-10 shrink-0 items-center justify-center rounded-[10px]"
          style={{ background: "rgba(107,92,231,0.14)", border: "1px solid rgba(107,92,231,0.3)", color: "#BFB5FF" }}
        >
          <IconFile size={18} sw={1.7} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium" style={{ color: "var(--text)" }}>{file.name}</div>
          <div className="pp-mono mt-0.5 text-[11.5px]" style={{ color: "var(--text-3)" }}>
            {t("pagesCount", { count: meta.pages })} · {meta.wordCount.toLocaleString()} {t("words")} · {readMin} {t("minRead")} · {formatBytes(file.size)}
          </div>
        </div>
        <button type="button" className="pp-btn pp-btn-ghost" style={{ padding: "8px 14px" }} onClick={onReset}>
          <IconRefresh size={13} /> {t("summarizeAgain")}
        </button>
      </div>

      {/* summary card */}
      <div className="pp-card" style={{ padding: 0, overflow: "hidden" }}>
        <div
          className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5"
          style={{ borderBottom: "1px solid var(--line)" }}
        >
          <div className="flex gap-1">
            {tabs.map((tb) => {
              const active = tab === tb.id;
              return (
                <button
                  key={tb.id}
                  type="button"
                  onClick={() => setTab(tb.id)}
                  className="rounded-lg px-3.5 py-1.5 text-[13px] font-medium"
                  style={{
                    background: active ? "rgba(107,92,231,0.14)" : "transparent",
                    color: active ? "#BFB5FF" : "var(--text-2)",
                    border: active ? "1px solid rgba(107,92,231,0.3)" : "1px solid transparent",
                  }}
                >
                  {tb.label}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={copy}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs"
            style={{ border: "1px solid var(--line)", color: copied ? "#6EE7B7" : "var(--text-2)" }}
          >
            {copied ? <IconCheck size={13} /> : <IconCopy size={13} />} {copied ? t("copied") : t("copy")}
          </button>
        </div>

        <div className="p-6 sm:p-7">
          {tab === "executive" && (
            <div className="flex flex-col gap-4 text-[15px] leading-[1.7]" style={{ color: "var(--text)" }}>
              {summary.executive
                .split(/\n{2,}/)
                .filter(Boolean)
                .map((p, i) => (
                  <p key={i} style={{ color: i === 0 ? "var(--text)" : "var(--text-2)" }}>{p}</p>
                ))}
            </div>
          )}

          {tab === "outline" && (
            <ul className="flex list-none flex-col gap-2.5 p-0">
              {summary.outline.map((o, i) => (
                <li key={i} className="flex gap-3 text-[14px]" style={{ color: "var(--text)" }}>
                  <span className="pp-mono mt-px text-[11px]" style={{ color: "#BFB5FF" }}>{String(i + 1).padStart(2, "0")}</span>
                  <span style={{ color: "var(--text-2)" }}>{o}</span>
                </li>
              ))}
            </ul>
          )}

          {tab === "sections" && (
            <div className="flex flex-col gap-5">
              {summary.sections.map((s, i) => (
                <div key={i}>
                  <div className="mb-1.5 text-[14px] font-semibold" style={{ color: "var(--text)" }}>{s.title}</div>
                  <p className="text-[13.5px] leading-relaxed" style={{ color: "var(--text-2)" }}>{s.summary}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div
          className="px-5 py-3 text-[12px]"
          style={{ borderTop: "1px solid var(--line)", color: "var(--text-3)", background: "rgba(127,127,127,0.02)" }}
        >
          {t("aiDisclaimer")}
        </div>
      </div>
    </div>
  );
}
