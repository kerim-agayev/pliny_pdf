"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
  useSortable,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FileDropzone } from "./FileDropzone";
import { SuccessPanel, ErrorBanner } from "./ResultPanels";
import { CloudProgress } from "./CloudProgress";
import { Spinner } from "./Spinner";
import { IconGrip, IconX, IconArrow } from "@/components/shared/icons";
import { readPageCount, isPdf } from "@/lib/pdf/common";
import { postBinary, ApiError } from "@/lib/api";
import { formatBytes, downloadBlob } from "@/lib/format";
import { analytics } from "@/lib/analytics";
import { useSession } from "@/lib/auth/client";
import { cloudMaxMB } from "@/lib/limits";

type Row = { id: string; file: File; pages: number };
type Status = "idle" | "uploading" | "done" | "error";

const ACCENTS = ["#A78BFA", "#60A5FA", "#34D399", "#F472B6"];

export function MergeTool() {
  const t = useTranslations("ToolUI");
  const tp = useTranslations("ToolPages.merge");
  const { data: session } = useSession();
  const maxMB = cloudMaxMB((session?.user as { plan?: "free" | "pro" })?.plan ?? null);
  const [rows, setRows] = useState<Row[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<{ blob: Blob; pageCount: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>();
  const idRef = useRef(0);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const totalPages = rows.reduce((s, r) => s + r.pages, 0);

  async function addFiles(files: File[]) {
    const pdfs = files.filter(isPdf);
    if (pdfs.length !== files.length) setErrorMsg(t("wrongTypePdf"));
    const next: Row[] = [];
    for (const file of pdfs) {
      let pages = 0;
      try {
        pages = await readPageCount(file);
      } catch {
        /* unreadable — still allow, page count unknown */
      }
      next.push({ id: `f${idRef.current++}`, file, pages });
    }
    setRows((prev) => [...prev, ...next]);
    if (status === "done") setStatus("idle");
  }

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (over && active.id !== over.id) {
      setRows((prev) => {
        const oldIndex = prev.findIndex((r) => r.id === active.id);
        const newIndex = prev.findIndex((r) => r.id === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  }

  async function startMerge() {
    setStatus("uploading");
    setErrorMsg(undefined);
    const t0 = performance.now();
    try {
      const { blob } = await postBinary("/api/tools/merge", rows.map((r) => r.file), "merged.pdf");
      setResult({ blob, pageCount: totalPages });
      setStatus("done");
      analytics.toolUsed("merge-pdf", performance.now() - t0);
    } catch (e) {
      setErrorMsg(e instanceof ApiError && e.status === 429 ? t("rateLimited") : e instanceof Error ? e.message : undefined);
      setStatus("error");
    }
  }

  function reset() {
    setRows([]);
    setResult(null);
    setStatus("idle");
    setErrorMsg(undefined);
  }

  if (status === "done" && result) {
    return (
      <SuccessPanel
        title={tp("successTitle")}
        meta={`merged.pdf · ${t("pagesCount", { count: result.pageCount })} · ${formatBytes(result.blob.size)}`}
        onDownload={() => downloadBlob(result.blob, "merged.pdf")}
        onReset={reset}
      />
    );
  }

  return (
    <div>
      <FileDropzone accept="pdf" multiple maxSizeMB={maxMB} onFiles={addFiles} />

      {errorMsg && <div className="mt-4"><ErrorBanner message={errorMsg} onRetry={() => setErrorMsg(undefined)} /></div>}

      {rows.length > 0 && (
        <div className="mt-7">
          <div className="mb-3.5 flex items-center justify-between">
            <div className="flex items-baseline gap-2.5">
              <h3 className="text-[15px]">{tp("filesToMerge")}</h3>
              <span className="pp-mono text-xs" style={{ color: "var(--text-3)" }}>
                {t("filesCount", { count: rows.length })} · {t("pagesCount", { count: totalPages })}
              </span>
            </div>
          </div>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={rows.map((r) => r.id)} strategy={verticalListSortingStrategy}>
              <div className="flex flex-col gap-2">
                {rows.map((row, i) => (
                  <SortableRow
                    key={row.id}
                    row={row}
                    index={i}
                    accent={ACCENTS[i % ACCENTS.length]}
                    onRemove={() => setRows((prev) => prev.filter((r) => r.id !== row.id))}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <div className="mt-6 flex flex-wrap items-center justify-end gap-2.5">
            <button type="button" className="pp-btn pp-btn-ghost pp-btn-lg" onClick={reset}>
              {t("clear")}
            </button>
            {status === "uploading" ? (
              <button type="button" className="pp-btn pp-btn-lg min-w-[180px] justify-center" disabled>
                <Spinner /> {t("converting")}
              </button>
            ) : (
              <button
                type="button"
                className="pp-btn pp-btn-lg min-w-[180px] justify-center"
                onClick={startMerge}
                disabled={rows.length < 2}
              >
                {tp("action", { count: rows.length })} <IconArrow size={15} />
              </button>
            )}
          </div>

          {status === "uploading" && <CloudProgress accent="#34D399" />}

          {status === "error" && (
            <div className="mt-4">
              <ErrorBanner message={errorMsg} note={t("cloudDeletedNote")} onRetry={() => { setStatus("idle"); setErrorMsg(undefined); }} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SortableRow({
  row,
  index,
  accent,
  onRemove,
}: {
  row: Row;
  index: number;
  accent: string;
  onRemove: () => void;
}) {
  const t = useTranslations("ToolUI");
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: row.id });
  return (
    <div
      ref={setNodeRef}
      className="pp-filerow"
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
    >
      <span className="pp-mono w-[22px] text-center text-[11px]" style={{ color: "var(--text-3)" }}>
        {String(index + 1).padStart(2, "0")}
      </span>
      <button
        type="button"
        className="cursor-grab touch-none"
        style={{ color: "var(--text-3)" }}
        aria-label="Reorder"
        {...attributes}
        {...listeners}
      >
        <IconGrip size={16} />
      </button>
      <div
        className="flex h-11 w-9 shrink-0 flex-col justify-end gap-[3px] rounded p-1.5"
        style={{ background: `linear-gradient(180deg, ${accent}28, ${accent}10)`, border: `1px solid ${accent}55` }}
      >
        {[1, 0.8, 0.6].map((w, i) => (
          <div key={i} style={{ height: 2, width: `${w * 100}%`, background: `${accent}55`, borderRadius: 1 }} />
        ))}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium" style={{ color: "var(--text)" }}>{row.file.name}</div>
        <div className="pp-mono mt-0.5 text-[11.5px]" style={{ color: "var(--text-3)" }}>
          {formatBytes(row.file.size)} · {t("pagesCount", { count: row.pages })}
        </div>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="flex size-[30px] items-center justify-center rounded-lg"
        style={{ border: "1px solid var(--line)", color: "var(--text-2)" }}
        aria-label="Remove"
      >
        <IconX size={14} />
      </button>
    </div>
  );
}
