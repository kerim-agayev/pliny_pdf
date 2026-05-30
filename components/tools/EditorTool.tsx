"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
import {
  IconCursor, IconType, IconSticky, IconHighlight, IconStrike, IconUnderline,
  IconPen, IconRect, IconCircleShape, IconArrowDraw, IconLineShape, IconEraser,
  IconUndo, IconRedo, IconChevron, IconDownload, IconZoomIn,
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

  useEffect(() => { toolRef.current = tool; }, [tool]);
  useEffect(() => { colorRef.current = color; }, [color]);
  useEffect(() => { strokeRef.current = stroke; }, [stroke]);

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
    undoStack.current = [];
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

      setReady(true);
      await renderPage(1);
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
    if (!fc || undoStack.current.length === 0) return;
    const current = JSON.stringify(fc.toJSON());
    const prev = undoStack.current.pop()!;
    redoStack.current.push(current);
    suspendHistory.current = true;
    fc.loadFromJSON(prev).then(() => { fc.renderAll(); suspendHistory.current = false; });
  }
  function redo() {
    const fc = fcRef.current;
    if (!fc || redoStack.current.length === 0) return;
    const current = JSON.stringify(fc.toJSON());
    const next = redoStack.current.pop()!;
    undoStack.current.push(current);
    suspendHistory.current = true;
    fc.loadFromJSON(next).then(() => { fc.renderAll(); suspendHistory.current = false; });
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!(e.ctrlKey || e.metaKey)) return;
      if (e.key === "z") { e.preventDefault(); undo(); }
      else if (e.key === "y") { e.preventDefault(); redo(); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
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

  function clearAll() {
    const fc = fcRef.current;
    if (!fc) return;
    fc.getObjects().slice().forEach((o) => fc.remove(o));
    fc.renderAll();
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
          <FileDropzone accept="pdf" onFiles={onFiles} title={t("emptyTitle")} />
        </div>
        <div className="flex items-center gap-1.5 text-[12.5px]" style={{ color: "var(--text-3)" }}>
          <span className="pp-dot" style={{ color: "#34D399" }} /> {t("emptyNote")}
        </div>
        {errorMsg && <div className="w-full max-w-[520px] px-6"><ErrorBanner message={errorMsg} onRetry={() => setErrorMsg(undefined)} /></div>}
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
      <div ref={wrapRef} className="flex max-h-[70vh] justify-center overflow-auto rounded-xl p-6" style={{ background: "var(--bg-2)", border: "1px solid var(--line)" }}>
        <div className="relative" style={{ boxShadow: "var(--shadow-lg)" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img ref={pageImgRef} alt="" className="block select-none" style={{ width: baseDims.current.w * zoom, height: baseDims.current.h * zoom }} draggable={false} />
          <div className="absolute inset-0">
            <canvas ref={canvasElRef} />
          </div>
          {!ready && (
            <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.2)" }}><Spinner size={22} /></div>
          )}
        </div>
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
