"use client";

import { useEffect, useState } from "react";
import { useTranslations, useFormatter } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  getRecentFiles,
  clearRecentFiles,
  RECENT_FILES_EVENT,
  type RecentFile,
} from "@/lib/recentFiles";
import { toolBySlug } from "@/lib/tools";
import { IconFile, IconTrash } from "@/components/shared/icons";

/**
 * Browser-only list of the last 10 processed files (Wave 3F). Renders nothing when
 * empty. `compact` is the dashboard-sidebar variant; otherwise a full card. Reads
 * localStorage on mount and live-updates via the RECENT_FILES_EVENT / storage events.
 */
export function RecentFiles({ compact = false }: { compact?: boolean }) {
  const t = useTranslations("RecentFiles");
  const [files, setFiles] = useState<RecentFile[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const refresh = () => setFiles(getRecentFiles());
    refresh();
    window.addEventListener(RECENT_FILES_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(RECENT_FILES_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  // Avoid hydration mismatch (server has no localStorage) and hide when empty.
  if (!mounted || files.length === 0) return null;

  return (
    <div className="pp-card" style={{ padding: compact ? 12 : 18 }}>
      <div className="mb-2.5 flex items-center justify-between gap-3">
        <h3
          className={compact ? "text-[13px] font-semibold" : "text-[15px] font-semibold"}
          style={{ color: "var(--text)" }}
        >
          {t("heading")}
        </h3>
        <button
          type="button"
          onClick={clearRecentFiles}
          className="inline-flex items-center gap-1 text-[11.5px] transition-colors hover:text-[var(--text)]"
          style={{ color: "var(--text-3)" }}
        >
          <IconTrash size={12} sw={1.7} /> {t("clear")}
        </button>
      </div>

      <ul className="flex flex-col">
        {files.map((f, i) => (
          <RecentRow key={`${f.toolSlug}-${f.filename}-${f.timestamp}`} file={f} compact={compact} last={i === files.length - 1} />
        ))}
      </ul>

      <p className="mt-2.5 text-[11px]" style={{ color: "var(--text-3)" }}>
        {t("privacy")}
      </p>
    </div>
  );
}

function RecentRow({ file, compact, last }: { file: RecentFile; compact: boolean; last: boolean }) {
  const tt = useTranslations("Tools");
  const format = useFormatter();
  const tool = toolBySlug(file.toolSlug);
  const Icon = tool?.icon ?? IconFile;
  const accent = tool?.accent ?? "#60A5FA";
  const toolName = tool ? tt(`${tool.id}.name`) : file.toolSlug;

  const row = (
    <div className="flex items-center gap-3 rounded-lg px-2 py-2">
      <div
        className="flex shrink-0 items-center justify-center rounded-[8px]"
        style={{ width: 30, height: 30, background: "rgba(127,127,127,0.06)", border: "1px solid var(--line)", color: accent }}
      >
        <Icon size={15} sw={1.7} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-medium" style={{ color: "var(--text)" }}>
          {file.filename}
        </div>
        <div className="flex items-center gap-1.5 text-[11px]" style={{ color: "var(--text-3)" }}>
          <span className="truncate">{toolName}</span>
          <span>·</span>
          <span className="pp-mono whitespace-nowrap">{format.relativeTime(new Date(file.timestamp))}</span>
          {!compact && file.sizeMB > 0 && (
            <>
              <span>·</span>
              <span className="pp-mono whitespace-nowrap">{file.sizeMB} MB</span>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <li>
      {tool ? (
        <Link href={`/${tool.slug}`} className="pp-related block rounded-lg">
          {row}
        </Link>
      ) : (
        row
      )}
      {!last && <hr className="pp-hr" style={{ margin: "0 8px" }} />}
    </li>
  );
}
