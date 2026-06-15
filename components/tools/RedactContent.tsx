"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { FileDropzone } from "./FileDropzone";
import { FileInfoBar } from "./FileInfoBar";
import { ErrorBanner } from "./ResultPanels";
import { Spinner } from "./Spinner";
import { IconWhiteout, IconEraser, IconCursor, IconUndo, IconRedo, IconSearch, IconShield, IconAlert, IconChevron, IconX } from "@/components/shared/icons";
import { redactPdf, pageTextHits, REDACT_PATTERNS, type RedactBox, type TextHit } from "@/lib/pdf/redactPdf";
import { renderThumbnails, type Thumb } from "@/lib/pdf/thumbnails";
import { isPdf } from "@/lib/pdf/common";
import { downloadBlob, baseName, MAX_FILE_BYTES } from "@/lib/format";
import { analytics } from "@/lib/analytics";

type Status = "idle" | "loading" | "ready" | "error";
type Tool = "redact" | "erase" | "select";
type BoxUI = RedactBox & { id: string };

const FILLS: [string, string][] = [["#0F0F0F", "Black"], ["#FFFFFF", "White"], ["#6B7280", "Gray"]];
const PATTERN_KEYS = ["email", "phone", "card", "ssn"] as const;

export function RedactContent() {
  const t = useTranslations("ToolUI");
  const tp = useTranslations("ToolPages.redactContent");
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
                <div
                  ref={wrapRef}
                  className="relative shrink-0 select-none"
                  style={{ width: displayW, maxWidth: "100%", aspectRatio: `${thumb.w} / ${thumb.h}`, cursor: tool === "redact" ? "crosshair" : "default", touchAction: "none" }}
                  onPointerDown={onSurfaceDown}
                >
                  <img src={thumb.url} alt={`page ${previewPage}`} className="h-full w-full rounded shadow-lg" draggable={false} />
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
                          <div onPointerDown={(e) => onResizeDown(e, b)} className="absolute -bottom-1 -right-1 size-2.5 rounded-[2px] bg-white" style={{ border: "1.5px solid var(--indigo)", cursor: "nwse-resize" }} />
                        )}
                      </div>
                    );
                  })}
                </div>
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
        <button type="button" className="pp-btn pp-btn-lg" onClick={apply} disabled={saving || totalBoxes === 0} style={{ background: "#F43F5E", boxShadow: "0 8px 20px -10px rgba(244,63,94,0.6)" }}>
          {saving ? <><Spinner /> {t("processing")}</> : <><IconWhiteout size={15} sw={1.7} /> {tp("action")}</>}
        </button>
      </div>

      {errorMsg && <ErrorBanner message={errorMsg} onRetry={() => setErrorMsg(undefined)} />}
    </div>
  );
}
