"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

// After this many seconds, swap to a stronger "still working" reassurance (Wave 3H).
const PATIENCE_THRESHOLD = 45;

/** mm:ss elapsed label. */
function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * "Processing on our server…" panel with a live elapsed timer and patience copy —
 * shared by the Wave 5B cloud tools (Compress / Grayscale / PDF→JPG / Merge),
 * mirroring CloudConvertTool. Mount it only while a request is in flight; the
 * timer starts on mount and resets on the next run.
 */
export function CloudProgress({ accent = "#60A5FA" }: { accent?: string }) {
  const t = useTranslations("ToolUI");
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const startedAt = performance.now();
    const id = setInterval(() => setElapsed(Math.floor((performance.now() - startedAt) / 1000)), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="mt-4 rounded-xl p-4" style={{ background: "var(--bg-2)", border: "1px solid var(--line)" }}>
      <div className="flex items-center justify-between gap-3">
        <div className="text-[13px]" style={{ color: "var(--text)" }}>{t("cloudProcessing")}</div>
        <span className="pp-mono text-[12px]" style={{ color: "var(--text-3)" }}>{formatElapsed(elapsed)}</span>
      </div>
      <div className="pp-progress mt-3" data-indeterminate><span /></div>
      <div className="mt-2.5 text-[12px] leading-relaxed" style={{ color: "var(--text-2)" }}>
        {elapsed >= PATIENCE_THRESHOLD ? t("cloudPatienceLong") : t("cloudPatience")}
      </div>
      <div className="mt-2 flex items-center gap-1.5 text-xs" style={{ color: "var(--text-3)" }}>
        <span className="pp-dot" style={{ color: accent }} /> {t("cloudNote")}
      </div>
    </div>
  );
}
