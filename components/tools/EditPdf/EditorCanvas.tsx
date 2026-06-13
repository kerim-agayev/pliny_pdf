"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useEditorStore, computeMatches, type Annotation } from "@/lib/stores/editorStore";
import { pagePngUrl, addText as apiAddText, imagePreviewUrl } from "@/lib/api/editor";
import { usePinchZoom } from "@/lib/touch";
import { analytics } from "@/lib/analytics";
import { TextBlock, cssFont } from "./TextBlock";
import { WhiteoutPreview } from "./WhiteoutTool";
import { HighlightTool } from "./HighlightTool";
import { DrawingTool } from "./DrawingTool";
import { CommentTool } from "./CommentTool";
import { ContextMenu, type ContextMenuState } from "./ContextMenu";
import { ConfirmDialog } from "./ConfirmDialog";

type Pt = { x: number; y: number };
const FIND_COLOR = "#F97316";

// ── Shared overlay style helpers ─────────────────────────────────────────────

const RESIZE_HANDLE: React.CSSProperties = {
  position: "absolute", right: -5, bottom: -5, width: 12, height: 12,
  background: "#6B5CE7", borderRadius: 3, cursor: "se-resize",
  boxShadow: "0 1px 4px rgba(0,0,0,0.4)",
};

const DELETE_BTN: React.CSSProperties = {
  position: "absolute", top: -10, right: -10, width: 20, height: 20,
  background: "#EF4444", borderRadius: "50%", border: 0, cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center",
  color: "#fff", fontSize: 12, fontWeight: 700, lineHeight: 1, zIndex: 2,
  boxShadow: "0 1px 4px rgba(0,0,0,0.4)",
};

// ── ImageOverlay ─────────────────────────────────────────────────────────────

function ImageOverlay({ a, scale, sessionId, selected, onDrag, onResize, onDelete, onSelect }: {
  a: Annotation; scale: number; sessionId: string; selected: boolean;
  onDrag: (e: React.PointerEvent) => void;
  onResize: (e: React.PointerEvent) => void;
  onDelete: () => void;
  onSelect: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const show = hovered || selected;
  return (
    <div
      onPointerDown={onDrag}
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "absolute", left: a.x * scale, top: a.y * scale,
        width: a.w * scale, height: a.h * scale,
        cursor: "move", outline: selected ? "2px solid #6B5CE7" : show ? "1.5px dashed #6B5CE7" : "none",
        outlineOffset: 1,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imagePreviewUrl(sessionId, a.imageId!)}
        alt=""
        draggable={false}
        style={{ width: "100%", height: "100%", display: "block", objectFit: "fill", userSelect: "none", pointerEvents: "none" }}
      />
      {show && (
        <>
          <button type="button" style={DELETE_BTN} onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); onDelete(); }}>✕</button>
          <div style={RESIZE_HANDLE} onPointerDown={(e) => { e.stopPropagation(); onResize(e); }} />
        </>
      )}
    </div>
  );
}

// ── StampOverlay ─────────────────────────────────────────────────────────────

function StampOverlay({ a, scale, selected, onDrag, onResize, onDelete, onSelect }: {
  a: Annotation; scale: number; selected: boolean;
  onDrag: (e: React.PointerEvent) => void;
  onResize: (e: React.PointerEvent) => void;
  onDelete: () => void;
  onSelect: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const show = hovered || selected;
  const col = a.color || "#3B82F6";
  const label = a.label || "";
  // Fit the single-line label to the box: bound by height AND width so long words
  // (CONFIDENTIAL, RECEIVED) shrink instead of overflowing. 0.62 ≈ bold-Helvetica
  // avg glyph width / fontsize — matches the server's get_text_length sizing.
  const widthBound = label.length ? (a.w * 0.86) / (label.length * 0.62) : a.h * 0.6;
  const fs = Math.max(5, Math.min(a.h * 0.6, widthBound, 40)) * scale;
  return (
    <div
      onPointerDown={onDrag}
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "absolute", left: a.x * scale, top: a.y * scale,
        width: a.w * scale, height: a.h * scale,
        border: `2.5px solid ${col}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "move", background: "transparent", overflow: "hidden",
        outline: selected ? `2px solid ${col}66` : "none", outlineOffset: 3,
      }}
    >
      <span style={{ color: col, fontWeight: 700, fontSize: fs, letterSpacing: "0.04em", whiteSpace: "nowrap", userSelect: "none", pointerEvents: "none" }}>
        {label}
      </span>
      {show && (
        <>
          <button type="button" style={DELETE_BTN} onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); onDelete(); }}>✕</button>
          <div style={RESIZE_HANDLE} onPointerDown={(e) => { e.stopPropagation(); onResize(e); }} />
        </>
      )}
    </div>
  );
}

// ── MarkOverlay ──────────────────────────────────────────────────────────────
// Quick-mark glyph (✓ / ✗ / ○) — placed at click, draggable + resizable. Burned as
// a drawn annotation on save (Wave 6D).
function MarkGlyph({ type, color }: { type: string; color: string }) {
  const common = { stroke: color, strokeWidth: 2.4, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, fill: "none" };
  return (
    <svg viewBox="0 0 24 24" width="100%" height="100%" style={{ display: "block", pointerEvents: "none" }}>
      {type === "circle" && <ellipse cx={12} cy={12} rx={10} ry={10} {...common} />}
      {type === "cross" && (<><line x1={4} y1={4} x2={20} y2={20} {...common} /><line x1={20} y1={4} x2={4} y2={20} {...common} /></>)}
      {type === "check" && <polyline points="4.3,13.2 10,19.2 20.4,4.8" {...common} />}
    </svg>
  );
}

function MarkOverlay({ a, scale, selected, onDrag, onResize, onDelete, onSelect }: {
  a: Annotation; scale: number; selected: boolean;
  onDrag: (e: React.PointerEvent) => void;
  onResize: (e: React.PointerEvent) => void;
  onDelete: () => void;
  onSelect: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const show = hovered || selected;
  return (
    <div
      onPointerDown={onDrag}
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "absolute", left: a.x * scale, top: a.y * scale,
        width: a.w * scale, height: a.h * scale,
        cursor: "move", outline: selected ? "2px solid #6B5CE7" : show ? "1.5px dashed #6B5CE7" : "none",
        outlineOffset: 2,
      }}
    >
      <MarkGlyph type={a.markType || "check"} color={a.color} />
      {show && (
        <>
          <button type="button" style={DELETE_BTN} onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); onDelete(); }}>✕</button>
          <div style={RESIZE_HANDLE} onPointerDown={(e) => { e.stopPropagation(); onResize(e); }} />
        </>
      )}
    </div>
  );
}

// ── WhiteoutOverlay ──────────────────────────────────────────────────────────

function WhiteoutOverlay({ a, scale, selected, dupLabel, onDrag, onResize, onDelete, onSelect, onDuplicateAll }: {
  a: Annotation; scale: number; selected: boolean; dupLabel: string;
  onDrag: (e: React.PointerEvent) => void;
  onResize: (e: React.PointerEvent) => void;
  onDelete: () => void;
  onSelect: () => void;
  onDuplicateAll: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const show = hovered || selected;
  return (
    <div
      onPointerDown={onDrag}
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "absolute", left: a.x * scale, top: a.y * scale,
        width: a.w * scale, height: a.h * scale,
        background: a.color || "#FFFFFF",
        cursor: "move", boxSizing: "border-box",
        outline: selected ? "2px solid #6B5CE7" : show ? "1.5px dashed #6B5CE7" : "none",
        outlineOffset: 1,
      }}
    >
      {show && (
        <>
          <button type="button" style={DELETE_BTN} onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); onDelete(); }}>✕</button>
          <div style={RESIZE_HANDLE} onPointerDown={(e) => { e.stopPropagation(); onResize(e); }} />
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onDuplicateAll(); }}
            style={{
              position: "absolute", left: 0, top: -26, whiteSpace: "nowrap",
              background: "var(--card)", border: "1px solid var(--line-2)", borderRadius: 6,
              padding: "3px 8px", fontSize: 11, color: "var(--text)", cursor: "pointer",
              boxShadow: "0 6px 18px -6px rgba(0,0,0,0.5)", fontFamily: "inherit",
            }}
          >
            {dupLabel}
          </button>
        </>
      )}
    </div>
  );
}

// ── LinkOverlay ──────────────────────────────────────────────────────────────

function LinkOverlay({ a, scale, selected, onDelete, onSelect }: {
  a: Annotation; scale: number; selected: boolean;
  onDelete: () => void;
  onSelect: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const show = hovered || selected;
  const col = a.color || "#2563EB";
  return (
    <div
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={a.uri}
      style={{
        position: "absolute", left: a.x * scale, top: a.y * scale,
        width: a.w * scale, height: a.h * scale,
        background: `${col}14`, borderBottom: `2px solid ${col}`,
        cursor: "pointer",
        outline: selected ? `2px solid ${col}66` : "none", outlineOffset: 1,
      }}
    >
      {show && (
        <button type="button" style={DELETE_BTN} onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); onDelete(); }}>✕</button>
      )}
    </div>
  );
}

let annId = 0;
const nextId = () => `a${++annId}`;

const dragTools = new Set(["whiteout", "highlight", "strike", "shapes"]);
const MARK_COLOR: Record<string, string> = { check: "#16A34A", cross: "#DC2626", circle: "#2563EB" };

/** Approximate a text run's width (PDF points) for a freshly-placed block's bbox. */
let measureCanvas: HTMLCanvasElement | null = null;
function measureTextWidth(text: string, fontSize: number, fontName: string): number {
  if (!measureCanvas) measureCanvas = document.createElement("canvas");
  const ctx = measureCanvas.getContext("2d");
  if (!ctx) return text.length * fontSize * 0.5;
  ctx.font = `${fontSize}px ${cssFont(fontName)}`;
  return ctx.measureText(text).width;
}

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
  // Selected overlay annotation lives in the store so the toolbar can react (e.g. recolor
  // a selected highlight). Aliased here so existing call-sites stay unchanged.
  const selectedAnnotId = s.selectedAnnotId;
  const setSelectedAnnotId = s.selectAnnot;
  const [dupConfirm, setDupConfirm] = useState<Annotation | null>(null);
  const draftInputRef = useRef<HTMLInputElement>(null);
  // true once the draft is settled — guards against the focus-race blur that fires
  // the instant the autofocused input mounts (which would clear the box immediately).
  const draftReady = useRef(false);
  // set to true in onPointerDown when we commit a draft via commitDraftKeepTool,
  // so the blur that fires immediately after (focus shifting to canvas) is skipped.
  const skipNextBlurRef = useRef(false);

  // focus the draft input reliably (autoFocus alone loses the focus race on mousedown)
  useEffect(() => {
    if (!draft) { draftReady.current = false; return; }
    draftReady.current = false;
    draftInputRef.current?.focus();
    const id = setTimeout(() => { draftReady.current = true; }, 250);
    return () => clearTimeout(id);
  }, [draft]);

  // Delete/Backspace removes the selected image/stamp annotation (laptop/Mac
  // keyboards send Backspace as the delete key). Ignored while typing in a field.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Delete" && e.key !== "Backspace") return;
      if (!selectedAnnotId) return;
      const el = document.activeElement as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)) return;
      const a = s.annotations.find((x) => x.id === selectedAnnotId);
      if (a?.type === "image" || a?.type === "stamp" || a?.type === "whiteout" || a?.type === "link"
          || a?.type === "highlight" || a?.type === "comment" || a?.type === "mark") {
        e.preventDefault();
        s.removeAnnotation(selectedAnnotId);
        setSelectedAnnotId(null);
        setOpenComment((v) => (v === selectedAnnotId ? null : v));
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedAnnotId, s]);

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

  // ---- drag/resize for image and stamp overlays ----
  function beginAnnotDrag(e: React.PointerEvent, a: Annotation) {
    e.stopPropagation();
    setSelectedAnnotId(a.id);
    const start = { x: e.clientX, y: e.clientY };
    const orig = { x: a.x, y: a.y };
    const move = (ev: PointerEvent) => {
      s.updateAnnotation(a.id, {
        x: orig.x + (ev.clientX - start.x) / scale,
        y: orig.y + (ev.clientY - start.y) / scale,
      });
    };
    const up = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  function beginAnnotResize(e: React.PointerEvent, a: Annotation) {
    e.stopPropagation();
    const start = { x: e.clientX, y: e.clientY };
    const orig = { w: a.w, h: a.h };
    const move = (ev: PointerEvent) => {
      s.updateAnnotation(a.id, {
        w: Math.max(40, orig.w + (ev.clientX - start.x) / scale),
        h: Math.max(20, orig.h + (ev.clientY - start.y) / scale),
      });
    };
    const up = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  // ---- comment pin: drag to reposition, or toggle the bubble on a plain click ----
  function beginCommentDrag(e: React.PointerEvent, a: Annotation) {
    e.stopPropagation();
    setSelectedAnnotId(a.id);
    const start = { x: e.clientX, y: e.clientY };
    const orig = { x: a.x, y: a.y };
    let moved = false;
    const move = (ev: PointerEvent) => {
      if (!moved && Math.abs(ev.clientX - start.x) + Math.abs(ev.clientY - start.y) < 4) return;
      moved = true;
      s.updateAnnotation(a.id, { x: orig.x + (ev.clientX - start.x) / scale, y: orig.y + (ev.clientY - start.y) / scale });
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      if (!moved) setOpenComment((v) => (v === a.id ? null : a.id));
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

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

  // ---- whiteout: copy the selected box to every other page (one undo step) ----
  // Behind a confirmation (Wave 6C) — duplicating to a 500-page doc is hard to undo.
  function duplicateWhiteoutAllPages(a: Annotation) {
    const copies = s.pages
      .filter((pg) => pg.pageNum !== a.pageNum)
      .map((pg) => ({ ...a, id: nextId(), pageNum: pg.pageNum }));
    s.addAnnotations(copies);
  }

  function commitDrag(tool: string, start: Pt, cur: Pt) {
    const x = Math.min(start.x, cur.x), y = Math.min(start.y, cur.y);
    const w = Math.abs(cur.x - start.x), h = Math.abs(cur.y - start.y);
    if (w < 2 && h < 2) return; // ignore an accidental click without a real drag
    if (tool === "whiteout") {
      // Whiteout/blackout is now an editable annotation (Wave 6C): selectable, movable,
      // recolorable, deletable, and burned as a redaction on save.
      s.addAnnotation({
        id: nextId(), type: "whiteout", pageNum: page.pageNum, x, y,
        w: Math.max(w, 6), h: Math.max(h, 6),
        color: s.whiteoutColor,
      });
    } else if (tool === "highlight") {
      s.addAnnotation({ id: nextId(), type: "highlight", pageNum: page.pageNum, x, y, w: Math.max(w, 8), h: Math.max(h, 10), color: s.highlightColor });
    } else if (tool === "strike") {
      s.addAnnotation({ id: nextId(), type: "strike", pageNum: page.pageNum, x, y, w: Math.max(w, 8), h: Math.max(h, 6), color: s.strokeColor, strokeWidth: s.strokeWidth });
    } else if (tool === "shapes") {
      if (s.shapeType === "arrow" || s.shapeType === "line") {
        // keep the true start→end so the arrowhead points the right way
        s.addAnnotation({ id: nextId(), type: "shape", shapeType: s.shapeType, pageNum: page.pageNum, x: start.x, y: start.y, w, h, x2: cur.x, y2: cur.y, color: s.strokeColor, strokeWidth: s.strokeWidth });
      } else {
        s.addAnnotation({ id: nextId(), type: "shape", shapeType: s.shapeType, pageNum: page.pageNum, x, y, w, h, color: s.strokeColor, strokeWidth: s.strokeWidth, fill: s.shapeFill });
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
      setSelectedAnnotId(null);
      return;
    }
    const p = toPt(e);
    if (tool === "text") {
      if (draft && draftText.trim()) {
        // Commit the active draft without switching tool, then open a new draft
        // at the clicked position. skipNextBlurRef prevents the blur that fires
        // when focus shifts from the input to the canvas from double-committing.
        skipNextBlurRef.current = true;
        void commitDraftKeepTool(draft, draftText.trim());
      }
      setDraft(p);
      setDraftText("");
      return;
    }
    if (tool === "comment") {
      const a: Annotation = { id: nextId(), type: "comment", pageNum: page.pageNum, x: p.x, y: p.y, w: 0, h: 0, color: s.commentColor, text: "" };
      s.addAnnotation(a);
      setOpenComment(a.id);
      setSelectedAnnotId(a.id);
      return;
    }
    if (tool === "mark") {
      const id = nextId();
      s.addAnnotation({ id, type: "mark", markType: s.markType, pageNum: page.pageNum, x: p.x - 12, y: p.y - 12, w: 24, h: 24, color: MARK_COLOR[s.markType] });
      setSelectedAnnotId(id);
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
      const { blockId } = await apiAddText(s.sessionId, { pageNum: page.pageNum, x: at.x, y: at.y + s.fontSize, text, fontSize: s.fontSize, fontName: s.fontFamily, color: s.fontColor });
      // Register the new block locally so it's selectable + re-editable this session
      // (server already baked the text into the PNG; this pristine overlay is invisible
      // until the user edits it). bbox is approximate — enough for selection + masking.
      s.addLocalBlock({
        blockId, x: at.x, y: at.y,
        w: measureTextWidth(text, s.fontSize, s.fontFamily) + 6,
        h: s.fontSize * 1.25,
        text, fontSize: s.fontSize, fontName: s.fontFamily, color: s.fontColor,
        bold: false, italic: false,
      });
      s.bumpRender();
      analytics.editorTextEdited();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("saveFailed"));
    }
  }

  // Commits a draft using explicit values instead of state — used when onPointerDown
  // starts a new draft immediately, so tool stays "text" for the next draft.
  async function commitDraftKeepTool(at: { x: number; y: number }, text: string) {
    if (!s.sessionId) return;
    try {
      const { blockId } = await apiAddText(s.sessionId, {
        pageNum: page.pageNum, x: at.x, y: at.y + s.fontSize, text,
        fontSize: s.fontSize, fontName: s.fontFamily, color: s.fontColor,
      });
      s.addLocalBlockKeepTool({
        blockId, x: at.x, y: at.y,
        w: measureTextWidth(text, s.fontSize, s.fontFamily) + 6,
        h: s.fontSize * 1.25,
        text, fontSize: s.fontSize, fontName: s.fontFamily, color: s.fontColor,
        bold: false, italic: false,
      });
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
    : s.tool === "whiteout" || s.tool === "shapes" || s.tool === "draw" || s.tool === "highlight" || s.tool === "strike" || s.tool === "mark" ? "crosshair"
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
            pos={s.blockPositions[b.blockId]}
            blockStyle={s.blockStyles[b.blockId]}
            selected={s.selectedBlock === b.blockId || s.multiSelected.includes(b.blockId)}
            editing={s.editingBlock === b.blockId}
            onSelect={() => interactive && s.selectBlock(b.blockId)}
            onStartEdit={() => { s.setTool("select"); s.setEditing(b.blockId); }}
            onMove={(x, y) => s.moveBlock(b.blockId, x, y)}
            onInput={(text) => { s.editBlock(b.blockId, { newText: text }); analytics.editorTextEdited(); }}
            onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); s.selectBlock(b.blockId); setCtx({ x: e.clientX, y: e.clientY, blockId: b.blockId, pt: toPt(e) }); }}
          />
        ))}

        {/* annotation overlays */}
        {pageAnns.map((a) => {
          if (a.type === "highlight" || a.type === "strike" || a.type === "underline") {
            const isHl = a.type === "highlight";
            return <HighlightTool key={a.id} a={a} scale={scale} interactive={interactive} selected={isHl && selectedAnnotId === a.id} onSelect={() => { if (isHl) setSelectedAnnotId(a.id); }} onRemove={() => { s.removeAnnotation(a.id); setSelectedAnnotId(null); }} onRecolor={(c) => s.updateAnnotation(a.id, { color: c })} />;
          }
          if (a.type === "draw" || a.type === "shape")
            return <DrawingTool key={a.id} a={a} scale={scale} interactive={interactive} selected={false} onSelect={() => {}} />;
          if (a.type === "comment")
            return <CommentTool key={a.id} a={a} scale={scale} interactive={interactive} open={openComment === a.id} selected={selectedAnnotId === a.id} authorInitials={t("commentAuthorYou")} onDrag={(e) => beginCommentDrag(e, a)} onChangeText={(text) => s.updateAnnotation(a.id, { text })} onRemove={() => { s.removeAnnotation(a.id); setOpenComment(null); setSelectedAnnotId(null); }} />;
          if (a.type === "mark")
            return (
              <MarkOverlay
                key={a.id} a={a} scale={scale}
                selected={selectedAnnotId === a.id}
                onDrag={(e) => beginAnnotDrag(e, a)}
                onResize={(e) => beginAnnotResize(e, a)}
                onDelete={() => { s.removeAnnotation(a.id); setSelectedAnnotId(null); }}
                onSelect={() => setSelectedAnnotId(a.id)}
              />
            );
          if (a.type === "image" && a.imageId)
            return (
              <ImageOverlay
                key={a.id} a={a} scale={scale} sessionId={s.sessionId!}
                selected={selectedAnnotId === a.id}
                onDrag={(e) => beginAnnotDrag(e, a)}
                onResize={(e) => beginAnnotResize(e, a)}
                onDelete={() => { s.removeAnnotation(a.id); setSelectedAnnotId(null); }}
                onSelect={() => setSelectedAnnotId(a.id)}
              />
            );
          if (a.type === "stamp")
            return (
              <StampOverlay
                key={a.id} a={a} scale={scale}
                selected={selectedAnnotId === a.id}
                onDrag={(e) => beginAnnotDrag(e, a)}
                onResize={(e) => beginAnnotResize(e, a)}
                onDelete={() => { s.removeAnnotation(a.id); setSelectedAnnotId(null); }}
                onSelect={() => setSelectedAnnotId(a.id)}
              />
            );
          if (a.type === "whiteout")
            return (
              <WhiteoutOverlay
                key={a.id} a={a} scale={scale} dupLabel={t("whiteoutDuplicateAll")}
                selected={selectedAnnotId === a.id}
                onDrag={(e) => beginAnnotDrag(e, a)}
                onResize={(e) => beginAnnotResize(e, a)}
                onDelete={() => { s.removeAnnotation(a.id); setSelectedAnnotId(null); }}
                onSelect={() => setSelectedAnnotId(a.id)}
                onDuplicateAll={() => setDupConfirm(a)}
              />
            );
          if (a.type === "link")
            return (
              <LinkOverlay
                key={a.id} a={a} scale={scale}
                selected={selectedAnnotId === a.id}
                onDelete={() => { s.removeAnnotation(a.id); setSelectedAnnotId(null); }}
                onSelect={() => setSelectedAnnotId(a.id)}
              />
            );
          return null;
        })}

        {/* live freehand preview */}
        {drawPts.length > 1 && (
          <svg width={displayW} height={displayH} viewBox={`0 0 ${page.width} ${page.height}`} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
            <path d={"M " + drawPts.map((p) => `${p.x} ${p.y}`).join(" L ")} stroke={s.strokeColor} strokeWidth={s.strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}

        {/* drag preview — per-tool rendering */}
        {drag && (() => {
          const x = Math.min(drag.start.x, drag.cur.x) * scale;
          const y = Math.min(drag.start.y, drag.cur.y) * scale;
          const w = Math.abs(drag.cur.x - drag.start.x) * scale;
          const h = Math.abs(drag.cur.y - drag.start.y) * scale;
          const sc = s.strokeColor;
          const sw = s.strokeWidth;
          if (drag.tool === "whiteout") return <WhiteoutPreview rect={{ x, y, w, h }} hint={t("whiteoutHint")} />;
          if (drag.tool === "highlight")
            return <div style={{ position: "absolute", left: x, top: y, width: w, height: h, background: `${sc}60`, borderRadius: 2, pointerEvents: "none" }} />;
          if (drag.tool === "strike") {
            const midY = (drag.start.y + drag.cur.y) / 2;
            return (
              <svg width={displayW} height={displayH} viewBox={`0 0 ${page.width} ${page.height}`} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
                <line x1={drag.start.x} y1={midY} x2={drag.cur.x} y2={midY} stroke={sc} strokeWidth={sw} strokeLinecap="round" />
              </svg>
            );
          }
          if (drag.tool === "shapes") {
            const st = s.shapeType;
            const fillBg = s.shapeFill ? `${sc}33` : "transparent";
            if (st === "rectangle") return <div style={{ position: "absolute", left: x, top: y, width: w, height: h, border: `${sw}px solid ${sc}`, background: fillBg, borderRadius: 4, pointerEvents: "none" }} />;
            if (st === "circle") return <div style={{ position: "absolute", left: x, top: y, width: w, height: h, border: `${sw}px solid ${sc}`, background: fillBg, borderRadius: "50%", pointerEvents: "none" }} />;
            // arrow / line: use exact drag start→end in PDF coords
            const ang = Math.atan2(drag.cur.y - drag.start.y, drag.cur.x - drag.start.x);
            const head = Math.max(9, sw * 3);
            return (
              <svg width={displayW} height={displayH} viewBox={`0 0 ${page.width} ${page.height}`} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
                <line x1={drag.start.x} y1={drag.start.y} x2={drag.cur.x} y2={drag.cur.y} stroke={sc} strokeWidth={sw} strokeLinecap="round" />
                {st === "arrow" && (
                  <>
                    <line x1={drag.cur.x} y1={drag.cur.y} x2={drag.cur.x + head * Math.cos(ang + Math.PI - 0.5)} y2={drag.cur.y + head * Math.sin(ang + Math.PI - 0.5)} stroke={sc} strokeWidth={sw} strokeLinecap="round" />
                    <line x1={drag.cur.x} y1={drag.cur.y} x2={drag.cur.x + head * Math.cos(ang + Math.PI + 0.5)} y2={drag.cur.y + head * Math.sin(ang + Math.PI + 0.5)} stroke={sc} strokeWidth={sw} strokeLinecap="round" />
                  </>
                )}
              </svg>
            );
          }
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
              onBlur={() => { if (skipNextBlurRef.current) { skipNextBlurRef.current = false; return; } if (draftReady.current) commitDraft(); else draftInputRef.current?.focus(); }}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); commitDraft(); } if (e.key === "Escape") { setDraft(null); setDraftText(""); } }}
              placeholder={t("typeHere")}
              style={{ border: 0, outline: "none", background: "transparent", color: s.fontColor, fontFamily: cssFont(s.fontFamily), fontSize: Math.max(11, s.fontSize * scale), width: "100%", minWidth: 130 }}
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

      <ConfirmDialog
        open={dupConfirm !== null}
        message={t("whiteoutDuplicateConfirm", { count: Math.max(0, s.pages.length - 1) })}
        confirmLabel={t("whiteoutDuplicateAll")}
        cancelLabel={t("cancel")}
        onConfirm={() => { if (dupConfirm) duplicateWhiteoutAllPages(dupConfirm); setDupConfirm(null); }}
        onCancel={() => setDupConfirm(null)}
      />
    </div>
  );
}
