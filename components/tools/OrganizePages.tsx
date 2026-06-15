"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, rectSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FileDropzone } from "./FileDropzone";
import { ErrorBanner } from "./ResultPanels";
import { Spinner } from "./Spinner";
import { IconCopy, IconRotate, IconCheck, IconX, IconUndo, IconDownload, IconGrip } from "@/components/shared/icons";
import { organizePages } from "@/lib/pdf/organizePages";
import { createThumbLoader, type Thumb, type ThumbLoader } from "@/lib/pdf/thumbnailLoader";
import { isPdf } from "@/lib/pdf/common";
import { downloadBlob, baseName, MAX_FILE_BYTES } from "@/lib/format";
import { analytics } from "@/lib/analytics";

type Status = "idle" | "loading" | "ready" | "error";
interface WorkItem {
  uid: string;
  src: number;
  rot: number;
  dup?: boolean;
}

function SortableThumb({
  item,
  load,
  displayN,
  selected,
  onSelect,
}: {
  item: WorkItem;
  load: (src: number) => Promise<Thumb>;
  displayN: number;
  selected: boolean;
  onSelect: (e: React.MouseEvent) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.uid });
  const boxRef = useRef<HTMLDivElement>(null);
  const [thumb, setThumb] = useState<Thumb | null>(null);

  // Lazy-load this page's thumbnail once it scrolls near the viewport.
  useEffect(() => {
    const el = boxRef.current;
    if (!el || thumb) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          load(item.src).then(setThumb).catch(() => {});
        }
      },
      { rootMargin: "300px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [thumb, item.src, load]);

  const w = 150;
  const h = thumb ? (thumb.h * w) / thumb.w : w * 1.3;
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1, zIndex: isDragging ? 20 : undefined }}
      className="flex justify-center"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        onClick={onSelect}
        className="relative cursor-grab active:cursor-grabbing"
        style={{ width: w }}
      >
        <div
          ref={boxRef}
          className="overflow-hidden rounded-md"
          style={{
            width: w,
            height: h,
            border: selected ? "2px solid var(--indigo)" : "1px solid var(--line-2)",
            boxShadow: selected ? "0 0 0 4px rgba(107,92,231,0.16), 0 12px 28px -12px rgba(0,0,0,0.6)" : "0 6px 16px -8px rgba(0,0,0,0.5)",
            background: "var(--bg-2)",
          }}
        >
          {thumb && (
            <img
              src={thumb.url}
              alt={`page ${displayN}`}
              draggable={false}
              style={{ width: w, height: h, transform: `rotate(${item.rot % 360}deg)`, transition: "transform 0.2s" }}
            />
          )}
        </div>
        {/* page number badge */}
        <span
          className="pp-mono absolute left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-2 py-px text-[10px]"
          style={{ bottom: -9, background: selected ? "var(--indigo)" : "var(--card)", border: `1px solid ${selected ? "var(--indigo)" : "var(--line-2)"}`, color: selected ? "#fff" : "var(--text-2)" }}
        >
          {displayN}
        </span>
        {item.dup && (
          <span className="absolute left-1.5 top-1.5 rounded-full px-1.5 py-0.5 text-[9.5px] font-semibold tracking-[0.04em] text-white" style={{ background: "rgba(16,185,129,0.92)" }}>
            COPY
          </span>
        )}
        {item.rot % 360 !== 0 && !selected && (
          <span className="absolute right-1.5 top-1.5 flex size-5 items-center justify-center rounded-[5px] text-white" style={{ background: "rgba(245,158,11,0.92)" }}>
            <IconRotate size={12} sw={2} />
          </span>
        )}
        {selected && (
          <span className="absolute right-1.5 top-1.5 flex size-5 items-center justify-center rounded-full text-white" style={{ background: "var(--indigo)", border: "2px solid var(--bg)" }}>
            <IconCheck size={11} sw={2.6} />
          </span>
        )}
      </button>
    </div>
  );
}

export function OrganizePages() {
  const t = useTranslations("ToolUI");
  const tp = useTranslations("ToolPages.organizePages");
  const [file, setFile] = useState<File | null>(null);
  const loaderRef = useRef<ThumbLoader | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string>();
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState<WorkItem[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const lastIndex = useRef<number | null>(null);
  const uidCounter = useRef(0);
  const initial = useRef<WorkItem[]>([]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const loadPage = useCallback((src: number) => loaderRef.current!.renderPage(src, 0.5), []);

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
    loaderRef.current?.destroy();
    const loader = createThumbLoader(f);
    loaderRef.current = loader;
    try {
      const n = await loader.pageCount();
      const init = Array.from({ length: n }, (_, i) => ({ uid: `o${i}`, src: i, rot: 0 }));
      uidCounter.current = n;
      setPageCount(n);
      setItems(init);
      initial.current = init;
      setSelected(new Set());
      lastIndex.current = null;
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }

  function onSelect(index: number, e: React.MouseEvent) {
    const uid = items[index].uid;
    if (e.shiftKey && lastIndex.current !== null) {
      const [a, b] = [lastIndex.current, index].sort((x, y) => x - y);
      setSelected(new Set(items.slice(a, b + 1).map((it) => it.uid)));
      return;
    }
    if (e.ctrlKey || e.metaKey) {
      setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(uid)) next.delete(uid);
        else next.add(uid);
        return next;
      });
    } else {
      setSelected((prev) => (prev.size === 1 && prev.has(uid) ? new Set() : new Set([uid])));
    }
    lastIndex.current = index;
  }

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    setItems((prev) => {
      const from = prev.findIndex((i) => i.uid === active.id);
      const to = prev.findIndex((i) => i.uid === over.id);
      return arrayMove(prev, from, to);
    });
    lastIndex.current = null;
  }

  function duplicateSelected() {
    setItems((prev) => {
      const out: WorkItem[] = [];
      for (const it of prev) {
        out.push(it);
        if (selected.has(it.uid)) out.push({ uid: `d${uidCounter.current++}`, src: it.src, rot: it.rot, dup: true });
      }
      return out;
    });
    setSelected(new Set());
  }
  function rotateSelected() {
    setItems((prev) => prev.map((it) => (selected.has(it.uid) ? { ...it, rot: it.rot + 90 } : it)));
  }
  function deleteSelected() {
    setItems((prev) => prev.filter((it) => !selected.has(it.uid)));
    setSelected(new Set());
    lastIndex.current = null;
  }
  function moveSelected(where: "start" | "end") {
    setItems((prev) => {
      const sel = prev.filter((it) => selected.has(it.uid));
      const rest = prev.filter((it) => !selected.has(it.uid));
      return where === "start" ? [...sel, ...rest] : [...rest, ...sel];
    });
  }

  function resetAll() {
    setItems(initial.current.map((it) => ({ ...it })));
    setSelected(new Set());
    lastIndex.current = null;
  }

  async function save() {
    if (!file || items.length === 0) return;
    setSaving(true);
    setErrorMsg(undefined);
    try {
      const blob = await organizePages(file, items.map(({ src, rot }) => ({ src, rot })));
      downloadBlob(blob, `${baseName(file.name)}-organized.pdf`);
      analytics.toolUsed("organize-pages");
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
    setPageCount(0);
    setItems([]);
    setSelected(new Set());
    setStatus("idle");
    setErrorMsg(undefined);
  }

  if (!file) {
    return (
      <div>
        <FileDropzone toolId="organize-pages" accept="pdf" checkPages onFiles={onFiles} title={tp("emptyTitle")} />
        {errorMsg && (
          <div className="mt-4">
            <ErrorBanner message={errorMsg} onRetry={() => setErrorMsg(undefined)} />
          </div>
        )}
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center gap-2 py-24" style={{ color: "var(--text-3)" }}>
        <Spinner size={18} /> {t("processing")}
      </div>
    );
  }

  const distinct = new Set(items.map((i) => i.src)).size;
  const deleted = pageCount - distinct;
  const duplicated = items.length - distinct;
  const rotated = items.filter((i) => i.rot % 360 !== 0).length;

  return (
    <div className="flex flex-col gap-5">
      {/* Changes bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl px-4 py-3" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
        <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1 text-[13px]" style={{ color: "var(--text-2)" }}>
          <span><span className="pp-mono" style={{ color: "var(--text)" }}>{items.length}</span> {tp("pages")}</span>
          <span style={{ color: "var(--line-2)" }}>·</span>
          <span><span className="pp-mono" style={{ color: "var(--text)" }}>{rotated}</span> {tp("rotated")}</span>
          <span style={{ color: "var(--line-2)" }}>·</span>
          <span><span className="pp-mono" style={{ color: "#F87171" }}>{deleted}</span> {tp("deleted")}</span>
          <span style={{ color: "var(--line-2)" }}>·</span>
          <span><span className="pp-mono" style={{ color: "#6EE7B7" }}>{duplicated}</span> {tp("duplicated")}</span>
        </div>
        <div className="flex items-center gap-2.5">
          <button type="button" className="pp-btn pp-btn-ghost" style={{ padding: "7px 14px", fontSize: 13 }} onClick={resetAll}>
            <IconUndo size={14} /> {tp("reset")}
          </button>
          <button type="button" className="pp-btn" onClick={save} disabled={saving || items.length === 0}>
            {saving ? <><Spinner /> {t("processing")}</> : <><IconDownload size={14} /> {tp("save")}</>}
          </button>
        </div>
      </div>

      {/* Floating selection toolbar */}
      {selected.size > 0 && (
        <div
          className="sticky top-20 z-[15] mx-auto flex w-fit max-w-full flex-wrap items-center justify-center gap-1 p-1.5"
          style={{ background: "var(--card-hi)", border: "1px solid var(--line-2)", borderRadius: 14, boxShadow: "0 16px 40px -16px rgba(0,0,0,0.6), 0 0 0 1px rgba(107,92,231,0.2)" }}
        >
          <div className="flex items-center gap-2 pl-2 pr-3">
            <span className="flex size-[22px] items-center justify-center rounded-md text-[11px] font-semibold text-white" style={{ background: "var(--indigo)" }}>{selected.size}</span>
            <span className="text-[13px] font-medium">{tp("selected")}</span>
          </div>
          <div style={{ width: 1, height: 22, background: "var(--line)" }} />
          <button type="button" className="pp-related flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px]" onClick={duplicateSelected}>
            <IconCopy size={15} sw={1.7} /> {tp("duplicate")}
          </button>
          <button type="button" className="pp-related flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px]" onClick={rotateSelected}>
            <IconRotate size={15} sw={1.7} /> {tp("rotate")}
          </button>
          <button type="button" className="pp-related flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px]" onClick={() => moveSelected("start")}>
            {tp("moveStart")}
          </button>
          <button type="button" className="pp-related flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px]" onClick={() => moveSelected("end")}>
            {tp("moveEnd")}
          </button>
          <div style={{ width: 1, height: 22, background: "var(--line)" }} />
          <button type="button" className="pp-related flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px]" style={{ color: "#F87171" }} onClick={deleteSelected}>
            <IconX size={14} sw={2} /> {tp("delete")}
          </button>
        </div>
      )}

      {/* Grid */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={items.map((i) => i.uid)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-2 gap-x-5 gap-y-7 px-1 py-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
            {items.map((it, i) => (
              <SortableThumb
                key={it.uid}
                item={it}
                load={loadPage}
                displayN={i + 1}
                selected={selected.has(it.uid)}
                onSelect={(e) => onSelect(i, e)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Hint */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-3.5 text-center text-[12.5px]" style={{ color: "var(--text-3)" }}>
        <span className="inline-flex items-center gap-1.5"><IconGrip size={13} /> {tp("hintDrag")}</span>
        <span style={{ color: "var(--line-2)" }}>·</span>
        <span>{tp("hintMulti")}</span>
        <span style={{ color: "var(--line-2)" }}>·</span>
        <span>{tp("hintRange")}</span>
      </div>

      {errorMsg && (
        <div className="mx-auto w-full max-w-md">
          <ErrorBanner message={errorMsg} onRetry={() => setErrorMsg(undefined)} />
        </div>
      )}

      <div className="flex justify-center">
        <button type="button" className="text-[12.5px] underline" style={{ color: "var(--text-3)" }} onClick={reset}>
          {tp("startOver")}
        </button>
      </div>
    </div>
  );
}
