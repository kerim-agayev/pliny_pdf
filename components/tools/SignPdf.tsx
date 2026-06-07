"use client";

import { useEffect, useRef, useState } from "react";
import type * as Fabric from "fabric";
import { useTranslations } from "next-intl";
import { FileDropzone } from "./FileDropzone";
import { FileInfoBar } from "./FileInfoBar";
import { ErrorBanner } from "./ResultPanels";
import { Spinner } from "./Spinner";
import { IconPen, IconType, IconImage, IconUpload, IconX, IconCheck, IconDownload, IconGrip, IconChevron } from "@/components/shared/icons";
import { signPdf, typedSignatureToPng, type SignPlacement } from "@/lib/pdf/signPdf";
import { createThumbLoader, type Thumb, type ThumbLoader } from "@/lib/pdf/thumbnailLoader";
import { isPdf } from "@/lib/pdf/common";
import { downloadBlob, baseName, MAX_FILE_BYTES } from "@/lib/format";
import { analytics } from "@/lib/analytics";

type Status = "idle" | "loading" | "ready" | "error";
type Tab = "draw" | "type" | "upload";

const INK = ["#1E3A8A", "#0F0F0F", "#1f1f1f", "#7C2D12"];
const SIG_FONTS = [
  { id: "f1", label: "Brush", family: "'Brush Script MT', cursive" },
  { id: "f2", label: "Script", family: "'Segoe Script', 'Snell Roundhand', cursive" },
  { id: "f3", label: "Formal", family: "'Apple Chancery', 'Snell Roundhand', cursive" },
  { id: "f4", label: "Mono", family: "'Courier New', monospace" },
];

export function SignPdf() {
  const t = useTranslations("ToolUI");
  const tp = useTranslations("ToolPages.signPdf");
  const [file, setFile] = useState<File | null>(null);
  const loaderRef = useRef<ThumbLoader | null>(null);
  const [total, setTotal] = useState(0);
  const [thumb, setThumb] = useState<Thumb | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string>();
  const [saving, setSaving] = useState(false);
  const [previewPage, setPreviewPage] = useState(1);

  const [tab, setTab] = useState<Tab>("draw");
  const [ink, setInk] = useState(INK[0]);
  const [typed, setTyped] = useState("");
  const [font, setFont] = useState(SIG_FONTS[0]);
  const [sig, setSig] = useState<{ url: string; aspect: number } | null>(null);
  const [scope, setScope] = useState<"current" | "all">("current");
  const [place, setPlace] = useState<SignPlacement>({ xPct: 16, yPct: 70, wPct: 34 });

  const padWrapRef = useRef<HTMLDivElement>(null);
  const padCanvasRef = useRef<HTMLCanvasElement>(null);
  const fcRef = useRef<Fabric.Canvas | null>(null);
  const pageWrapRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ mode: "move" | "resize"; sx: number; sy: number; ox: number; oy: number; ow: number } | null>(null);

  // Init the fabric drawing pad once the file is ready. The canvas stays mounted
  // across tab switches (we only toggle its wrapper's visibility) so fabric and
  // React never fight over removing the same node.
  useEffect(() => {
    if (status !== "ready") return;
    let disposed = false;
    let fc: Fabric.Canvas | null = null;
    (async () => {
      const fabric = await import("fabric");
      if (disposed || !padCanvasRef.current) return;
      const width = padWrapRef.current?.clientWidth ?? 340;
      fc = new fabric.Canvas(padCanvasRef.current, { isDrawingMode: true, width, height: 170, backgroundColor: undefined });
      const brush = new fabric.PencilBrush(fc);
      brush.color = ink;
      brush.width = 2.6;
      fc.freeDrawingBrush = brush;
      fcRef.current = fc;
    })();
    return () => {
      disposed = true;
      try {
        fc?.dispose();
      } catch {
        /* fabric's async DOM teardown can race React's unmount — safe to ignore */
      }
      fcRef.current = null;
    };
  }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const fc = fcRef.current;
    if (fc?.freeDrawingBrush) fc.freeDrawingBrush.color = ink;
  }, [ink]);

  // Render only the selected page for signature placement, on demand (cached).
  useEffect(() => {
    const loader = loaderRef.current;
    if (!loader || status === "idle" || total === 0) return;
    let cancelled = false;
    loader
      .renderPage(previewPage - 1, 0.8)
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

  function clearPad() {
    fcRef.current?.clear();
  }

  function saveSignature() {
    if (tab === "draw") {
      const fc = fcRef.current;
      if (!fc || fc.getObjects().length === 0) return;
      const url = fc.toDataURL({ format: "png", multiplier: 2 });
      setSig({ url, aspect: 170 / (padWrapRef.current?.clientWidth ?? 340) });
    } else if (tab === "type") {
      if (!typed.trim()) return;
      setSig(typedSignatureToPng(typed.trim(), font.family, ink));
    }
    // upload sets `sig` directly on drop
    setPlace({ xPct: 16, yPct: 70, wPct: 34 });
  }

  function onUploadPng(files: File[]) {
    const f = files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      const img = new Image();
      img.onload = () => {
        setSig({ url, aspect: img.naturalHeight / img.naturalWidth });
        setPlace({ xPct: 16, yPct: 70, wPct: 34 });
      };
      img.src = url;
    };
    reader.readAsDataURL(f);
  }

  // Placement drag / resize
  function startMove(e: React.PointerEvent) {
    e.preventDefault();
    dragRef.current = { mode: "move", sx: e.clientX, sy: e.clientY, ox: place.xPct, oy: place.yPct, ow: place.wPct };
    window.addEventListener("pointermove", onDrag);
    window.addEventListener("pointerup", endDrag);
  }
  function startResize(e: React.PointerEvent) {
    e.preventDefault();
    e.stopPropagation();
    dragRef.current = { mode: "resize", sx: e.clientX, sy: e.clientY, ox: place.xPct, oy: place.yPct, ow: place.wPct };
    window.addEventListener("pointermove", onDrag);
    window.addEventListener("pointerup", endDrag);
  }
  function onDrag(e: PointerEvent) {
    const d = dragRef.current;
    const rect = pageWrapRef.current?.getBoundingClientRect();
    if (!d || !rect) return;
    const dxPct = ((e.clientX - d.sx) / rect.width) * 100;
    const dyPct = ((e.clientY - d.sy) / rect.height) * 100;
    if (d.mode === "move") {
      setPlace((p) => ({ ...p, xPct: Math.max(0, Math.min(d.ox + dxPct, 100 - p.wPct)), yPct: Math.max(0, Math.min(d.oy + dyPct, 98)) }));
    } else {
      setPlace((p) => ({ ...p, wPct: Math.max(8, Math.min(d.ow + dxPct, 90)) }));
    }
  }
  function endDrag() {
    dragRef.current = null;
    window.removeEventListener("pointermove", onDrag);
    window.removeEventListener("pointerup", endDrag);
  }

  async function signAndDownload() {
    if (!file || !sig) return;
    setSaving(true);
    setErrorMsg(undefined);
    try {
      const blob = await signPdf(file, sig.url, place, scope === "all" ? { mode: "all" } : { mode: "current", index: previewPage - 1 });
      downloadBlob(blob, `${baseName(file.name)}-signed.pdf`);
      analytics.toolUsed("sign-pdf");
    } catch {
      setErrorMsg(t("errorTitle"));
    } finally {
      setSaving(false);
    }
  }

  function reset() {
    loaderRef.current?.destroy();
    loaderRef.current = null;
    setFile(null);
    setTotal(0);
    setThumb(null);
    setSig(null);
    setStatus("idle");
    setErrorMsg(undefined);
    setPreviewPage(1);
  }

  if (!file) {
    return (
      <div>
        <FileDropzone accept="pdf" checkPages onFiles={onFiles} title={tp("emptyTitle")} />
        {errorMsg && (
          <div className="mt-4">
            <ErrorBanner message={errorMsg} onRetry={() => setErrorMsg(undefined)} />
          </div>
        )}
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: typeof IconPen }[] = [
    { id: "draw", label: tp("tabDraw"), icon: IconPen },
    { id: "type", label: tp("tabType"), icon: IconType },
    { id: "upload", label: tp("tabUpload"), icon: IconImage },
  ];

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[420px_1fr]">
      {/* Step 1 — create signature */}
      <div className="flex flex-col gap-4">
        <FileInfoBar file={file} pages={total || undefined} onRemove={reset} />
        <div className="pp-card" style={{ padding: 24 }}>
          <div className="mb-4 flex items-center gap-2">
            <span className="flex size-[22px] items-center justify-center rounded-md text-[11px] font-semibold text-white" style={{ background: "var(--indigo)" }}>1</span>
            <h3 className="text-[15px]">{tp("create")}</h3>
          </div>

          {/* tabs */}
          <div className="mb-4 flex gap-1 rounded-[10px] p-1" style={{ background: "var(--bg-2)", border: "1px solid var(--line)" }}>
            {tabs.map((tb) => {
              const active = tab === tb.id;
              const Ic = tb.icon;
              return (
                <button
                  key={tb.id}
                  type="button"
                  onClick={() => setTab(tb.id)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2.5 text-[13px] font-medium"
                  style={{ background: active ? "rgba(107,92,231,0.16)" : "transparent", color: active ? "#BFB5FF" : "var(--text-2)", border: active ? "1px solid rgba(107,92,231,0.3)" : "1px solid transparent" }}
                >
                  <Ic size={15} sw={1.7} /> {tb.label}
                </button>
              );
            })}
          </div>

          {/* pad */}
          <div ref={padWrapRef} className="relative overflow-hidden rounded-xl" style={{ height: 170, background: "#FAFAF9", border: "1px solid var(--line-2)" }}>
            <div className="absolute right-3 top-2.5 z-10">
              <button type="button" onClick={clearPad} className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11.5px]" style={{ background: "white", border: "1px solid var(--line-2)", color: "#6B7280" }}>
                <IconX size={12} /> {tp("clear")}
              </button>
            </div>
            <div className="pointer-events-none absolute bottom-[52px] left-6 right-6" style={{ borderTop: "1px dashed #C7C2BB" }} />
            <div className="absolute inset-0" style={{ display: tab === "draw" ? "block" : "none" }}>
              <canvas ref={padCanvasRef} />
            </div>
            {tab === "type" && (
              <div className="flex h-full items-center justify-center" style={{ paddingBottom: 14 }}>
                <span style={{ fontFamily: font.family, fontSize: 46, color: ink }}>{typed || "Your name"}</span>
              </div>
            )}
            {tab === "upload" && (
              <div className="flex h-full items-center justify-center px-6 text-center" style={{ color: "var(--text-3)" }}>
                <label className="cursor-pointer">
                  <IconUpload size={24} sw={1.6} color="#9CA3AF" />
                  <div className="mt-2 text-[12.5px]" style={{ color: "#6B7280" }}>{tp("uploadHint")}</div>
                  <input type="file" accept="image/png" hidden onChange={(e) => onUploadPng(Array.from(e.target.files ?? []))} />
                </label>
              </div>
            )}
          </div>

          {tab === "type" && (
            <div className="mt-3.5">
              <input className="pp-input mb-2.5" value={typed} onChange={(e) => setTyped(e.target.value)} placeholder={tp("typePlaceholder")} />
              <div className="grid grid-cols-2 gap-2">
                {SIG_FONTS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFont(f)}
                    className="flex items-center justify-between gap-2 rounded-[9px] px-2.5 py-2"
                    style={{ background: font.id === f.id ? "rgba(107,92,231,0.1)" : "var(--bg-2)", border: font.id === f.id ? "1px solid var(--indigo)" : "1px solid var(--line)" }}
                  >
                    <span style={{ fontFamily: f.family, fontSize: 20, color: "var(--text)" }}>{typed.trim() || "Abc"}</span>
                    {font.id === f.id && <IconCheck size={13} color="#BFB5FF" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ink + save */}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[12.5px]" style={{ color: "var(--text-2)" }}>{tp("ink")}</span>
              {INK.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setInk(c)}
                  className="size-6 rounded-full"
                  style={{ background: c, border: 0, boxShadow: ink === c ? `0 0 0 2px var(--card), 0 0 0 4px ${c}` : "inset 0 0 0 1px rgba(255,255,255,0.12)" }}
                  aria-label={c}
                />
              ))}
            </div>
            <button type="button" className="pp-btn" style={{ padding: "8px 14px", fontSize: 13 }} onClick={saveSignature} disabled={tab === "upload"}>
              <IconCheck size={14} sw={2} /> {tp("saveSignature")}
            </button>
          </div>
        </div>

        {sig && (
          <div className="pp-card flex items-center justify-between" style={{ padding: 16 }}>
            <span className="text-[12.5px]" style={{ color: "var(--text-2)" }}>{tp("savedSignature")}</span>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-28 items-center justify-center rounded-lg" style={{ background: "#FAFAF9", border: "2px solid var(--indigo)" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={sig.url} alt="signature" style={{ maxHeight: 40, maxWidth: 100 }} />
              </div>
              <span className="pp-mono text-[11px]" style={{ color: "var(--text-3)" }}>{tp("localOnly")}</span>
            </div>
          </div>
        )}
      </div>

      {/* Step 2 — place */}
      <div
        className="relative flex flex-col items-center rounded-2xl p-9"
        style={{ background: "repeating-linear-gradient(45deg, rgba(127,127,127,0.04) 0 1px, transparent 1px 14px), var(--bg-2)", border: "1px solid var(--line)", minHeight: 560 }}
      >
        <div className="absolute left-5 top-4 flex items-center gap-2">
          <span className="flex size-5 items-center justify-center rounded-md text-[10.5px] font-semibold text-white" style={{ background: "var(--indigo)" }}>2</span>
          <span className="pp-mono text-[10.5px] uppercase tracking-[0.1em]" style={{ color: "var(--text-3)" }}>{tp("placeHint")}</span>
        </div>

        {status === "loading" || !thumb ? (
          <div className="flex flex-1 items-center justify-center gap-2" style={{ color: "var(--text-3)" }}>
            <Spinner size={18} /> {t("processing")}
          </div>
        ) : (
          <>
            <div ref={pageWrapRef} className="relative mt-7 shrink-0 select-none" style={{ width: Math.min(thumb.w, 460), maxWidth: "100%", aspectRatio: `${thumb.w} / ${thumb.h}` }}>
              <img src={thumb.url} alt={`page ${previewPage}`} className="h-full w-full rounded shadow-lg" draggable={false} />
              {sig && (
                <div
                  className="absolute"
                  style={{ left: `${place.xPct}%`, top: `${place.yPct}%`, width: `${place.wPct}%`, touchAction: "none" }}
                >
                  <div className="relative rounded-md" style={{ border: "1.5px dashed var(--indigo)", background: "rgba(107,92,231,0.04)", padding: 4 }}>
                    <div className="absolute -top-6 left-0 flex items-center gap-1 rounded-[5px] px-2 py-0.5 text-[10.5px] text-white" style={{ background: "var(--indigo)", cursor: "grab" }} onPointerDown={startMove}>
                      <IconGrip size={11} /> {tp("signatureChip")}
                    </div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={sig.url} alt="signature" className="block w-full cursor-grab" draggable={false} onPointerDown={startMove} />
                    <div className="absolute -bottom-1.5 -right-1.5 size-3 rounded-[2px] bg-white" style={{ border: "2px solid var(--indigo)", cursor: "nwse-resize", touchAction: "none" }} onPointerDown={startResize} />
                  </div>
                </div>
              )}
              {!sig && (
                <div className="absolute inset-x-6 bottom-10 rounded-lg py-3 text-center text-[12.5px]" style={{ background: "rgba(107,92,231,0.08)", border: "1px dashed rgba(107,92,231,0.4)", color: "#BFB5FF" }}>
                  {tp("createFirst")}
                </div>
              )}
            </div>

            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <div className="flex gap-0.5 rounded-[10px] p-1" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
                {(["current", "all"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setScope(s)}
                    className="rounded-md px-3.5 py-1.5 text-[12.5px] font-medium"
                    style={{ background: scope === s ? "rgba(107,92,231,0.16)" : "transparent", color: scope === s ? "#BFB5FF" : "var(--text-2)" }}
                  >
                    {s === "current" ? tp("scopeThis") : tp("scopeAll")}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1.5">
                <button type="button" onClick={() => setPreviewPage((p) => Math.max(1, p - 1))} className="flex rounded-lg p-2" style={{ background: "var(--card)", border: "1px solid var(--line)", color: "var(--text-2)" }} aria-label="previous page">
                  <IconChevron size={14} style={{ transform: "rotate(180deg)" }} />
                </button>
                <span className="pp-mono text-[12.5px]">{previewPage} <span style={{ color: "var(--text-3)" }}>/ {total}</span></span>
                <button type="button" onClick={() => setPreviewPage((p) => Math.min(total, p + 1))} className="flex rounded-lg p-2" style={{ background: "var(--card)", border: "1px solid var(--line)", color: "var(--text-2)" }} aria-label="next page">
                  <IconChevron size={14} />
                </button>
              </div>
              <button type="button" className="pp-btn pp-btn-lg" onClick={signAndDownload} disabled={!sig || saving}>
                {saving ? <><Spinner /> {t("processing")}</> : <><IconDownload size={15} /> {tp("action")}</>}
              </button>
            </div>
          </>
        )}

        {errorMsg && (
          <div className="mt-4 w-full max-w-md">
            <ErrorBanner message={errorMsg} onRetry={() => setErrorMsg(undefined)} />
          </div>
        )}
      </div>
    </div>
  );
}
