"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useEditorStore, computeMatches, type Annotation } from "@/lib/stores/editorStore";
import { pagePngUrl, addText as apiAddText, whiteout as apiWhiteout } from "@/lib/api/editor";
import { usePinchZoom } from "@/lib/touch";
import { analytics } from "@/lib/analytics";
import { TextBlock } from "./TextBlock";
import { WhiteoutPreview } from "./WhiteoutTool";
import { HighlightTool } from "./HighlightTool";
import { DrawingTool } from "./DrawingTool";
import { CommentTool } from "./CommentTool";
import { ContextMenu, type ContextMenuState } from "./ContextMenu";

type Pt = { x: number; y: number };
const FIND_COLOR = "#F97316";

let annId = 0;
const nextId = () => `a${++annId}`;

const dragTools = new Set(["whiteout", "highlight", "strike", "shapes"]);

/** The editing surface: page PNG background + text-block & annotation overlays. */
export function EditorCanvas() {
  const t = useTranslations("ToolPages.editPdf");
  const s = useEditorStore();
  const pageRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const page = s.pages[s.currentPage];

  // two-finger pinch-to-zoom + pan on the scroll surface (store clamps 50–200%)
  usePinchZoom(scrollRef, { getScale: () => s.zoom, setScale: (z) => s.setZoom(z), panTarget: () => scrollRef.current });

  const [drag, setDrag] = useState<{ start: Pt; cur: Pt; tool: string } | null>(null);
  const [draft, setDraft] = useState<Pt | null>(null);
  const [draftText, setDraftText] = useState("");
  const [drawPts, setDrawPts] = useState<Pt[]>([]);
  const [ctx, setCtx] = useState<ContextMenuState | null>(null);
  const [openComment, setOpenComment] = useState<string | null>(null);
  /** client-only box-size overrides per block (visual resize via corner handles) */
  const [resizes, setResizes] = useState<Record<string, { w: number; h: number }>>({});
  const draftInputRef = useRef<HTMLInputElement>(null);
  // true once the draft is settled — guards against the focus-race blur that fires
  // the instant the autofocused input mounts (which would clear the box immediately).
  const draftReady = useRef(false);

  // focus the draft input reliably (autoFocus alone loses the focus race on mousedown)
  useEffect(() => {
    if (!draft) { draftReady.current = false; return; }
    draftReady.current = false;
    draftInputRef.current?.focus();
    const id = setTimeout(() => { draftReady.current = true; }, 250);
    return () => clearTimeout(id);
  }, [draft]);

  const matches = useMemo(
    () => computeMatches(s.pages, s.findReplaceOpen ? s.findQuery : "", s.findCaseSensitive),
    [s.pages, s.findQuery, s.findCaseSensitive, s.findReplaceOpen],
  );

  if (!page) return null;
  const scale = s.zoom / 100;
  const displayW = page.width * scale;
  const displayH = page.height * scale;
  const interactive = s.tool === "select";
  const activeMatchId = matches[s.findIndex]?.blockId ?? null;

  /** Client coords → PDF point coordinates on the current page. */
  function toPtClient(cx: number, cy: number): Pt {
    const r = pageRef.current!.getBoundingClientRect();
    return { x: (cx - r.left) / scale, y: (cy - r.top) / scale };
  }
  const toPt = (e: React.MouseEvent): Pt => toPtClient(e.clientX, e.clientY);

  const blockText = (id: string): string => {
    const b = page.textBlocks.find((x) => x.blockId === id);
    return s.changes.get(id)?.newText ?? b?.text ?? "";
  };

  // ---- drag gesture (whiteout / highlight / strike / shapes) ----
  function beginDrag(start: Pt, tool: string) {
    setDrag({ start, cur: start, tool });
    const move = (e: PointerEvent) => setDrag({ start, cur: toPtClient(e.clientX, e.clientY), tool });
    const up = (e: PointerEvent) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      setDrag(null);
      commitDrag(tool, start, toPtClient(e.clientX, e.clientY));
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  async function commitDrag(tool: string, start: Pt, cur: Pt) {
    const x = Math.min(start.x, cur.x), y = Math.min(start.y, cur.y);
    const w = Math.abs(cur.x - start.x), h = Math.abs(cur.y - start.y);
    if (w < 2 && h < 2) return; // ignore an accidental click without a real drag
    if (tool === "whiteout") {
      try {
        await apiWhiteout(s.sessionId!, { pageNum: page.pageNum, x, y, w, h });
        s.bumpRender();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : t("saveFailed"));
      }
    } else if (tool === "highlight") {
      s.addAnnotation({ id: nextId(), type: "highlight", pageNum: page.pageNum, x, y, w: Math.max(w, 8), h: Math.max(h, 10), color: s.strokeColor });
    } else if (tool === "strike") {
      s.addAnnotation({ id: nextId(), type: "strike", pageNum: page.pageNum, x, y, w: Math.max(w, 8), h: Math.max(h, 6), color: s.strokeColor });
    } else if (tool === "shapes") {
      if (s.shapeType === "arrow" || s.shapeType === "line") {
        // keep the true start→end so the arrowhead points the right way
        s.addAnnotation({ id: nextId(), type: "shape", shapeType: s.shapeType, pageNum: page.pageNum, x: start.x, y: start.y, w, h, x2: cur.x, y2: cur.y, color: s.strokeColor, strokeWidth: s.strokeWidth });
      } else {
        s.addAnnotation({ id: nextId(), type: "shape", shapeType: s.shapeType, pageNum: page.pageNum, x, y, w, h, color: s.strokeColor, strokeWidth: s.strokeWidth });
      }
    }
  }

  // ---- freehand draw gesture ----
  function beginDraw(start: Pt) {
    const pts: Pt[] = [start];
    setDrawPts([start]);
    const move = (e: PointerEvent) => { pts.push(toPtClient(e.clientX, e.clientY)); setDrawPts([...pts]); };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      setDrawPts([]);
      if (pts.length > 1) {
        const path = "M " + pts.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" L ");
        s.addAnnotation({ id: nextId(), type: "draw", pageNum: page.pageNum, x: 0, y: 0, w: page.width, h: page.height, color: s.strokeColor, strokeWidth: s.strokeWidth, path });
      }
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  function onPointerDown(e: React.PointerEvent) {
    if (e.button !== 0) return;
    setCtx(null);
    const tool = s.tool;
    if (tool === "select") {
      s.selectBlock(null);
      s.setEditing(null);
      return;
    }
    const p = toPt(e);
    if (tool === "text") {
      setDraft(p);
      setDraftText("");
      return;
    }
    if (tool === "comment") {
      const a: Annotation = { id: nextId(), type: "comment", pageNum: page.pageNum, x: p.x, y: p.y, w: 0, h: 0, color: "#F59E0B", text: "" };
      s.addAnnotation(a);
      setOpenComment(a.id);
      return;
    }
    if (tool === "draw") { beginDraw(p); return; }
    if (dragTools.has(tool)) beginDrag(p, tool);
  }

  function onCanvasContextMenu(e: React.MouseEvent) {
    if (!interactive) return; // only the select tool exposes the menu
    e.preventDefault();
    s.selectBlock(null);
    setCtx({ x: e.clientX, y: e.clientY, blockId: null, pt: toPt(e) });
  }

  async function commitDraft() {
    const text = draftText.trim();
    const at = draft;
    if (process.env.NODE_ENV !== "production") console.debug("[EditPdf] commitDraft, text=", JSON.stringify(text));
    setDraft(null);
    setDraftText("");
    if (!at || !text || !s.sessionId) return;
    try {
      await apiAddText(s.sessionId, { pageNum: page.pageNum, x: at.x, y: at.y + s.fontSize, text, fontSize: s.fontSize, fontName: s.fontFamily, color: s.fontColor });
      s.bumpRender();
      analytics.editorTextEdited();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("saveFailed"));
    }
  }

  // ---- context-menu actions ----
  async function ctxCopy() {
    if (!ctx?.blockId) return;
    try { await navigator.clipboard.writeText(blockText(ctx.blockId)); toast.success(t("copiedToast")); }
    catch { toast.error(t("clipboardError")); }
  }
  async function ctxCut() {
    if (!ctx?.blockId) return;
    try { await navigator.clipboard.writeText(blockText(ctx.blockId)); } catch { toast.error(t("clipboardError")); return; }
    s.deleteBlock(ctx.blockId);
    toast.success(t("cutToast"));
  }
  function ctxSelectAll() {
    const ids = page.textBlocks.map((b) => b.blockId);
    if (!ids.length) return;
    s.selectAllOnPage(ids);
    toast.success(t("selectAllToast", { count: ids.length }));
  }
  function ctxDelete() {
    if (s.multiSelected.length) s.deleteBlocks(s.multiSelected);
    else if (ctx?.blockId) s.deleteBlock(ctx.blockId);
  }

  const cursor =
    s.tool === "text" ? "text"
    : s.tool === "whiteout" || s.tool === "shapes" || s.tool === "draw" || s.tool === "highlight" || s.tool === "strike" ? "crosshair"
    : s.tool === "comment" ? "copy"
    : "default";

  const pageAnns = s.annotations.filter((a) => a.pageNum === page.pageNum);
  const pageMatches = matches.filter((m) => m.pageNum === page.pageNum);

  return (
    <div
      ref={scrollRef}
      className="pp-ed-canvas"
      style={{
        flex: 1, position: "relative", overflow: "auto",
        background: "radial-gradient(70% 60% at 50% 0%, rgba(107,92,231,0.06), rgba(107,92,231,0) 70%), repeating-linear-gradient(45deg, rgba(127,127,127,0.04) 0 1px, transparent 1px 16px), var(--bg-2)",
        display: "flex", justifyContent: "center", padding: "36px 40px",
      }}
    >
      <div
        ref={pageRef}
        onPointerDown={onPointerDown}
        onContextMenu={onCanvasContextMenu}
        style={{ position: "relative", width: displayW, height: displayH, flexShrink: 0, cursor, touchAction: "none", boxShadow: "0 30px 70px -24px rgba(0,0,0,0.55), 0 0 0 1px rgba(0,0,0,0.18)", background: "#fff" }}
      >
        <img
          src={`${pagePngUrl(s.sessionId!, page.pageNum)}?v=${s.renderVersion}`}
          alt={`Page ${page.pageNum + 1}`}
          width={displayW}
          height={displayH}
          draggable={false}
          style={{ display: "block", userSelect: "none", pointerEvents: "none" }}
        />

        {/* find matches (UI-only, behind interactive overlays) */}
        {pageMatches.map((m, i) => (
          <div
            key={`${m.blockId}-${i}`}
            style={{
              position: "absolute", left: m.x * scale, top: m.y * scale, width: m.w * scale, height: m.h * scale,
              background: m.blockId === activeMatchId ? "rgba(249,115,22,0.42)" : "rgba(249,115,22,0.24)",
              outline: m.blockId === activeMatchId ? `1.5px solid ${FIND_COLOR}` : "none",
              borderRadius: 2, pointerEvents: "none",
            }}
          />
        ))}

        {/* text blocks */}
        {page.textBlocks.map((b) => (
          <TextBlock
            key={b.blockId}
            block={b}
            change={s.changes.get(b.blockId)}
            scale={scale}
            interactive={interactive}
            resize={resizes[b.blockId]}
            selected={s.selectedBlock === b.blockId || s.multiSelected.includes(b.blockId)}
            editing={s.editingBlock === b.blockId}
            onSelect={() => interactive && s.selectBlock(b.blockId)}
            onStartEdit={() => { s.setTool("select"); s.setEditing(b.blockId); }}
            onResize={(w, h) => setResizes((r) => ({ ...r, [b.blockId]: { w, h } }))}
            onInput={(text) => { s.editBlock(b.blockId, { newText: text }); analytics.editorTextEdited(); }}
            onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); s.selectBlock(b.blockId); setCtx({ x: e.clientX, y: e.clientY, blockId: b.blockId, pt: toPt(e) }); }}
          />
        ))}

        {/* annotation overlays */}
        {pageAnns.map((a) => {
          if (a.type === "highlight" || a.type === "strike" || a.type === "underline")
            return <HighlightTool key={a.id} a={a} scale={scale} interactive={interactive} selected={false} onSelect={() => {}} onRemove={() => s.removeAnnotation(a.id)} onRecolor={() => {}} />;
          if (a.type === "draw" || a.type === "shape")
            return <DrawingTool key={a.id} a={a} scale={scale} interactive={interactive} selected={false} onSelect={() => {}} />;
          if (a.type === "comment")
            return <CommentTool key={a.id} a={a} scale={scale} interactive={interactive} open={openComment === a.id} onToggle={() => setOpenComment((v) => (v === a.id ? null : a.id))} onChangeText={(text) => s.updateAnnotation(a.id, { text })} onRemove={() => { s.removeAnnotation(a.id); setOpenComment(null); }} />;
          return null;
        })}

        {/* live freehand preview */}
        {drawPts.length > 1 && (
          <svg width={displayW} height={displayH} viewBox={`0 0 ${page.width} ${page.height}`} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
            <path d={"M " + drawPts.map((p) => `${p.x} ${p.y}`).join(" L ")} stroke={s.strokeColor} strokeWidth={s.strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}

        {/* drag preview (whiteout = rose; others = indigo) */}
        {drag && (() => {
          const x = Math.min(drag.start.x, drag.cur.x) * scale;
          const y = Math.min(drag.start.y, drag.cur.y) * scale;
          const w = Math.abs(drag.cur.x - drag.start.x) * scale;
          const h = Math.abs(drag.cur.y - drag.start.y) * scale;
          if (drag.tool === "whiteout") return <WhiteoutPreview rect={{ x, y, w, h }} hint={t("whiteoutHint")} />;
          return <div style={{ position: "absolute", left: x, top: y, width: w, height: h, border: "1.5px dashed #6B5CE7", background: "rgba(107,92,231,0.06)", borderRadius: 2, pointerEvents: "none" }} />;
        })()}

        {/* draft text box (text tool) — stop mousedown so clicking inside doesn't
            bubble back to the canvas and reset the draft */}
        {draft && (
          <div
            onPointerDown={(e) => e.stopPropagation()}
            style={{ position: "absolute", left: draft.x * scale, top: draft.y * scale, minWidth: 140, border: "2px dashed #6B5CE7", borderRadius: 4, background: "#fff", boxShadow: "0 4px 14px -4px rgba(0,0,0,0.4)", padding: "4px 6px", zIndex: 30 }}
          >
            <input
              ref={draftInputRef}
              autoFocus
              value={draftText}
              onChange={(e) => setDraftText(e.target.value)}
              // ignore the focus-race blur that fires right after mount; re-grab focus
              // so the box stays put. A genuine blur (after settle) commits.
              onBlur={() => { if (draftReady.current) commitDraft(); else draftInputRef.current?.focus(); }}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); commitDraft(); } if (e.key === "Escape") { setDraft(null); setDraftText(""); } }}
              placeholder={t("typeHere")}
              style={{ border: 0, outline: "none", background: "transparent", color: s.fontColor, fontSize: Math.max(11, s.fontSize * scale), width: "100%", minWidth: 130 }}
            />
          </div>
        )}
      </div>

      {ctx && (
        <ContextMenu
          state={ctx}
          onClose={() => setCtx(null)}
          onCut={ctxCut}
          onCopy={ctxCopy}
          onSelectAll={ctxSelectAll}
          onDelete={ctxDelete}
          onEdit={() => ctx.blockId && (s.setTool("select"), s.setEditing(ctx.blockId))}
        />
      )}
    </div>
  );
}
