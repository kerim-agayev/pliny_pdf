"use client";

import { useTranslations } from "next-intl";

/**
 * Determinate progress panel for the local Web-Worker tools (Phase 5C). Shows
 * "Processing page X of Y… NN%" with a filled bar — the work runs off the main
 * thread, so the UI stays responsive while this advances.
 */
export function ProgressPanel({ page, total }: { page: number; total: number }) {
  const t = useTranslations("ToolUI");
  const pct = total > 0 ? Math.round((page / total) * 100) : 0;
  return (
    <div className="mt-4 rounded-xl p-4" style={{ background: "var(--bg-2)", border: "1px solid var(--line)" }}>
      <div className="flex items-center justify-between gap-3">
        <div className="text-[13px]" style={{ color: "var(--text)" }}>
          {t("processingPage", { n: page, total })}
        </div>
        <span className="pp-mono text-[12px]" style={{ color: "var(--text-3)" }}>{pct}%</span>
      </div>
      <div className="pp-progress mt-3"><span style={{ width: `${pct}%` }} /></div>
      <div className="mt-2 flex items-center gap-1.5 text-xs" style={{ color: "var(--text-3)" }}>
        <span className="pp-dot" style={{ color: "#34D399" }} /> {t("localNote")}
      </div>
    </div>
  );
}
