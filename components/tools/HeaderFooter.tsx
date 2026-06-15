"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { FileDropzone } from "./FileDropzone";
import { FileInfoBar } from "./FileInfoBar";
import { SuccessPanel, ErrorBanner } from "./ResultPanels";
import { Spinner } from "./Spinner";
import { ScaledPreview } from "./ScaledPreview";
import { IconCheck, IconChevron } from "@/components/shared/icons";
import {
  applyHeaderFooter,
  resolveTokens,
  formatTokenDate,
  type Band,
  type BandAlign,
} from "@/lib/pdf/headerFooter";
import { createThumbLoader, type Thumb, type ThumbLoader } from "@/lib/pdf/thumbnailLoader";
import { isPdf } from "@/lib/pdf/common";
import { downloadBlob, baseName, MAX_FILE_BYTES } from "@/lib/format";
import { analytics } from "@/lib/analytics";

type Status = "idle" | "loading" | "ready" | "processing" | "done" | "error";
type Tr = ReturnType<typeof useTranslations>;

const PREVIEW_SCALE = 0.7;
const TOKENS = ["{page}", "{total}", "{date}", "{filename}"];
const BAND_SWATCHES = ["#0F0F0F", "#6B7280", "#6B5CE7", "#F43F5E"];
const ALIGNS: BandAlign[] = ["left", "center", "right"];

/** Module-level so the text input keeps focus across keystrokes. */
function BandConfig({
  kind,
  band,
  onChange,
  tp,
}: {
  kind: "header" | "footer";
  band: Band;
  onChange: (b: Band) => void;
  tp: Tr;
}) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <div className="flex size-6 items-center justify-center rounded-md" style={{ background: "rgba(107,92,231,0.14)", color: "#BFB5FF" }}>
          <IconChevron size={13} style={{ transform: kind === "header" ? "rotate(-90deg)" : "rotate(90deg)" }} />
        </div>
        <h4 className="text-[15px] tracking-[-0.01em]">{kind === "header" ? tp("header") : tp("footer")}</h4>
      </div>
      <input
        className="pp-input"
        value={band.text}
        onChange={(e) => onChange({ ...band, text: e.target.value })}
        placeholder={kind === "header" ? tp("headerPlaceholder") : tp("footerPlaceholder")}
      />
      <div className="mt-2 flex flex-wrap gap-1.5">
        {TOKENS.map((tk) => (
          <button
            key={tk}
            type="button"
            className="pp-mono rounded-md px-2 py-[3px] text-[11px]"
            style={{ background: "rgba(107,92,231,0.1)", border: "1px solid rgba(107,92,231,0.24)", color: "#BFB5FF" }}
            onClick={() => onChange({ ...band, text: band.text + tk })}
          >
            {tk}
          </button>
        ))}
      </div>
      <div className="mt-3.5 grid grid-cols-3 gap-1 rounded-lg p-1" style={{ background: "var(--bg-2)", border: "1px solid var(--line)" }}>
        {ALIGNS.map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => onChange({ ...band, align: a })}
            className="rounded-md py-1.5 text-[12.5px] transition-colors"
            style={{ background: band.align === a ? "var(--indigo)" : "transparent", color: band.align === a ? "#fff" : "var(--text-2)" }}
          >
            {tp(`align_${a}`)}
          </button>
        ))}
      </div>
      <div className="mt-3.5 grid grid-cols-[1fr_auto] items-center gap-3.5">
        <div>
          <div className="mb-1.5 flex justify-between text-[12.5px]" style={{ color: "var(--text-2)" }}>
            <span>{tp("size")}</span>
            <span className="pp-mono text-[11px]">{band.size}pt</span>
          </div>
          <input type="range" min={8} max={18} value={band.size} onChange={(e) => onChange({ ...band, size: +e.target.value })} className="w-full" />
        </div>
        <div className="flex gap-1.5">
          {BAND_SWATCHES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onChange({ ...band, color: c })}
              className="size-[26px] rounded-[7px]"
              style={{ background: c, border: 0, boxShadow: band.color === c ? `0 0 0 2px var(--card), 0 0 0 4px ${c}` : "inset 0 0 0 1px rgba(255,255,255,0.08)" }}
              aria-label={c}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

const bandStyle = (band: Band, where: "top" | "bottom"): React.CSSProperties => ({
  position: "absolute",
  left: 40 * PREVIEW_SCALE,
  right: 40 * PREVIEW_SCALE,
  [where]: 30 * PREVIEW_SCALE - band.size * PREVIEW_SCALE * 0.5,
  display: "flex",
  justifyContent: band.align === "left" ? "flex-start" : band.align === "right" ? "flex-end" : "center",
});

export function HeaderFooter() {
  const t = useTranslations("ToolUI");
  const tp = useTranslations("ToolPages.headerFooter");
  const [file, setFile] = useState<File | null>(null);
  const loaderRef = useRef<ThumbLoader | null>(null);
  const [total, setTotal] = useState(0);
  const [thumb, setThumb] = useState<Thumb | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<Blob | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>();
  const [previewPage, setPreviewPage] = useState(1);
  const [skipFirst, setSkipFirst] = useState(false);
  const [header, setHeader] = useState<Band>({ text: "CONFIDENTIAL — {filename}", align: "left", size: 10, color: "#F43F5E" });
  const [footer, setFooter] = useState<Band>({ text: "Page {page} of {total}", align: "center", size: 10, color: "#6B7280" });

  const today = formatTokenDate(new Date());

  // Render only the selected preview page, on demand (the loader caches each page).
  useEffect(() => {
    const loader = loaderRef.current;
    if (!loader || status === "idle" || total === 0) return;
    let cancelled = false;
    loader
      .renderPage(previewPage - 1, PREVIEW_SCALE)
      .then((th) => {
        if (!cancelled) setThumb(th);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [previewPage, total, status]);

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
    setThumb(null);
    loaderRef.current?.destroy();
    const loader = createThumbLoader(f);
    loaderRef.current = loader;
    try {
      const n = await loader.pageCount();
      setTotal(n);
      setPreviewPage(1);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }

  async function run() {
    if (!file) return;
    setStatus("processing");
    try {
      setResult(await applyHeaderFooter(file, { header, footer, skipFirst }));
      setStatus("done");
      analytics.toolUsed("header-footer");
    } catch {
      setStatus("error");
    }
  }

  function reset() {
    loaderRef.current?.destroy();
    loaderRef.current = null;
    setFile(null);
    setTotal(0);
    setThumb(null);
    setResult(null);
    setStatus("idle");
    setErrorMsg(undefined);
    setPreviewPage(1);
  }

  if (status === "done" && result) {
    return (
      <SuccessPanel
        title={tp("successTitle")}
        meta={`${baseName(file!.name)}-header-footer.pdf`}
        onDownload={() => downloadBlob(result, `${baseName(file!.name)}-header-footer.pdf`)}
        onReset={reset}
      />
    );
  }

  if (!file) {
    return (
      <div>
        <FileDropzone toolId="header-footer" accept="pdf" checkPages onFiles={onFiles} title={tp("emptyTitle")} />
        {errorMsg && (
          <div className="mt-4">
            <ErrorBanner message={errorMsg} onRetry={() => setErrorMsg(undefined)} />
          </div>
        )}
      </div>
    );
  }

  const ctx = { page: previewPage, total, date: today, filename: file.name };
  const skipped = skipFirst && previewPage === 1;

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[400px_1fr]">
      {/* Settings */}
      <div className="flex flex-col gap-5">
        <FileInfoBar file={file} pages={total || undefined} onRemove={reset} />
        <div className="pp-card flex flex-col gap-5" style={{ padding: 24 }}>
          <h3 className="pp-mono text-[13px] font-medium uppercase tracking-[0.04em]" style={{ color: "var(--text-3)" }}>
            {tp("panelTitle")}
          </h3>
          <BandConfig kind="header" band={header} onChange={setHeader} tp={tp} />
          <div style={{ borderTop: "1px solid var(--line)" }} />
          <BandConfig kind="footer" band={footer} onChange={setFooter} tp={tp} />
          <div style={{ borderTop: "1px solid var(--line)" }} />
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[13.5px] font-medium">{tp("skipFirst")}</div>
              <div className="text-[12px]" style={{ color: "var(--text-3)" }}>{tp("skipFirstHint")}</div>
            </div>
            <button
              type="button"
              onClick={() => setSkipFirst((s) => !s)}
              className="flex p-[3px]"
              style={{ width: 40, height: 24, borderRadius: 999, background: skipFirst ? "var(--indigo)" : "var(--line-2)", justifyContent: skipFirst ? "flex-end" : "flex-start", transition: "background 0.18s" }}
              aria-pressed={skipFirst}
            >
              <span className="size-[18px] rounded-full bg-white" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }} />
            </button>
          </div>
          <button type="button" className="pp-btn pp-btn-lg w-full justify-center" onClick={run} disabled={status === "processing" || (!header.text.trim() && !footer.text.trim())}>
            {status === "processing" ? <><Spinner /> {t("processing")}</> : <><IconCheck size={15} sw={2} /> {tp("action", { count: total })}</>}
          </button>
        </div>
      </div>

      {/* Live preview */}
      <div
        className="relative flex flex-col items-center rounded-2xl p-9"
        style={{ background: "radial-gradient(70% 60% at 50% 30%, rgba(107,92,231,0.08), rgba(107,92,231,0) 70%), var(--bg-2)", border: "1px solid var(--line)", minHeight: 520 }}
      >
        <div className="absolute left-5 top-4 flex items-center gap-2">
          <span className="pp-mono text-[10.5px] uppercase tracking-[0.1em]" style={{ color: "var(--text-3)" }}>{tp("livePreview")}</span>
          <span className="size-1.5 rounded-full" style={{ background: "#34D399", boxShadow: "0 0 8px #34D399" }} />
        </div>

        {status === "loading" || !thumb ? (
          <div className="flex flex-1 items-center justify-center gap-2" style={{ color: "var(--text-3)" }}>
            <Spinner size={18} /> {t("processing")}
          </div>
        ) : (
          <>
            <ScaledPreview width={thumb.w} height={thumb.h} className="mt-8">
              <div className="relative" style={{ width: thumb.w, height: thumb.h }}>
              <img src={thumb.url} alt={`page ${previewPage}`} className="rounded shadow-lg" style={{ width: thumb.w, height: thumb.h }} draggable={false} />
              {!skipped && header.text.trim() && (
                <div style={bandStyle(header, "top")}>
                  <span className="pp-mono relative" style={{ fontSize: header.size * PREVIEW_SCALE, color: header.color }}>
                    {resolveTokens(header.text, ctx)}
                    <span className="pointer-events-none absolute rounded-[4px]" style={{ inset: "-4px -6px", border: "1px dashed rgba(107,92,231,0.5)" }} />
                  </span>
                </div>
              )}
              {!skipped && footer.text.trim() && (
                <div style={bandStyle(footer, "bottom")}>
                  <span className="pp-mono relative" style={{ fontSize: footer.size * PREVIEW_SCALE, color: footer.color }}>
                    {resolveTokens(footer.text, ctx)}
                    <span className="pointer-events-none absolute rounded-[4px]" style={{ inset: "-4px -6px", border: "1px dashed rgba(107,92,231,0.5)" }} />
                  </span>
                </div>
              )}
              </div>
            </ScaledPreview>

            <div className="mt-6 flex items-center gap-3.5">
              <button type="button" onClick={() => setPreviewPage((p) => Math.max(1, p - 1))} className="flex rounded-lg p-2" style={{ background: "var(--card)", border: "1px solid var(--line)", color: "var(--text-2)" }} aria-label="previous page">
                <IconChevron size={14} style={{ transform: "rotate(180deg)" }} />
              </button>
              <span className="pp-mono text-[13px]">
                {tp("pageLabel", { n: previewPage })} <span style={{ color: "var(--text-3)" }}>/ {total}</span>
              </span>
              <button type="button" onClick={() => setPreviewPage((p) => Math.min(total, p + 1))} className="flex rounded-lg p-2" style={{ background: "var(--card)", border: "1px solid var(--line)", color: "var(--text-2)" }} aria-label="next page">
                <IconChevron size={14} />
              </button>
            </div>
          </>
        )}

        {status === "error" && (
          <div className="mt-4 w-full max-w-md">
            <ErrorBanner onRetry={() => setStatus("ready")} />
          </div>
        )}
      </div>
    </div>
  );
}
