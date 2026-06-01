"use client";

import { useState } from "react";
import Markdown from "markdown-to-jsx";
import { useTranslations } from "next-intl";
import { ErrorBanner } from "./ResultPanels";
import { Spinner } from "./Spinner";
import { IconMarkdown, IconDownload } from "@/components/shared/icons";
import { markdownToPdf } from "@/lib/pdf/markdownToPdf";
import { downloadBlob } from "@/lib/format";
import { analytics } from "@/lib/analytics";

const PROSE =
  "text-[14px] leading-relaxed [&_h1]:mb-3 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:tracking-tight [&_h2]:mb-2 [&_h2]:mt-4 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:mb-2 [&_h3]:mt-3 [&_h3]:text-lg [&_h3]:font-semibold [&_p]:mb-3 [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mb-1 [&_code]:rounded [&_code]:px-1 [&_code]:font-mono [&_code]:text-[12.5px] [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:pl-3 [&_blockquote]:italic";

export function MarkdownToPdf() {
  const t = useTranslations("ToolUI");
  const tp = useTranslations("ToolPages.markdownToPdf");
  const [md, setMd] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>();

  async function download() {
    if (!md.trim()) return;
    setSaving(true);
    setErrorMsg(undefined);
    try {
      const blob = await markdownToPdf(md);
      downloadBlob(blob, "document.pdf");
      analytics.toolUsed("markdown-to-pdf");
    } catch {
      setErrorMsg(t("errorTitle"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Editor */}
        <div className="flex flex-col">
          <div className="pp-mono mb-2 text-[11.5px] uppercase tracking-[0.08em]" style={{ color: "var(--text-3)" }}>{tp("editorLabel")}</div>
          <textarea
            className="pp-input pp-mono"
            style={{ minHeight: 460, resize: "vertical", fontSize: 13, lineHeight: 1.6 }}
            value={md}
            onChange={(e) => setMd(e.target.value)}
            placeholder={tp("placeholder")}
          />
        </div>
        {/* Preview */}
        <div className="flex flex-col">
          <div className="pp-mono mb-2 text-[11.5px] uppercase tracking-[0.08em]" style={{ color: "var(--text-3)" }}>{tp("previewLabel")}</div>
          <div className="overflow-auto rounded-xl p-6" style={{ minHeight: 460, maxHeight: 520, background: "var(--card)", border: "1px solid var(--line)", color: "var(--text)" }}>
            {md.trim() ? (
              <div className={PROSE}><Markdown>{md}</Markdown></div>
            ) : (
              <p className="text-[13.5px]" style={{ color: "var(--text-3)" }}>{tp("previewEmpty")}</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button type="button" className="pp-btn pp-btn-lg min-w-[160px] justify-center" onClick={download} disabled={saving || !md.trim()}>
          {saving ? <><Spinner /> {t("processing")}</> : <><IconDownload size={15} /> {tp("action")}</>}
        </button>
      </div>

      <div className="flex items-center gap-1.5 text-[12px]" style={{ color: "var(--text-3)" }}>
        <IconMarkdown size={14} /> {tp("note")}
      </div>

      {errorMsg && <ErrorBanner message={errorMsg} onRetry={() => setErrorMsg(undefined)} />}
    </div>
  );
}
