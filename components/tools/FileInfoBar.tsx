"use client";

import { useTranslations } from "next-intl";
import { IconFile, IconX } from "@/components/shared/icons";
import { formatBytes } from "@/lib/format";

export function FileInfoBar({
  file,
  pages,
  onRemove,
}: {
  file: File;
  pages?: number;
  onRemove: () => void;
}) {
  const t = useTranslations("ToolUI");
  return (
    <div className="pp-filerow">
      <div
        className="flex size-9 shrink-0 items-center justify-center rounded-[9px]"
        style={{ background: "rgba(127,127,127,0.06)", border: "1px solid var(--line)", color: "#BFB5FF" }}
      >
        <IconFile size={17} sw={1.7} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium" style={{ color: "var(--text)" }}>{file.name}</div>
        <div className="pp-mono mt-0.5 text-[11.5px]" style={{ color: "var(--text-3)" }}>
          {formatBytes(file.size)}
          {pages !== undefined ? ` · ${t("pagesCount", { count: pages })}` : ""}
        </div>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="flex size-[30px] items-center justify-center rounded-lg"
        style={{ border: "1px solid var(--line)", color: "var(--text-2)" }}
        aria-label="Remove"
        aria-keyshortcuts="Escape"
        data-pp-shortcut="reset"
      >
        <IconX size={14} />
      </button>
    </div>
  );
}
