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
import { SortableContext, arrayMove, rectSortingStrategy, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FileDropzone } from "./FileDropzone";
import { ErrorBanner } from "./ResultPanels";
import { Spinner } from "./Spinner";
import { BottomSheet } from "./EditPdf/BottomSheet";
import { IconCopy, IconRotate, IconCheck, IconX, IconUndo, IconDownload, IconGrip, IconChevron, IconTrash, IconArrowDown } from "@/components/shared/icons";
import { organizePages } from "@/lib/pdf/organizePages";
import { createThumbLoader, type Thumb, type ThumbLoader } from "@/lib/pdf/thumbnailLoader";
import { isPdf } from "@/lib/pdf/common";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
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

// Mobile list row (Wave 9D) — vertical card with grip, small thumbnail, label and a
// 3-dot menu button. Uses the same dnd-kit sortable id so the parent's onDragEnd works
// for both the desktop grid and this list (verticalListSortingStrategy).
function SortableRow({
  item,
  load,
  displayN,
  selectMode,
  selected,
  onToggle,
  onMenu,
  rotateLabel,
  duplicateLabel,
  originalLabel,
}: {
  item: WorkItem;
  load: (src: number) => Promise<Thumb>;
  displayN: number;
  selectMode: boolean;
  selected: boolean;
  onToggle: () => void;
  onMenu: () => void;
  rotateLabel: string;
  duplicateLabel: string;
  originalLabel: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.uid });
  const boxRef = useRef<HTMLDivElement>(null);
  const [thumb, setThumb] = useState<Thumb | null>(null);

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

  const w = 54;
  const h = thumb ? (thumb.h * w) / thumb.w : w * 1.3;
  const subtitle = item.dup ? duplicateLabel : item.rot % 360 !== 0 ? `${rotateLabel} ${((item.rot % 360) + 360) % 360}°` : originalLabel;
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform), transition,
        display: "flex", alignItems: "center", gap: 12, padding: 12, borderRadius: 14,
        background: isDragging ? "var(--card-hi)" : selected ? "rgba(107,92,231,0.1)" : "var(--card)",
        border: `1px solid ${isDragging || selected ? "var(--indigo)" : "var(--line)"}`,
        boxShadow: isDragging ? "0 18px 40px -14px rgba(0,0,0,0.6)" : "none",
        opacity: isDragging ? 0.95 : 1, zIndex: isDragging ? 20 : undefined,
      }}
    >
      {selectMode ? (
        <button type="button" onClick={onToggle} aria-pressed={selected} style={{ flexShrink: 0, width: 24, height: 24, borderRadius: 7, border: `2px solid ${selected ? "var(--indigo)" : "var(--line-2)"}`, background: selected ? "var(--indigo)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
          {selected && <IconCheck size={13} sw={3} />}
        </button>
      ) : (
        <span {...attributes} {...listeners} style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 44, color: "var(--text-3)", cursor: "grab", touchAction: "none" }}>
          <IconGrip size={20} />
        </span>
      )}
      <div ref={boxRef} className="overflow-hidden rounded" style={{ width: w, height: h, flexShrink: 0, border: "1px solid var(--line-2)", background: "var(--bg-2)" }}>
        {thumb && <img src={thumb.url} alt={`page ${displayN}`} draggable={false} style={{ width: w, height: h, transform: `rotate(${item.rot % 360}deg)`, transition: "transform 0.2s" }} />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>#{displayN}</div>
        <div className="pp-mono" style={{ fontSize: 11, color: item.dup ? "#6EE7B7" : "var(--text-3)", marginTop: 2 }}>{subtitle}</div>
      </div>
      {!selectMode && (
        <button type="button" onClick={onMenu} aria-label="actions" style={{ flexShrink: 0, width: 44, height: 44, borderRadius: 10, border: 0, background: "var(--bg-2)", color: "var(--text-2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ display: "flex", flexDirection: "column", gap: 3 }}>{[0, 1, 2].map((i) => <span key={i} style={{ width: 4, height: 4, borderRadius: "50%", background: "currentColor" }} />)}</span>
        </button>
      )}
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

  const isMobile = useMediaQuery("(max-width: 767px)");
  const [selectMode, setSelectMode] = useState(false);
  const [menuUid, setMenuUid] = useState<string | null>(null);

  // On touch, require a short press-and-hold before a drag starts so the list can still
  // be scrolled normally; desktop keeps the small distance threshold.
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: isMobile ? { delay: 180, tolerance: 8 } : { distance: 5 } }));
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

  // Single-item variants for the mobile 3-dot action sheet.
  function rotateUid(uid: string) {
    setItems((prev) => prev.map((it) => (it.uid === uid ? { ...it, rot: it.rot + 90 } : it)));
  }
  function duplicateUid(uid: string) {
    setItems((prev) => {
      const out: WorkItem[] = [];
      for (const it of prev) {
        out.push(it);
        if (it.uid === uid) out.push({ uid: `d${uidCounter.current++}`, src: it.src, rot: it.rot, dup: true });
      }
      return out;
    });
  }
  function deleteUid(uid: string) {
    setItems((prev) => prev.filter((it) => it.uid !== uid));
  }
  function moveUid(uid: string, where: "start" | "end") {
    setItems((prev) => {
      const sel = prev.filter((it) => it.uid === uid);
      const rest = prev.filter((it) => it.uid !== uid);
      return where === "start" ? [...sel, ...rest] : [...rest, ...sel];
    });
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
  const changeCount = rotated + deleted + duplicated;

  if (isMobile) {
    const menuIndex = menuUid ? items.findIndex((it) => it.uid === menuUid) : -1;
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
          <div style={{ minWidth: 40, display: "flex", justifyContent: "flex-end" }}>
            {changeCount > 0 ? (
              <span className="pp-mono" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 28, height: 28, padding: "0 8px", borderRadius: 999, background: "rgba(245,158,11,0.14)", border: "1px solid rgba(245,158,11,0.4)", color: "#FBBF24", fontSize: 12, fontWeight: 600 }}>{changeCount}</span>
            ) : <div style={{ width: 40 }} />}
          </div>
        </header>

        {/* select / hint row */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", background: "var(--card)", borderBottom: "1px solid var(--line)", flexShrink: 0 }}>
          <button type="button" onClick={() => { setSelectMode((v) => !v); setSelected(new Set()); }} style={{ height: 36, padding: "0 12px", borderRadius: 9, background: selectMode ? "var(--indigo)" : "var(--bg-2)", border: `1px solid ${selectMode ? "var(--indigo)" : "var(--line)"}`, color: selectMode ? "#fff" : "var(--text-2)", fontSize: 12.5, display: "inline-flex", alignItems: "center", gap: 6 }}>
            {selectMode ? <><IconX size={14} /> {tp("mobile.cancel")}</> : <><IconCheck size={14} /> {tp("mobile.select")}</>}
          </button>
          {selectMode ? (
            <>
              <span className="pp-mono" style={{ fontSize: 12, color: "#BFB5FF" }}>{selected.size} {tp("selected")}</span>
              <div style={{ flex: 1 }} />
              <button type="button" onClick={rotateSelected} disabled={selected.size === 0} aria-label={tp("rotate")} style={{ width: 40, height: 40, borderRadius: 10, border: "1px solid var(--line)", background: "var(--bg-2)", color: selected.size ? "var(--text)" : "var(--text-3)", display: "flex", alignItems: "center", justifyContent: "center" }}><IconRotate size={17} /></button>
              <button type="button" onClick={duplicateSelected} disabled={selected.size === 0} aria-label={tp("duplicate")} style={{ width: 40, height: 40, borderRadius: 10, border: "1px solid var(--line)", background: "var(--bg-2)", color: selected.size ? "var(--text)" : "var(--text-3)", display: "flex", alignItems: "center", justifyContent: "center" }}><IconCopy size={17} /></button>
              <button type="button" onClick={deleteSelected} disabled={selected.size === 0} aria-label={tp("delete")} style={{ width: 40, height: 40, borderRadius: 10, border: "1px solid var(--line)", background: "var(--bg-2)", color: selected.size ? "#F87171" : "var(--text-3)", display: "flex", alignItems: "center", justifyContent: "center" }}><IconTrash size={17} /></button>
            </>
          ) : (
            <span style={{ fontSize: 12, color: "var(--text-3)" }}>{tp("mobile.reorderHint")}</span>
          )}
        </div>

        {/* list */}
        <div style={{ flex: 1, overflow: "auto", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={items.map((i) => i.uid)} strategy={verticalListSortingStrategy}>
              {items.map((it, i) => (
                <SortableRow
                  key={it.uid}
                  item={it}
                  load={loadPage}
                  displayN={i + 1}
                  selectMode={selectMode}
                  selected={selected.has(it.uid)}
                  onToggle={() => setSelected((prev) => { const n = new Set(prev); if (n.has(it.uid)) n.delete(it.uid); else n.add(it.uid); return n; })}
                  onMenu={() => setMenuUid(it.uid)}
                  rotateLabel={tp("rotate")}
                  duplicateLabel={tp("duplicate")}
                  originalLabel={tp("mobile.original")}
                />
              ))}
            </SortableContext>
          </DndContext>
          {errorMsg && <ErrorBanner message={errorMsg} onRetry={() => setErrorMsg(undefined)} />}
        </div>

        {/* sticky apply */}
        <div style={{ flexShrink: 0, padding: "12px 16px calc(12px + env(safe-area-inset-bottom))", background: "var(--card)", borderTop: "1px solid var(--line)" }}>
          <button type="button" className="pp-btn pp-btn-lg" style={{ width: "100%", justifyContent: "center" }} onClick={save} disabled={saving || items.length === 0}>
            {saving ? <><Spinner /> {t("processing")}</> : <><IconDownload size={15} /> {tp("mobile.apply")}</>}
          </button>
          <div className="pp-mono" style={{ textAlign: "center", marginTop: 8, fontSize: 11, color: "var(--text-3)" }}>{tp("mobile.applyNote", { count: changeCount })}</div>
        </div>

        {/* per-item action sheet */}
        {menuUid && menuIndex >= 0 && (
          <BottomSheet title={tp("mobile.pageN", { n: menuIndex + 1 })} subtitle={tp("mobile.chooseAction")} onClose={() => setMenuUid(null)} maxH="56%">
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {([
                [IconRotate, tp("rotate"), false, () => rotateUid(menuUid)],
                [IconCopy, tp("duplicate"), false, () => duplicateUid(menuUid)],
                [IconArrowDown, tp("moveStart"), false, () => moveUid(menuUid, "start")],
                [IconArrowDown, tp("moveEnd"), false, () => moveUid(menuUid, "end")],
                [IconTrash, tp("delete"), true, () => deleteUid(menuUid)],
              ] as const).map(([Ic, label, danger, fn], i) => (
                <button key={i} type="button" onClick={() => { fn(); setMenuUid(null); }} style={{ display: "flex", alignItems: "center", gap: 14, height: 54, padding: "0 12px", borderRadius: 12, border: 0, background: "transparent", color: danger ? "#F87171" : "var(--text)", fontSize: 15, textAlign: "left" }}>
                  <span style={{ width: 38, height: 38, borderRadius: 10, background: danger ? "rgba(239,68,68,0.12)" : "var(--bg-2)", border: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Ic size={18} /></span>
                  {label}
                </button>
              ))}
            </div>
          </BottomSheet>
        )}
      </div>
    );
  }

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
