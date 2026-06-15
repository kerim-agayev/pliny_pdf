"use client";

import { useCallback, useEffect, useRef, useState, type ComponentType } from "react";
import { useTranslations } from "next-intl";
import type * as Fabric from "fabric";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { FileDropzone } from "./FileDropzone";
import { SuccessPanel, ErrorBanner } from "./ResultPanels";
import { Spinner } from "./Spinner";
import { getPdfjs } from "@/lib/pdf/pdfjs";
import { exportAnnotatedPdf } from "@/lib/pdf/editorExport";
import { isPdf } from "@/lib/pdf/common";
import { downloadBlob, baseName } from "@/lib/format";
import { usePinchZoom } from "@/lib/touch";
import { analytics } from "@/lib/analytics";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import { BottomSheet } from "./EditPdf/BottomSheet";
import { MobileAnnotateToolbar, SwatchGrid, ANNOT_MOBILE_COLORS } from "./MobileAnnotateToolbar";
import {
  IconCursor, IconType, IconSticky, IconHighlight, IconStrike, IconUnderline,
  IconPen, IconRect, IconCircleShape, IconArrowDraw, IconLineShape, IconEraser,
  IconUndo, IconRedo, IconChevron, IconDownload, IconZoomIn,
  IconFile, IconCopy, IconTrash, type IconProps,
} from "@/components/shared/icons";

type Tool =
  | "select" | "text" | "sticky" | "highlight" | "strike" | "underline"
  | "pen" | "rect" | "circle" | "arrow" | "line" | "eraser";

const COLORS = ["#FACC15", "#F43F5E", "#3B82F6", "#10B981", "#0F0F0F", "#FFFFFF"];
const RENDER_SCALE = 2;

export function EditorTool() {
  const t = useTranslations("ToolPages.editor");
  const tu = useTranslations("ToolUI");

  const [file, setFile] = useState<File | null>(null);
  const [ready, setReady] = useState(false);
  const [numPages, setNumPages] = useState(0);
  const [pageNum, setPageNum] = useState(1);
  const [tool, setTool] = useState<Tool>("select");
  const [color, setColor] = useState("#FACC15");
  const [stroke, setStroke] = useState(3);
  const [zoom, setZoom] = useState(1);
  const [status, setStatus] = useState<"idle" | "processing" | "done" | "error">("idle");
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>();

  // mobile full-screen takeover UI (Wave 9B)
  const isMobile = useMediaQuery("(max-width: 767px)");
  const [pagesOpen, setPagesOpen] = useState(false);
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const [recolorOpen, setRecolorOpen] = useState(false);
  const [hasSelection, setHasSelection] = useState(false);

  const fabricRef = useRef<typeof Fabric | null>(null);
  const canvasElRef = useRef<HTMLCanvasElement>(null);
  const fcRef = useRef<Fabric.Canvas | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const pdfRef = useRef<PDFDocumentProxy | null>(null);
  const pageImgRef = useRef<HTMLImageElement>(null);
  const annotations = useRef<Record<number, string>>({});
  const baseDims = useRef<{ w: number; h: number }>({ w: 800, h: 1000 });
  const toolRef = useRef<Tool>("select");
  const colorRef = useRef(color);
  const strokeRef = useRef(stroke);
  const undoStack = useRef<string[]>([]);
  const redoStack = useRef<string[]>([]);
  const suspendHistory = useRef(false);
  const isMobileRef = useRef(false);
  const lpTimerRef = useRef(0);
  const lpTargetRef = useRef<Fabric.FabricObject | null>(null);
  const lpStartRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => { toolRef.current = tool; }, [tool]);
  useEffect(() => { colorRef.current = color; }, [color]);
  useEffect(() => { strokeRef.current = stroke; }, [stroke]);
  useEffect(() => { isMobileRef.current = isMobile; }, [isMobile]);

  // lock background scroll only while the mobile takeover is actually shown
  // (released once we leave the editor for the success panel) — Wave 9B
  useEffect(() => {
    if (!(file && isMobile) || status === "done") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [file, isMobile, status]);

  // two-finger pinch-to-zoom (single-finger touch draws via fabric's pointer events).
  // Re-bind on [file, isMobile] so the listeners attach once the canvas surface
  // actually mounts (the empty state has no wrapRef) and follow the layout swap.
  usePinchZoom(wrapRef, { getScale: () => zoom, setScale: applyZoom, panTarget: () => wrapRef.current }, [file, isMobile]);

  const snapshot = useCallback(() => {
    const fc = fcRef.current;
    if (!fc || suspendHistory.current) return;
    undoStack.current.push(JSON.stringify(fc.toJSON()));
    if (undoStack.current.length > 50) undoStack.current.shift();
    redoStack.current = [];
  }, []);

  // Render a given page: set background image + size the fabric canvas, restore annotations.
  const renderPage = useCallback(async (n: number) => {
    const fabric = fabricRef.current;
    const fc = fcRef.current;
    const pdf = pdfRef.current;
    if (!fabric || !fc || !pdf) return;
    const page = await pdf.getPage(n);
    const viewport = page.getViewport({ scale: RENDER_SCALE });
    const off = document.createElement("canvas");
    off.width = Math.ceil(viewport.width);
    off.height = Math.ceil(viewport.height);
    const ctx = off.getContext("2d")!;
    await page.render({ canvasContext: ctx, viewport, canvas: off }).promise;
    baseDims.current = { w: off.width, h: off.height };
    if (pageImgRef.current) pageImgRef.current.src = off.toDataURL("image/jpeg", 0.85);

    suspendHistory.current = true;
    fc.clear();
    fc.setDimensions({ width: off.width, height: off.height });
    const json = annotations.current[n - 1];
    if (json) await fc.loadFromJSON(json);
    fc.setZoom(1);
    fc.setDimensions({ width: off.width * zoom, height: off.height * zoom });
    fc.setZoom(zoom);
    fc.renderAll();
    suspendHistory.current = false;
    // Baseline = the page's current state. The history keeps the *current* state on
    // top of the undo stack; undo pops it and re-applies the new top, so the first
    // undo actually reverts (Wave 9B fix — previously there was no baseline and undo
    // reloaded the just-popped state, a no-op).
    undoStack.current = [JSON.stringify(fc.toJSON())];
    redoStack.current = [];
  }, [zoom]);

  const saveCurrentAnnotations = useCallback(() => {
    const fc = fcRef.current;
    if (!fc) return;
    annotations.current[pageNum - 1] = JSON.stringify(fc.toJSON());
  }, [pageNum]);

  // Initialize fabric once a file is loaded.
  useEffect(() => {
    if (!file) return;
    let disposed = false;
    (async () => {
      const fabric = await import("fabric");
      if (disposed) return;
      fabricRef.current = fabric;
      const pdfjs = await getPdfjs();
      const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
      if (disposed) return;
      pdfRef.current = pdf;
      setNumPages(pdf.numPages);

      const fc = new fabric.Canvas(canvasElRef.current!, { selection: true, preserveObjectStacking: true });
      fcRef.current = fc;

      fc.on("object:added", snapshot);
      fc.on("object:modified", snapshot);
      fc.on("object:removed", snapshot);
      fc.on("mouse:down", onMouseDown);
      fc.on("mouse:move", onMouseMove);
      fc.on("mouse:up", onMouseUp);
      fc.on("selection:created", () => setHasSelection(true));
      fc.on("selection:updated", () => setHasSelection(true));
      fc.on("selection:cleared", () => setHasSelection(false));

      setReady(true);
      await renderPage(1);
      // initial mobile fit is driven by the ResizeObserver effect (keyed on `ready`)
    })();
    return () => {
      disposed = true;
      fcRef.current?.dispose();
      fcRef.current = null;
      setReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  // Apply tool changes to the canvas drawing mode.
  useEffect(() => {
    const fabric = fabricRef.current;
    const fc = fcRef.current;
    if (!fabric || !fc) return;
    const freehand = tool === "pen" || tool === "highlight";
    fc.isDrawingMode = freehand;
    fc.selection = tool === "select";
    if (freehand) {
      const brush = new fabric.PencilBrush(fc);
      brush.color = tool === "highlight" ? hexToRgba(color, 0.4) : color;
      brush.width = tool === "highlight" ? Math.max(stroke * 6, 14) : stroke;
      fc.freeDrawingBrush = brush;
    }
    fc.forEachObject((o) => { o.selectable = tool === "select"; o.evented = tool === "select" || tool === "eraser"; });
    fc.renderAll();
  }, [tool, color, stroke, ready]);

  // ---- shape drawing ----
  const draftRef = useRef<Fabric.FabricObject | null>(null);
  const startRef = useRef<{ x: number; y: number } | null>(null);

  function pointer(opt: Fabric.TPointerEventInfo) {
    return fcRef.current!.getScenePoint(opt.e);
  }

  const onMouseDown = useCallback((opt: Fabric.TPointerEventInfo) => {
    const fabric = fabricRef.current;
    const fc = fcRef.current;
    if (!fabric || !fc) return;
    const tl = toolRef.current;
    const c = colorRef.current;
    const sw = strokeRef.current;
    const p = pointer(opt);

    // mobile: long-press a selectable object → context menu (Wave 9B).
    // Fabric (v6, pointer events) fires mouse:move with ~0 delta right after
    // mouse:down on touch; onMouseMove only cancels past a 10px threshold so the
    // timer survives a stationary hold.
    if (isMobileRef.current && tl === "select" && opt.target) {
      const e = opt.e as MouseEvent & TouchEvent;
      const tp = e.touches?.[0] ?? e;
      const mx = tp.clientX, my = tp.clientY;
      lpTargetRef.current = opt.target;
      lpStartRef.current = { x: mx, y: my };
      window.clearTimeout(lpTimerRef.current);
      lpTimerRef.current = window.setTimeout(() => {
        const fcc = fcRef.current;
        if (fcc && lpTargetRef.current) { fcc.setActiveObject(lpTargetRef.current); fcc.renderAll(); }
        setMenu({ x: mx, y: my });
      }, 500);
    }

    if (tl === "eraser") {
      const target = opt.target;
      if (target) fc.remove(target);
      return;
    }
    if (tl === "text") {
      const tb = new fabric.Textbox("Text", { left: p.x, top: p.y, fontSize: 22, fill: c, width: 180, fontFamily: "Inter, sans-serif" });
      fc.add(tb);
      fc.setActiveObject(tb);
      setTool("select");
      return;
    }
    if (tl === "sticky") {
      // An editable Textbox styled as a sticky note in the selected color
      // (double-click to re-edit). Text colour auto-contrasts the background.
      fc.isDrawingMode = false;
      const note = new fabric.Textbox("Note…", {
        left: p.x, top: p.y, width: 180, fontSize: 16,
        fill: contrastText(c), backgroundColor: c, padding: 10,
        fontFamily: "Inter, sans-serif", editable: true,
      });
      fc.add(note);
      fc.setActiveObject(note);
      note.enterEditing();
      note.selectAll();
      fc.renderAll();
      setTool("select");
      return;
    }
    if (["rect", "circle", "line", "arrow", "strike", "underline"].includes(tl)) {
      startRef.current = { x: p.x, y: p.y };
      let obj: Fabric.FabricObject;
      if (tl === "rect") {
        obj = new fabric.Rect({ left: p.x, top: p.y, width: 1, height: 1, fill: "transparent", stroke: c, strokeWidth: sw });
      } else if (tl === "circle") {
        obj = new fabric.Ellipse({ left: p.x, top: p.y, rx: 1, ry: 1, fill: "transparent", stroke: c, strokeWidth: sw });
      } else {
        obj = new fabric.Line([p.x, p.y, p.x, p.y], { stroke: c, strokeWidth: tl === "strike" || tl === "underline" ? Math.max(sw, 2) : sw });
      }
      suspendHistory.current = true;
      fc.add(obj);
      draftRef.current = obj;
    }
  }, []);

  const onMouseMove = useCallback((opt: Fabric.TPointerEventInfo) => {
    // cancel a pending long-press only once the finger really moves (>10px)
    if (lpTimerRef.current && lpStartRef.current) {
      const e = opt.e as MouseEvent & TouchEvent;
      const tp = e.touches?.[0] ?? e;
      if (Math.hypot(tp.clientX - lpStartRef.current.x, tp.clientY - lpStartRef.current.y) > 10) {
        window.clearTimeout(lpTimerRef.current); lpTimerRef.current = 0;
      }
    }
    const fc = fcRef.current;
    const draft = draftRef.current;
    const start = startRef.current;
    if (!fc || !draft || !start) return;
    const p = pointer(opt);
    const tl = toolRef.current;
    if (tl === "rect") {
      (draft as Fabric.Rect).set({ left: Math.min(start.x, p.x), top: Math.min(start.y, p.y), width: Math.abs(p.x - start.x), height: Math.abs(p.y - start.y) });
    } else if (tl === "circle") {
      (draft as Fabric.Ellipse).set({ left: Math.min(start.x, p.x), top: Math.min(start.y, p.y), rx: Math.abs(p.x - start.x) / 2, ry: Math.abs(p.y - start.y) / 2 });
    } else if (tl === "strike" || tl === "underline") {
      (draft as Fabric.Line).set({ x2: p.x, y2: start.y });
    } else {
      (draft as Fabric.Line).set({ x2: p.x, y2: p.y });
    }
    draft.setCoords();
    fc.renderAll();
  }, []);

  const onMouseUp = useCallback(() => {
    window.clearTimeout(lpTimerRef.current); lpTimerRef.current = 0;
    const fc = fcRef.current;
    if (draftRef.current && fc) {
      const tl = toolRef.current;
      if (tl === "arrow") addArrowHead(fc, draftRef.current as Fabric.Line);
      suspendHistory.current = false;
      snapshot();
    }
    draftRef.current = null;
    startRef.current = null;
  }, [snapshot]);

  function addArrowHead(fc: Fabric.Canvas, line: Fabric.Line) {
    const fabric = fabricRef.current!;
    const angle = (Math.atan2(line.y2! - line.y1!, line.x2! - line.x1!) * 180) / Math.PI;
    const head = new fabric.Triangle({
      left: line.x2, top: line.y2, originX: "center", originY: "center",
      width: 14, height: 16, fill: colorRef.current, angle: angle + 90,
    });
    fc.add(head);
  }

  // ---- actions ----
  function undo() {
    const fc = fcRef.current;
    if (!fc || undoStack.current.length <= 1) return; // keep the baseline at [0]
    const current = undoStack.current.pop()!;
    redoStack.current.push(current);
    const prev = undoStack.current[undoStack.current.length - 1];
    suspendHistory.current = true;
    fc.loadFromJSON(prev).then(() => { fc.renderAll(); suspendHistory.current = false; setHasSelection(false); });
  }
  function redo() {
    const fc = fcRef.current;
    if (!fc || redoStack.current.length === 0) return;
    const next = redoStack.current.pop()!;
    undoStack.current.push(next);
    suspendHistory.current = true;
    fc.loadFromJSON(next).then(() => { fc.renderAll(); suspendHistory.current = false; setHasSelection(false); });
  }

  // Delete the active object(s) and record an undo snapshot (mobile button + Del key).
  function deleteSelected() {
    const fc = fcRef.current;
    if (!fc) return;
    const objs = fc.getActiveObjects();
    if (!objs.length) return;
    objs.forEach((o) => fc.remove(o));
    fc.discardActiveObject();
    fc.renderAll();
    snapshot();
    setHasSelection(false);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "z") { e.preventDefault(); undo(); }
        else if (e.key === "y") { e.preventDefault(); redo(); }
        return;
      }
      // Delete / Backspace removes the selected object — unless a textbox is being
      // edited or focus is in a real input (then it's normal character deletion).
      if (e.key === "Delete" || e.key === "Backspace") {
        const fc = fcRef.current;
        const active = fc?.getActiveObject() as (Fabric.FabricObject & { isEditing?: boolean }) | undefined;
        const el = document.activeElement;
        const typing = el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement;
        if (!active || active.isEditing || typing) return;
        e.preventDefault();
        deleteSelected();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function gotoPage(n: number) {
    if (n < 1 || n > numPages || n === pageNum) return;
    saveCurrentAnnotations();
    setPageNum(n);
    await renderPage(n);
  }

  function applyZoom(z: number) {
    const fc = fcRef.current;
    setZoom(z);
    if (!fc) return;
    fc.setDimensions({ width: baseDims.current.w * z, height: baseDims.current.h * z });
    fc.setZoom(z);
    fc.renderAll();
  }

  // Mobile: scale the page so it fits entirely within the canvas area (contain),
  // centered with margins — the user never has to scroll to fit (Wave 9B).
  const fitToScreen = useCallback(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    // clientWidth/Height include the wrapper's padding (16px x, 18px y) — subtract it
    // so the page fits inside the content box (never clipped under overflow:hidden).
    const availW = wrap.clientWidth - 32;
    const availH = wrap.clientHeight - 36;
    if (availW <= 0 || availH <= 0) return;
    const z = Math.min(availW / baseDims.current.w, availH / baseDims.current.h);
    if (z > 0 && isFinite(z)) applyZoom(+z.toFixed(3));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fit the page whenever the mobile canvas area has a size or changes size
  // (initial mount, rotation, browser-chrome show/hide). A ResizeObserver is more
  // reliable than a one-shot call that can run before layout settles.
  useEffect(() => {
    if (!(isMobile && ready)) return;
    const wrap = wrapRef.current;
    if (!wrap) return;
    const raf = requestAnimationFrame(() => fitToScreen());
    const ro = new ResizeObserver(() => fitToScreen());
    ro.observe(wrap);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [isMobile, ready, fitToScreen]);

  function clearAll() {
    const fc = fcRef.current;
    if (!fc) return;
    fc.getObjects().slice().forEach((o) => fc.remove(o));
    fc.renderAll();
  }

  // ---- mobile long-press context-menu actions (operate on lpTargetRef) ----
  function closeMenu() { setMenu(null); }

  function menuDelete() {
    const fc = fcRef.current, tgt = lpTargetRef.current;
    if (fc && tgt) { fc.remove(tgt); fc.discardActiveObject(); fc.renderAll(); snapshot(); }
    closeMenu();
  }

  async function menuDuplicate() {
    const fc = fcRef.current, tgt = lpTargetRef.current;
    if (fc && tgt) {
      const clone = await tgt.clone();
      clone.set({ left: (tgt.left ?? 0) + 16, top: (tgt.top ?? 0) + 16 });
      fc.add(clone);
      fc.setActiveObject(clone);
      fc.renderAll();
      snapshot();
    }
    closeMenu();
  }

  function menuEdit() {
    const fc = fcRef.current, tgt = lpTargetRef.current as Fabric.Textbox | null;
    if (fc && tgt) {
      fc.setActiveObject(tgt);
      if (tgt.type === "textbox") { tgt.enterEditing?.(); tgt.selectAll?.(); }
      fc.renderAll();
    }
    closeMenu();
  }

  // Recolor the selected object — sticky note → background (+ contrast text),
  // text → fill, everything else → stroke.
  function recolor(c: string) {
    const fc = fcRef.current;
    const tgt = lpTargetRef.current as (Fabric.FabricObject & { backgroundColor?: string }) | null;
    if (!fc || !tgt) return;
    if (tgt.backgroundColor) tgt.set({ backgroundColor: c, fill: contrastText(c) });
    else if (tgt.type === "textbox") tgt.set({ fill: c });
    else tgt.set({ stroke: c });
    fc.renderAll();
    snapshot();
  }

  function backToStart() {
    const fc = fcRef.current;
    const dirty = (fc?.getObjects().length ?? 0) > 0 || Object.values(annotations.current).some(Boolean);
    if (dirty && !window.confirm(t("mobile.discardConfirm"))) return;
    reset();
  }

  async function onFiles(files: File[]) {
    const f = files[0];
    if (!f || !isPdf(f)) { setErrorMsg(tu("wrongTypePdf")); return; }
    annotations.current = {};
    setErrorMsg(undefined);
    setPageNum(1);
    setFile(f);
  }

  async function save() {
    if (!file) return;
    setStatus("processing");
    try {
      saveCurrentAnnotations();
      const fabric = fabricRef.current!;
      const overlays: Record<number, string> = {};
      for (const [key, json] of Object.entries(annotations.current)) {
        const sc = new fabric.StaticCanvas(document.createElement("canvas"), { width: baseDims.current.w, height: baseDims.current.h });
        await sc.loadFromJSON(json);
        sc.renderAll();
        const objs = sc.getObjects().length;
        if (objs > 0) overlays[Number(key)] = sc.toDataURL({ format: "png", multiplier: 2 });
        sc.dispose();
      }
      const blob = await exportAnnotatedPdf(file, overlays);
      setResultBlob(blob);
      setStatus("done");
      analytics.toolUsed("edit-pdf");
    } catch {
      setStatus("error");
    }
  }

  function reset() {
    setFile(null);
    setResultBlob(null);
    setStatus("idle");
    annotations.current = {};
    setErrorMsg(undefined);
  }

  if (status === "done" && resultBlob) {
    return (
      <SuccessPanel
        title={t("save")}
        meta={`${baseName(file!.name)}-annotated.pdf`}
        onDownload={() => downloadBlob(resultBlob, `${baseName(file!.name)}-annotated.pdf`)}
        onReset={reset}
      />
    );
  }

  if (!file) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl py-16" style={{ border: "1.5px dashed var(--line-2)", background: "var(--bg-2)" }}>
        <div className="w-full max-w-[520px] px-6">
          <FileDropzone toolId="edit" accept="pdf" checkPages onFiles={onFiles} title={t("emptyTitle")} />
        </div>
        <div className="flex items-center gap-1.5 text-[12.5px]" style={{ color: "var(--text-3)" }}>
          <span className="pp-dot" style={{ color: "#34D399" }} /> {t("emptyNote")}
        </div>
        {errorMsg && <div className="w-full max-w-[520px] px-6"><ErrorBanner message={errorMsg} onRetry={() => setErrorMsg(undefined)} /></div>}
      </div>
    );
  }

  // The page image + Fabric overlay — rendered once, reused by both layouts so
  // the canvas element (and its bound Fabric instance) never remounts.
  const canvasSurface = (
    <div className="relative" style={{ boxShadow: "var(--shadow-lg)", height: "fit-content" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img ref={pageImgRef} alt="" className="block select-none" style={{ width: baseDims.current.w * zoom, height: baseDims.current.h * zoom }} draggable={false} />
      <div className="absolute inset-0" style={{ touchAction: "none" }}>
        <canvas ref={canvasElRef} />
      </div>
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.2)" }}><Spinner size={22} /></div>
      )}
    </div>
  );

  // ── Mobile: full-screen takeover (Wave 9B) ──────────────────────────────────
  if (isMobile) {
    const ctrlBtn: React.CSSProperties = { width: 44, height: 44, borderRadius: 9, background: "transparent", border: 0, color: "var(--text)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" };
    const navBtn: React.CSSProperties = { ...ctrlBtn, color: "var(--text-2)" };
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", flexDirection: "column", background: "var(--bg)" }}>
        {/* header */}
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "env(safe-area-inset-top) 10px 0", height: `calc(52px + env(safe-area-inset-top))`, flexShrink: 0, background: "var(--card)", borderBottom: "1px solid var(--line)" }}>
          <button type="button" onClick={backToStart} aria-label={t("mobile.back")} style={{ ...ctrlBtn, color: "var(--text)" }}>
            <IconChevron size={20} style={{ transform: "rotate(180deg)" }} />
          </button>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", lineHeight: 1.18, minWidth: 0, padding: "0 8px" }}>
            <span style={{ fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{t("mobile.title")}</span>
            <span className="pp-mono" style={{ fontSize: 10, color: "var(--text-3)", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.name}</span>
          </div>
          <button type="button" onClick={save} disabled={status === "processing"} className="pp-btn" style={{ minWidth: 44, minHeight: 44, padding: "8px 12px", position: "relative", justifyContent: "center" }}>
            {status === "processing" ? <Spinner /> : <IconDownload size={16} />}
            <span style={{ position: "absolute", top: 6, right: 6, width: 7, height: 7, borderRadius: "50%", background: "#FACC15", border: "1.5px solid var(--card)" }} />
          </button>
        </header>

        {/* secondary controls: undo/redo + page nav */}
        <div style={{ display: "flex", alignItems: "center", gap: 2, padding: "0 8px", height: 48, flexShrink: 0, background: "var(--card)", borderBottom: "1px solid var(--line)" }}>
          <button type="button" onClick={undo} aria-label={t("tools.undo")} style={ctrlBtn}><IconUndo size={18} /></button>
          <button type="button" onClick={redo} aria-label={t("tools.redo")} style={navBtn}><IconRedo size={18} /></button>
          <div style={{ flex: 1 }} />
          <button type="button" onClick={() => gotoPage(pageNum - 1)} disabled={pageNum <= 1} style={{ ...navBtn, opacity: pageNum <= 1 ? 0.4 : 1 }}><IconChevron size={16} style={{ transform: "rotate(180deg)" }} /></button>
          <span className="pp-mono" style={{ fontSize: 12.5, color: "var(--text)", minWidth: 46, textAlign: "center" }}>{pageNum}/{numPages}</span>
          <button type="button" onClick={() => gotoPage(pageNum + 1)} disabled={pageNum >= numPages} style={{ ...navBtn, opacity: pageNum >= numPages ? 0.4 : 1 }}><IconChevron size={16} /></button>
        </div>

        {/* canvas — flex:1 + minHeight:0 so it only ever fills the space BETWEEN the
            bars (top bar + toolbar stay visible); overflow:hidden so the page can never
            escape the wrapper (no upward overflow, no left/right scroll). fitToScreen()
            scales the page to fit, centered with margins. */}
        <div ref={wrapRef} style={{ flex: 1, minHeight: 0, minWidth: 0, position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", padding: "18px 16px", background: "repeating-linear-gradient(45deg, rgba(127,127,127,0.04) 0 1px, transparent 1px 16px), var(--bg-2)", touchAction: "none", userSelect: "none", WebkitUserSelect: "none", WebkitTouchCallout: "none" }}>
          {canvasSurface}
          {hasSelection && (
            <button type="button" onClick={deleteSelected} aria-label={t("mobile.menuDelete")}
              style={{ position: "absolute", right: 14, bottom: 14, width: 48, height: 48, borderRadius: 999, background: "var(--rose)", border: "none", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 10px 26px -10px rgba(244,63,94,0.7)", cursor: "pointer" }}>
              <IconTrash size={20} sw={1.9} />
            </button>
          )}
          <div style={{ position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)", display: "flex", alignItems: "center", gap: 7, padding: "6px 12px", borderRadius: 999, background: "rgba(15,15,15,0.7)", backdropFilter: "blur(6px)", border: "1px solid var(--line-2)", fontSize: 11, color: "var(--text-2)", whiteSpace: "nowrap", pointerEvents: "none" }}>
            <IconZoomIn size={13} /> {t("mobile.hint")}
          </div>
          <button type="button" onClick={() => setPagesOpen(true)} style={{ position: "absolute", left: 14, bottom: 14, height: 44, padding: "0 16px", borderRadius: 999, background: "var(--card)", border: "1px solid var(--line-2)", color: "var(--text)", fontSize: 13, fontWeight: 500, display: "flex", alignItems: "center", gap: 8, boxShadow: "0 10px 26px -10px rgba(0,0,0,0.55)", cursor: "pointer" }}>
            <IconFile size={15} /> {t("mobile.pages")}
          </button>
        </div>

        {/* bottom-fixed toolbar + option sheets */}
        <MobileAnnotateToolbar
          tool={tool} color={color} stroke={stroke}
          onPickTool={(id) => setTool(id as Tool)} onColor={setColor} onStroke={setStroke}
        />

        {/* pages drawer */}
        {pagesOpen && (
          <BottomSheet title={t("mobile.pages")} subtitle={t("mobile.pagesSub", { count: numPages })} onClose={() => setPagesOpen(false)}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
              {Array.from({ length: numPages }).map((_, i) => {
                const n = i + 1, sel = n === pageNum;
                return (
                  <button key={n} type="button" onClick={() => { void gotoPage(n); setPagesOpen(false); }}
                    style={{ position: "relative", aspectRatio: "0.77", borderRadius: 8, cursor: "pointer", background: "#fff", border: sel ? "2px solid var(--indigo)" : "1px solid var(--line-2)", display: "flex", alignItems: "flex-end", justifyContent: "center", padding: 6, boxShadow: "0 4px 12px -6px rgba(0,0,0,0.4)" }}>
                    <span className="pp-mono" style={{ fontSize: 11, color: "#1f1f1f", fontWeight: sel ? 700 : 500 }}>{n}</span>
                  </button>
                );
              })}
            </div>
          </BottomSheet>
        )}

        {/* recolor sheet (from the long-press menu) */}
        {recolorOpen && (
          <BottomSheet title={t("mobile.menuColor")} maxH="48%" onClose={() => setRecolorOpen(false)}>
            <SwatchGrid palette={ANNOT_MOBILE_COLORS} onPick={(c) => { recolor(c); setRecolorOpen(false); }} />
          </BottomSheet>
        )}

        {/* long-press context menu */}
        {menu && (
          <MobileContextMenu
            x={menu.x} y={menu.y} t={t}
            // defer opening the color sheet so the menu tap's trailing `click`
            // doesn't land on the sheet backdrop and immediately dismiss it
            onColor={() => { closeMenu(); window.setTimeout(() => setRecolorOpen(true), 120); }}
            onDuplicate={menuDuplicate} onEdit={menuEdit} onDelete={menuDelete} onClose={closeMenu}
          />
        )}
      </div>
    );
  }

  const groups: { tools: { id: Tool; Icon: typeof IconCursor; label: string }[] }[] = [
    { tools: [{ id: "select", Icon: IconCursor, label: t("tools.select") }] },
    { tools: [{ id: "text", Icon: IconType, label: t("tools.text") }, { id: "sticky", Icon: IconSticky, label: t("tools.sticky") }] },
    { tools: [{ id: "highlight", Icon: IconHighlight, label: t("tools.highlight") }, { id: "strike", Icon: IconStrike, label: t("tools.strike") }, { id: "underline", Icon: IconUnderline, label: t("tools.underline") }] },
    { tools: [{ id: "pen", Icon: IconPen, label: t("tools.pen") }, { id: "rect", Icon: IconRect, label: t("tools.rect") }, { id: "circle", Icon: IconCircleShape, label: t("tools.circle") }, { id: "arrow", Icon: IconArrowDraw, label: t("tools.arrow") }, { id: "line", Icon: IconLineShape, label: t("tools.line") }] },
    { tools: [{ id: "eraser", Icon: IconEraser, label: t("tools.eraser") }] },
  ];

  return (
    <div className="flex flex-col gap-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl p-2" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
        {groups.map((g, gi) => (
          <div key={gi} className="flex items-center gap-1">
            {gi > 0 && <span className="mx-1 h-6 w-px" style={{ background: "var(--line)" }} />}
            {g.tools.map(({ id, Icon, label }) => {
              const active = tool === id;
              return (
                <button
                  key={id}
                  type="button"
                  title={label}
                  onClick={() => setTool(id)}
                  className="flex size-9 items-center justify-center rounded-lg transition-colors"
                  style={{ background: active ? "rgba(107,92,231,0.18)" : "transparent", color: active ? "#BFB5FF" : "var(--text-2)", border: active ? "1px solid rgba(107,92,231,0.3)" : "1px solid transparent" }}
                >
                  <Icon size={17} sw={1.7} />
                </button>
              );
            })}
          </div>
        ))}

        <span className="mx-1 h-6 w-px" style={{ background: "var(--line)" }} />
        <div className="flex items-center gap-1.5">
          {COLORS.map((c) => (
            <button key={c} type="button" onClick={() => setColor(c)} className="size-6 rounded-md" aria-label={c}
              style={{ background: c, boxShadow: color === c ? `0 0 0 2px var(--card), 0 0 0 4px ${c}` : "inset 0 0 0 1px rgba(127,127,127,0.4)" }} />
          ))}
        </div>
        <input className="pp-range ml-1 w-20" type="range" min={1} max={12} value={stroke} onChange={(e) => setStroke(Number(e.target.value))} title="Stroke width" />

        <span className="mx-1 h-6 w-px" style={{ background: "var(--line)" }} />
        <button type="button" title={t("tools.undo")} onClick={undo} className="flex size-9 items-center justify-center rounded-lg" style={{ color: "var(--text-2)" }}><IconUndo size={17} sw={1.7} /></button>
        <button type="button" title={t("tools.redo")} onClick={redo} className="flex size-9 items-center justify-center rounded-lg" style={{ color: "var(--text-2)" }}><IconRedo size={17} sw={1.7} /></button>

        <div className="ml-auto flex items-center gap-2">
          <button type="button" onClick={() => applyZoom(Math.max(0.5, +(zoom - 0.25).toFixed(2)))} className="flex size-8 items-center justify-center rounded-lg" style={{ color: "var(--text-2)" }}>−</button>
          <span className="pp-mono inline-flex items-center gap-1 text-[12px]" style={{ color: "var(--text-2)" }}><IconZoomIn size={13} /> {Math.round(zoom * 100)}%</span>
          <button type="button" onClick={() => applyZoom(Math.min(2, +(zoom + 0.25).toFixed(2)))} className="flex size-8 items-center justify-center rounded-lg" style={{ color: "var(--text-2)" }}>+</button>
        </div>
      </div>

      {/* Canvas area */}
      <div ref={wrapRef} className="relative flex max-h-[70vh] justify-center overflow-auto rounded-xl p-6" style={{ background: "var(--bg-2)", border: "1px solid var(--line)" }}>
        {canvasSurface}
        {hasSelection && (
          <button type="button" onClick={deleteSelected} title={t("mobile.menuDelete")}
            className="absolute right-4 top-4 flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px]"
            style={{ background: "var(--rose)", color: "#fff", boxShadow: "0 8px 22px -10px rgba(244,63,94,0.7)" }}>
            <IconTrash size={15} sw={1.8} /> {t("mobile.menuDelete")}
          </button>
        )}
      </div>

      {/* Bottom bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl px-4 py-3" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
        <div className="pp-mono text-[12px]" style={{ color: "var(--text-3)" }}>{file.name}</div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => gotoPage(pageNum - 1)} disabled={pageNum <= 1} className="flex size-8 items-center justify-center rounded-lg disabled:opacity-40" style={{ border: "1px solid var(--line)", color: "var(--text-2)" }}>
            <IconChevron size={13} style={{ transform: "rotate(180deg)" }} />
          </button>
          <span className="pp-mono text-[12px]" style={{ color: "var(--text-2)" }}>{pageNum} / {numPages}</span>
          <button type="button" onClick={() => gotoPage(pageNum + 1)} disabled={pageNum >= numPages} className="flex size-8 items-center justify-center rounded-lg disabled:opacity-40" style={{ border: "1px solid var(--line)", color: "var(--text-2)" }}>
            <IconChevron size={13} />
          </button>
        </div>
        <div className="flex items-center gap-2.5">
          <button type="button" className="pp-btn pp-btn-ghost" style={{ padding: "8px 14px" }} onClick={clearAll}>{t("clearAll")}</button>
          <button type="button" className="pp-btn" style={{ padding: "8px 16px" }} onClick={save} disabled={status === "processing"}>
            {status === "processing" ? <><Spinner /> {tu("processing")}</> : <><IconDownload size={15} /> {t("save")}</>}
          </button>
        </div>
      </div>

      {status === "error" && <ErrorBanner onRetry={() => setStatus("idle")} />}
    </div>
  );
}

/** Long-press menu floating at the touch point (Wave 9B). Mirrors the design's
 *  AnnotContextMenu: Change color / Duplicate / Edit / Delete. Closes on outside tap. */
function MobileContextMenu({
  x, y, t, onColor, onDuplicate, onEdit, onDelete, onClose,
}: {
  x: number; y: number; t: ReturnType<typeof useTranslations>;
  onColor: () => void; onDuplicate: () => void; onEdit: () => void; onDelete: () => void; onClose: () => void;
}) {
  useEffect(() => {
    const close = () => onClose();
    // defer so the long-press's own touchend doesn't immediately dismiss it
    const id = window.setTimeout(() => {
      window.addEventListener("pointerdown", close);
      window.addEventListener("scroll", close, true);
    }, 0);
    return () => { window.clearTimeout(id); window.removeEventListener("pointerdown", close); window.removeEventListener("scroll", close, true); };
  }, [onClose]);

  const rows: [ComponentType<IconProps>, string, () => void, boolean][] = [
    [IconHighlight, t("mobile.menuColor"), onColor, false],
    [IconCopy, t("mobile.menuDuplicate"), onDuplicate, false],
    [IconType, t("mobile.menuEdit"), onEdit, false],
    [IconTrash, t("mobile.menuDelete"), onDelete, true],
  ];
  const left = Math.min(Math.max(8, x - 94), (typeof window !== "undefined" ? window.innerWidth : 375) - 196);
  const top = Math.min(Math.max(8, y + 8), (typeof window !== "undefined" ? window.innerHeight : 812) - 220);

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      style={{ position: "fixed", left, top, zIndex: 95, width: 188, background: "var(--card)", border: "1px solid var(--line-2)", borderRadius: 14, padding: 6, boxShadow: "0 20px 50px -16px rgba(0,0,0,0.6)" }}
    >
      {rows.map(([Ic, label, action, danger]) => (
        <button key={label} type="button" onPointerDown={(e) => { e.stopPropagation(); action(); }}
          style={{ width: "100%", display: "flex", alignItems: "center", gap: 11, padding: "12px", borderRadius: 9, border: 0, background: "transparent", color: danger ? "#F87171" : "var(--text)", fontSize: 14, cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}>
          <Ic size={17} sw={1.7} /> {label}
        </button>
      ))}
    </div>
  );
}

function hexToRgba(hex: string, alpha: number) {
  const m = hex.replace("#", "");
  const n = parseInt(m.length === 3 ? m.split("").map((c) => c + c).join("") : m, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

/** Pick dark or light text for readable contrast against a hex background. */
function contrastText(hex: string) {
  const m = hex.replace("#", "");
  const n = parseInt(m.length === 3 ? m.split("").map((c) => c + c).join("") : m, 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#1F2937" : "#FFFFFF";
}
