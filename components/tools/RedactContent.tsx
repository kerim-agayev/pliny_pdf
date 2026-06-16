"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { FileDropzone } from "./FileDropzone";
import { FileInfoBar } from "./FileInfoBar";
import { ErrorBanner } from "./ResultPanels";
import { Spinner } from "./Spinner";
import { IconWhiteout, IconEraser, IconCursor, IconUndo, IconSearch, IconShield, IconAlert, IconChevron, IconX, IconRect, IconArrow, IconCheck } from "@/components/shared/icons";
import { BottomSheet } from "./EditPdf/BottomSheet";
import { redactPdf, pageTextHits, REDACT_PATTERNS, type RedactBox, type TextHit } from "@/lib/pdf/redactPdf";
import { renderThumbnails, type Thumb } from "@/lib/pdf/thumbnails";
import { isPdf } from "@/lib/pdf/common";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import { downloadBlob, baseName, MAX_FILE_BYTES } from "@/lib/format";
import { analytics } from "@/lib/analytics";

type Status = "idle" | "loading" | "ready" | "error";
type Tool = "redact" | "erase" | "select";
type BoxUI = RedactBox & { id: string };

const FILLS: [string, string][] = [["#0F0F0F", "Black"], ["#FFFFFF", "White"], ["#6B7280", "Gray"]];
const PATTERN_KEYS = ["email", "phone", "card", "ssn"] as const;

// Shared draggable redaction surface (page image + boxes + resize handle).
// Used by both the desktop sidebar layout and the mobile full-screen editor.
function RedactCanvas({
  wrapRef, thumb, displayW, boxes, selId, tool, onSurfaceDown, onBoxDown, onResizeDown, isMobile,
}: {
  wrapRef: React.RefObject<HTMLDivElement | null>;
  thumb: Thumb;
  displayW: number;
  boxes: BoxUI[];
  selId: string | null;
  tool: Tool;
  onSurfaceDown: (e: React.PointerEvent) => void;
  onBoxDown: (e: React.PointerEvent, b: BoxUI) => void;
  onResizeDown: (e: React.PointerEvent, b: BoxUI) => void;
  isMobile: boolean;
}) {
  const handle = isMobile ? 22 : 10;
  return (
    <div
      ref={wrapRef}
      className="relative shrink-0 select-none"
      style={{ width: displayW, maxWidth: "100%", aspectRatio: `${thumb.w} / ${thumb.h}`, cursor: tool === "redact" ? "crosshair" : "default", touchAction: "none" }}
      onPointerDown={onSurfaceDown}
    >
      <img src={thumb.url} alt="page" className="h-full w-full rounded shadow-lg" draggable={false} />
      {boxes.map((b) => {
        const sel = b.id === selId;
        return (
          <div
            key={b.id}
            onPointerDown={(e) => onBoxDown(e, b)}
            className="absolute"
            style={{ left: `${b.xPct}%`, top: `${b.yPct}%`, width: `${b.wPct}%`, height: `${b.hPct}%`, background: b.color, borderRadius: 1, cursor: tool === "erase" ? "not-allowed" : "move", boxShadow: sel ? "0 0 0 2px var(--indigo), 0 0 0 4px rgba(107,92,231,0.3)" : "none" }}
          >
            {sel && tool !== "erase" && (
              <div onPointerDown={(e) => onResizeDown(e, b)} className="absolute rounded-[2px] bg-white" style={{ width: handle, height: handle, right: -handle / 2, bottom: -handle / 2, border: "1.5px solid var(--indigo)", cursor: "nwse-resize", touchAction: "none" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// Permanent-action confirmation (Wave 9D) — centered modal on desktop, bottom sheet on mobile.
function RedactConfirmModal({
  count, isMobile, onConfirm, onCancel, title, body, confirmLabel, cancelLabel,
}: {
  count: number;
  isMobile: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel: string;
}) {
  const inner = (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
      <div style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(245,158,11,0.16)", color: "#FBBF24", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}><IconAlert size={26} sw={2} /></div>
      <h3 style={{ fontFamily: "var(--font-display)", fontSize: 20, letterSpacing: "-0.02em", marginBottom: 8 }}>{title}</h3>
      <p style={{ fontSize: 13.5, color: "var(--text-2)", marginBottom: 20, maxWidth: 330, lineHeight: 1.5 }}>{body}</p>
      <button type="button" className="pp-btn pp-btn-lg" style={{ width: "100%", justifyContent: "center", background: "#F43F5E", marginBottom: 10, boxShadow: "0 12px 28px -12px rgba(244,63,94,0.6)" }} onClick={onConfirm}><IconCheck size={16} sw={2.4} /> {confirmLabel}</button>
      <button type="button" className="pp-btn pp-btn-ghost" style={{ width: "100%", justifyContent: "center" }} onClick={onCancel}>{cancelLabel}</button>
    </div>
  );
  if (isMobile) {
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 90, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(3px)", display: "flex", alignItems: "flex-end" }} onClick={onCancel}>
        <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", background: "var(--card)", borderRadius: "22px 22px 0 0", padding: "26px 20px calc(20px + env(safe-area-inset-bottom))", boxShadow: "0 -16px 40px -16px rgba(0,0,0,0.6)" }}>
          {inner}
        </div>
      </div>
    );
  }
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 90, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(2px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={onCancel}>
      <div onClick={(e) => e.stopPropagation()} className="pp-card" style={{ width: 440, maxWidth: "100%", padding: 28 }}>
        {inner}
      </div>
    </div>
  );
}

export function RedactContent() {
  const t = useTranslations("ToolUI");
  const tp = useTranslations("ToolPages.redactContent");
  const isMobile = useMediaQuery("(max-width: 767px)");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sheet, setSheet] = useState<"find" | "color" | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [thumbs, setThumbs] = useState<Thumb[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string>();
  const [saving, setSaving] = useState(false);
  const [previewPage, setPreviewPage] = useState(1);

  const [tool, setTool] = useState<Tool>("redact");
  const [color, setColor] = useState("#0F0F0F");
  const [boxesByPage, setBoxesByPage] = useState<Record<number, BoxUI[]>>({});
  const [selId, setSelId] = useState<string | null>(null);
  const [hits, setHits] = useState<TextHit[]>([]);
  const [search, setSearch] = useState("");
  const [patterns, setPatterns] = useState<Record<string, boolean>>({ email: true, ssn: true });

  const wrapRef = useRef<HTMLDivElement>(null);
  const gesture = useRef<{ kind: "draw" | "move" | "resize"; id: string; sx: number; sy: number; ox: number; oy: number; ow: number; oh: number } | null>(null);
  const uid = useRef(0);

  const pageIdx = previewPage - 1;
  const boxes = boxesByPage[pageIdx] ?? [];
  const thumb = thumbs[pageIdx];
  const totalBoxes = Object.values(boxesByPage).reduce((s, a) => s + a.length, 0);

  function setPageBoxes(idx: number, next: BoxUI[]) {
    setBoxesByPage((prev) => ({ ...prev, [idx]: next }));
  }

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
      const th = await renderThumbnails(f, 0.8);
      setThumbs(th);
      setBoxesByPage({});
      setPreviewPage(1);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }

  // Load text hits for the current page (search + auto-detect).
  useEffect(() => {
    if (status !== "ready" || !file) return;
    let cancelled = false;
    pageTextHits(file, pageIdx).then((h) => { if (!cancelled) setHits(h); }).catch(() => setHits([]));
    return () => { cancelled = true; };
  }, [status, file, pageIdx]);

  function pct(e: PointerEvent | React.PointerEvent) {
    const r = wrapRef.current!.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100, w: r.width, h: r.height };
  }

  function onSurfaceDown(e: React.PointerEvent) {
    if (tool !== "redact") {
      setSelId(null);
      return;
    }
    e.preventDefault();
    const p = pct(e);
    const id = `b${uid.current++}`;
    setPageBoxes(pageIdx, [...boxes, { id, xPct: p.x, yPct: p.y, wPct: 0, hPct: 0, color }]);
    gesture.current = { kind: "draw", id, sx: e.clientX, sy: e.clientY, ox: p.x, oy: p.y, ow: 0, oh: 0 };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  function onBoxDown(e: React.PointerEvent, b: BoxUI) {
    e.stopPropagation();
    if (tool === "erase") {
      setPageBoxes(pageIdx, boxes.filter((x) => x.id !== b.id));
      return;
    }
    setSelId(b.id);
    e.preventDefault();
    gesture.current = { kind: "move", id: b.id, sx: e.clientX, sy: e.clientY, ox: b.xPct, oy: b.yPct, ow: b.wPct, oh: b.hPct };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  function onResizeDown(e: React.PointerEvent, b: BoxUI) {
    e.stopPropagation();
    e.preventDefault();
    setSelId(b.id);
    gesture.current = { kind: "resize", id: b.id, sx: e.clientX, sy: e.clientY, ox: b.xPct, oy: b.yPct, ow: b.wPct, oh: b.hPct };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  function onMove(e: PointerEvent) {
    const g = gesture.current;
    const r = wrapRef.current?.getBoundingClientRect();
    if (!g || !r) return;
    const dx = ((e.clientX - g.sx) / r.width) * 100;
    const dy = ((e.clientY - g.sy) / r.height) * 100;
    setBoxesByPage((prev) => {
      const arr = (prev[pageIdx] ?? []).map((b) => {
        if (b.id !== g.id) return b;
        if (g.kind === "draw" || g.kind === "resize") {
          return { ...b, wPct: Math.max(0, g.ow + dx), hPct: Math.max(0, g.oh + dy), ...(g.kind === "draw" ? { xPct: g.ox, yPct: g.oy } : {}) };
        }
        return { ...b, xPct: Math.max(0, Math.min(g.ox + dx, 100 - b.wPct)), yPct: Math.max(0, Math.min(g.oy + dy, 100 - b.hPct)) };
      });
      return { ...prev, [pageIdx]: arr };
    });
  }

  function onUp() {
    const g = gesture.current;
    gesture.current = null;
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
    if (g?.kind === "draw") {
      // discard accidental tiny boxes
      setBoxesByPage((prev) => {
        const arr = (prev[pageIdx] ?? []).filter((b) => b.id !== g.id || (b.wPct > 1 && b.hPct > 0.6));
        return { ...prev, [pageIdx]: arr };
      });
    }
  }

  function undo() {
    if (boxes.length === 0) return;
    setPageBoxes(pageIdx, boxes.slice(0, -1));
    setSelId(null);
  }
  function deleteSelected() {
    if (!selId) return;
    setPageBoxes(pageIdx, boxes.filter((b) => b.id !== selId));
    setSelId(null);
  }

  const searchMatches = search.trim() ? hits.filter((h) => h.str.toLowerCase().includes(search.trim().toLowerCase())) : [];
  function redactSearch() {
    if (searchMatches.length === 0) return;
    const added = searchMatches.map((m) => ({ id: `b${uid.current++}`, xPct: m.xPct, yPct: m.yPct, wPct: m.wPct, hPct: m.hPct, color }));
    setPageBoxes(pageIdx, [...boxes, ...added]);
  }

  const patternCounts: Record<string, number> = {};
  for (const k of PATTERN_KEYS) patternCounts[k] = hits.filter((h) => REDACT_PATTERNS[k].test(h.str)).length;
  function scanPatterns() {
    const enabled = PATTERN_KEYS.filter((k) => patterns[k]);
    const added: BoxUI[] = [];
    for (const h of hits) {
      if (enabled.some((k) => REDACT_PATTERNS[k].test(h.str))) {
        added.push({ id: `b${uid.current++}`, xPct: h.xPct, yPct: h.yPct, wPct: h.wPct, hPct: h.hPct, color });
      }
    }
    if (added.length) setPageBoxes(pageIdx, [...boxes, ...added]);
  }

  async function apply() {
    if (!file || totalBoxes === 0) return;
    setSaving(true);
    setErrorMsg(undefined);
    try {
      const stripped: Record<number, RedactBox[]> = {};
      for (const [k, arr] of Object.entries(boxesByPage)) {
        if (arr.length) stripped[+k] = arr.map(({ id: _id, ...b }) => b); // eslint-disable-line @typescript-eslint/no-unused-vars
      }
      const blob = await redactPdf(file, stripped);
      downloadBlob(blob, `${baseName(file.name)}-redacted.pdf`);
      analytics.toolUsed("redact-content");
    } catch {
      setErrorMsg(t("errorTitle"));
    } finally {
      setSaving(false);
    }
  }

  function reset() {
    setFile(null);
    setThumbs([]);
    setBoxesByPage({});
    setStatus("idle");
    setErrorMsg(undefined);
    setPreviewPage(1);
  }

  const Warning = (
    <div className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.3)" }}>
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg" style={{ background: "rgba(244,63,94,0.16)", color: "#F87171" }}>
        <IconAlert size={17} sw={1.8} />
      </div>
      <div className="text-[13.5px]">
        <strong style={{ color: "#FCA5A5" }}>{tp("warnTitle")}</strong>{" "}
        <span style={{ color: "var(--text-2)" }}>{tp("warnBody")}</span>
      </div>
    </div>
  );

  if (!file) {
    return (
      <div className="flex flex-col gap-4">
        {Warning}
        <FileDropzone toolId="redact-content" accept="pdf" checkPages onFiles={onFiles} title={tp("emptyTitle")} />
        {errorMsg && <ErrorBanner message={errorMsg} onRetry={() => setErrorMsg(undefined)} />}
      </div>
    );
  }

  const displayW = thumb ? Math.min(thumb.w, 520) : 520;

  if (isMobile) {
    const mobileW = thumb ? Math.min(thumb.w, 252) : 252;
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", flexDirection: "column", background: "var(--bg)" }}>
        {/* header */}
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "env(safe-area-inset-top) 8px 0", height: "calc(52px + env(safe-area-inset-top))", flexShrink: 0, background: "var(--card)", borderBottom: "1px solid var(--line)" }}>
          <button type="button" onClick={reset} aria-label={tp("mobile.back")} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 40, height: 40, borderRadius: 10, border: "1px solid var(--line)", background: "var(--bg-2)", color: "var(--text-2)" }}>
            <IconChevron size={18} style={{ transform: "rotate(180deg)" }} />
          </button>
          <div style={{ flex: 1, minWidth: 0, textAlign: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{tp("mobile.title")}</div>
            <div className="pp-mono" style={{ fontSize: 10.5, color: "var(--text-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.name}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
            <button type="button" onClick={() => { setPreviewPage((p) => Math.max(1, p - 1)); setSelId(null); }} aria-label="previous page" style={{ width: 30, height: 30, borderRadius: 8, background: "transparent", border: 0, color: "var(--text-2)", display: "flex", alignItems: "center", justifyContent: "center" }}><IconChevron size={15} style={{ transform: "rotate(180deg)" }} /></button>
            <span className="pp-mono" style={{ fontSize: 12, color: "var(--text)", minWidth: 30, textAlign: "center" }}>{previewPage}/{thumbs.length}</span>
            <button type="button" onClick={() => { setPreviewPage((p) => Math.min(thumbs.length, p + 1)); setSelId(null); }} aria-label="next page" style={{ width: 30, height: 30, borderRadius: 8, background: "transparent", border: 0, color: "var(--text-2)", display: "flex", alignItems: "center", justifyContent: "center" }}><IconChevron size={15} /></button>
          </div>
        </header>

        {/* compact warning */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "rgba(244,63,94,0.08)", borderBottom: "1px solid rgba(244,63,94,0.3)", color: "#FCA5A5", fontSize: 12.5, flexShrink: 0 }}>
          <IconAlert size={16} sw={2} style={{ flexShrink: 0 }} />
          <span><strong>{tp("warnTitle")}</strong> <span style={{ color: "var(--text-2)" }}>{tp("warnBody")}</span></span>
        </div>

        {/* preview */}
        <div style={{ flex: 1, position: "relative", overflow: "hidden", background: "repeating-linear-gradient(45deg, rgba(127,127,127,0.04) 0 1px, transparent 1px 16px), var(--bg-2)", display: "flex", alignItems: "center", justifyContent: "center", padding: 14 }}>
          {status === "loading" || !thumb ? (
            <div className="flex items-center gap-2" style={{ color: "var(--text-3)" }}><Spinner size={18} /> {t("processing")}</div>
          ) : (
            <RedactCanvas wrapRef={wrapRef} thumb={thumb} displayW={mobileW} boxes={boxes} selId={selId} tool={tool} onSurfaceDown={onSurfaceDown} onBoxDown={onBoxDown} onResizeDown={onResizeDown} isMobile />
          )}
        </div>

        {/* bottom toolbar */}
        <div style={{ flexShrink: 0, background: "var(--card)", borderTop: "1px solid var(--line)", padding: "10px 14px calc(10px + env(safe-area-inset-bottom))" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button type="button" onClick={() => setTool("redact")} style={{ flex: 1, height: 46, borderRadius: 12, border: tool === "redact" ? "1px solid var(--indigo)" : "1px solid var(--line)", background: tool === "redact" ? "rgba(107,92,231,0.16)" : "var(--bg-2)", color: tool === "redact" ? "#BFB5FF" : "var(--text-2)", fontSize: 13.5, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}><IconRect size={16} /> {tp("mobile.drawBox")}</button>
            <button type="button" onClick={() => setSheet("find")} style={{ flex: 1, height: 46, borderRadius: 12, border: "1px solid var(--line)", background: "var(--bg-2)", color: "var(--text-2)", fontSize: 13.5, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}><IconSearch size={16} /> {tp("mobile.findText")}</button>
            <button type="button" onClick={() => setSheet("color")} aria-label={tp("fill")} style={{ width: 46, height: 46, borderRadius: 12, border: "1px solid var(--line)", background: "var(--bg-2)", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ width: 20, height: 20, borderRadius: 6, background: color, border: "1px solid var(--line-2)" }} /></button>
            <button type="button" onClick={undo} disabled={boxes.length === 0} aria-label={tp("mobile.undo")} style={{ width: 46, height: 46, borderRadius: 12, border: "1px solid var(--line)", background: "var(--bg-2)", color: boxes.length ? "var(--text-2)" : "var(--text-3)", display: "flex", alignItems: "center", justifyContent: "center" }}><IconUndo size={17} /></button>
          </div>
          <button type="button" onClick={() => setConfirmOpen(true)} disabled={saving || totalBoxes === 0} className="pp-btn pp-btn-lg" style={{ width: "100%", justifyContent: "center", marginTop: 10, background: "#F43F5E", boxShadow: "0 12px 30px -14px rgba(244,63,94,0.6)" }}>
            {saving ? <><Spinner /> {t("processing")}</> : <>{tp("mobile.applyN", { count: totalBoxes })} <IconArrow size={15} /></>}
          </button>
        </div>

        {sheet === "find" && (
          <BottomSheet title={tp("mobile.findTitle")} subtitle={tp("mobile.findSub")} onClose={() => setSheet(null)} maxH="54%">
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <input className="pp-input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={tp("searchPlaceholder")} style={{ height: 48, fontSize: 15 }} />
              {search.trim() && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 15px", borderRadius: 12, background: "var(--bg-2)", border: "1px solid var(--line)" }}>
                  <span style={{ fontSize: 14, color: "var(--text-2)" }}><span className="pp-mono" style={{ color: "#BFB5FF" }}>{searchMatches.length}</span> {tp("matches")}</span>
                  <button type="button" className="pp-btn" style={{ background: "#F43F5E", padding: "8px 14px" }} onClick={() => { redactSearch(); setSheet(null); }} disabled={searchMatches.length === 0}>{tp("redactAll")}</button>
                </div>
              )}
            </div>
          </BottomSheet>
        )}
        {sheet === "color" && (
          <BottomSheet title={tp("fill")} onClose={() => setSheet(null)} maxH="36%">
            <div style={{ display: "flex", gap: 12 }}>
              {FILLS.map(([c, name]) => (
                <button key={c} type="button" onClick={() => { setColor(c); setSheet(null); }} title={name} style={{ width: 48, height: 48, borderRadius: 12, background: c, border: c === "#FFFFFF" ? "1px solid var(--line-2)" : 0, boxShadow: color === c ? "0 0 0 2px var(--card), 0 0 0 4px var(--indigo)" : "inset 0 0 0 1px rgba(255,255,255,0.08)" }} />
              ))}
            </div>
          </BottomSheet>
        )}
        {confirmOpen && (
          <RedactConfirmModal
            count={totalBoxes}
            isMobile
            onConfirm={() => { setConfirmOpen(false); apply(); }}
            onCancel={() => setConfirmOpen(false)}
            title={tp("confirmTitle", { count: totalBoxes })}
            body={tp("confirmBody")}
            confirmLabel={tp("confirmYes")}
            cancelLabel={tp("confirmNo")}
          />
        )}
        {errorMsg && <div style={{ position: "absolute", left: 14, right: 14, bottom: 120, zIndex: 80 }}><ErrorBanner message={errorMsg} onRetry={() => setErrorMsg(undefined)} /></div>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <FileInfoBar file={file} pages={thumbs.length || undefined} onRemove={reset} />
      {Warning}

      <div className="grid grid-cols-1 overflow-hidden rounded-2xl lg:grid-cols-[1fr_320px]" style={{ background: "var(--bg-2)", border: "1px solid var(--line)" }}>
        {/* Canvas column */}
        <div style={{ borderRight: "1px solid var(--line)" }}>
          {/* toolbar */}
          <div className="flex flex-wrap items-center gap-1.5 px-4 py-3" style={{ background: "var(--card)", borderBottom: "1px solid var(--line)" }}>
            {([["redact", IconWhiteout, tp("toolRedact")], ["erase", IconEraser, tp("toolErase")], ["select", IconCursor, tp("toolSelect")]] as const).map(([id, Ic, label]) => {
              const active = tool === id;
              return (
                <button key={id} type="button" onClick={() => setTool(id)} className="pp-related flex items-center gap-1.5 rounded-[9px] px-3 py-2 text-[13px] font-medium" style={{ background: active ? "rgba(107,92,231,0.18)" : "transparent", border: active ? "1px solid rgba(107,92,231,0.4)" : "1px solid transparent", color: active ? "#BFB5FF" : "var(--text)" }}>
                  <Ic size={15} sw={1.7} /> {label}
                </button>
              );
            })}
            <div style={{ width: 1, height: 22, background: "var(--line)", margin: "0 4px" }} />
            <span className="mr-1 text-[12px]" style={{ color: "var(--text-3)" }}>{tp("fill")}</span>
            {FILLS.map(([c, name]) => (
              <button key={c} type="button" onClick={() => setColor(c)} title={name} className="size-[26px] rounded-[7px]" style={{ background: c, border: c === "#FFFFFF" ? "1px solid var(--line-2)" : 0, boxShadow: color === c ? "0 0 0 2px var(--card), 0 0 0 4px var(--indigo)" : "inset 0 0 0 1px rgba(255,255,255,0.08)" }} />
            ))}
            <div className="ml-auto flex items-center gap-1.5">
              <span className="pp-mono text-[11.5px]" style={{ color: "var(--text-3)" }}>{tp("redactionsCount", { count: totalBoxes })}</span>
              <div style={{ width: 1, height: 22, background: "var(--line)", margin: "0 4px" }} />
              <button type="button" onClick={undo} className="flex rounded-[7px] p-1.5" style={{ border: "1px solid var(--line)", color: "var(--text-2)" }} aria-label="undo"><IconUndo size={14} /></button>
              <button type="button" onClick={deleteSelected} disabled={!selId} className="flex rounded-[7px] p-1.5" style={{ border: "1px solid var(--line)", color: selId ? "#F87171" : "var(--text-3)" }} aria-label="delete selected"><IconX size={14} /></button>
            </div>
          </div>

          {/* canvas */}
          <div className="flex justify-center p-8" style={{ background: "repeating-linear-gradient(45deg, rgba(127,127,127,0.04) 0 1px, transparent 1px 14px)" }}>
            {status === "loading" || !thumb ? (
              <div className="flex items-center gap-2 py-24" style={{ color: "var(--text-3)" }}><Spinner size={18} /> {t("processing")}</div>
            ) : (
              <div className="flex flex-col items-center gap-5">
                <RedactCanvas wrapRef={wrapRef} thumb={thumb} displayW={displayW} boxes={boxes} selId={selId} tool={tool} onSurfaceDown={onSurfaceDown} onBoxDown={onBoxDown} onResizeDown={onResizeDown} isMobile={false} />
                {/* navigator */}
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => { setPreviewPage((p) => Math.max(1, p - 1)); setSelId(null); }} className="flex rounded-lg p-2" style={{ background: "var(--card)", border: "1px solid var(--line)", color: "var(--text-2)" }} aria-label="previous page"><IconChevron size={14} style={{ transform: "rotate(180deg)" }} /></button>
                  <span className="pp-mono text-[12.5px]">{previewPage} <span style={{ color: "var(--text-3)" }}>/ {thumbs.length}</span></span>
                  <button type="button" onClick={() => { setPreviewPage((p) => Math.min(thumbs.length, p + 1)); setSelId(null); }} className="flex rounded-lg p-2" style={{ background: "var(--card)", border: "1px solid var(--line)", color: "var(--text-2)" }} aria-label="next page"><IconChevron size={14} /></button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-5 p-5">
          <div>
            <div className="mb-2.5 text-[13px] font-semibold">{tp("searchTitle")}</div>
            <div className="relative mb-2.5">
              <IconSearch size={14} color="var(--text-3)" style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)" }} />
              <input className="pp-input" style={{ paddingLeft: 34 }} value={search} onChange={(e) => setSearch(e.target.value)} placeholder={tp("searchPlaceholder")} />
            </div>
            {search.trim() && (
              <div className="flex items-center justify-between rounded-[9px] px-3 py-2" style={{ background: "rgba(107,92,231,0.08)", border: "1px solid rgba(107,92,231,0.2)" }}>
                <span className="text-[12.5px]" style={{ color: "var(--text-2)" }}><span className="pp-mono" style={{ color: "#BFB5FF" }}>{searchMatches.length}</span> {tp("matches")}</span>
                <button type="button" className="pp-btn" style={{ padding: "5px 11px", fontSize: 12 }} onClick={redactSearch} disabled={searchMatches.length === 0}>{tp("redactAll")}</button>
              </div>
            )}
          </div>

          <div style={{ borderTop: "1px solid var(--line)" }} />

          <div>
            <div className="mb-1 text-[13px] font-semibold">{tp("autoTitle")}</div>
            <p className="mb-3 text-[12px] leading-relaxed" style={{ color: "var(--text-3)" }}>{tp("autoBody")}</p>
            <div className="flex flex-col gap-2">
              {PATTERN_KEYS.map((k) => {
                const on = !!patterns[k];
                return (
                  <div key={k} className="flex items-center gap-2.5 rounded-[10px] px-3 py-2.5" style={{ background: on ? "rgba(107,92,231,0.08)" : "var(--card)", border: `1px solid ${on ? "rgba(107,92,231,0.24)" : "var(--line)"}` }}>
                    <div className="flex-1">
                      <div className="text-[13px] font-medium">{tp(`pattern_${k}`)}</div>
                      <div className="pp-mono text-[10.5px]" style={{ color: "var(--text-3)" }}>{tp("found", { count: patternCounts[k] })}</div>
                    </div>
                    <button type="button" onClick={() => setPatterns((s) => ({ ...s, [k]: !s[k] }))} className="flex p-[3px]" style={{ width: 40, height: 24, borderRadius: 999, background: on ? "var(--indigo)" : "var(--line-2)", justifyContent: on ? "flex-end" : "flex-start", transition: "background 0.18s" }} aria-pressed={on}>
                      <span className="size-[18px] rounded-full bg-white" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }} />
                    </button>
                  </div>
                );
              })}
            </div>
            <button type="button" className="pp-btn pp-btn-ghost mt-3 w-full justify-center" onClick={scanPatterns}>{tp("scanPage")}</button>
          </div>

          <div style={{ borderTop: "1px solid var(--line)" }} />
          <div className="flex gap-2 text-[11.5px] leading-relaxed" style={{ color: "var(--text-3)" }}>
            <IconShield size={14} color="#34D399" sw={1.7} style={{ flexShrink: 0, marginTop: 1 }} />
            {tp("privacyNote")}
          </div>
        </div>
      </div>

      {/* bottom action */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[13px]" style={{ color: "var(--text-2)" }}>
          <IconAlert size={15} color="#F87171" sw={1.8} /> {tp("reviewNote")}
        </div>
        <button type="button" className="pp-btn pp-btn-lg" onClick={() => setConfirmOpen(true)} disabled={saving || totalBoxes === 0} style={{ background: "#F43F5E", boxShadow: "0 8px 20px -10px rgba(244,63,94,0.6)" }}>
          {saving ? <><Spinner /> {t("processing")}</> : <><IconWhiteout size={15} sw={1.7} /> {tp("action")}</>}
        </button>
      </div>

      {errorMsg && <ErrorBanner message={errorMsg} onRetry={() => setErrorMsg(undefined)} />}

      {confirmOpen && (
        <RedactConfirmModal
          count={totalBoxes}
          isMobile={false}
          onConfirm={() => { setConfirmOpen(false); apply(); }}
          onCancel={() => setConfirmOpen(false)}
          title={tp("confirmTitle", { count: totalBoxes })}
          body={tp("confirmBody")}
          confirmLabel={tp("confirmYes")}
          cancelLabel={tp("confirmNo")}
        />
      )}
    </div>
  );
}
