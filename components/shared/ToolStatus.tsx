"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Spinner } from "@/components/tools/Spinner";
import { ErrorBanner } from "@/components/tools/ResultPanels";

export type ToolStatusValue = "idle" | "loading" | "processing" | "done" | "error";

/**
 * Standardized status display for the tool state machine (Phase 3).
 * - idle: nothing
 * - loading: spinner + "Loading file…"
 * - processing: progress bar (if `progress` given) or spinner, plus `message`
 * - done: fires a success toast (the tool still renders its own SuccessPanel)
 * - error: fires an error toast and renders ErrorBanner with a retry button
 *
 * Wave 3A builds it; Wave 3F wires it into all 28 tools.
 */
export function ToolStatus({
  status,
  progress,
  message,
  onRetry,
}: {
  status: ToolStatusValue;
  progress?: number;
  message?: string;
  onRetry?: () => void;
}) {
  const t = useTranslations("ToolUI");
  const te = useTranslations("Errors");
  const fired = useRef<ToolStatusValue>("idle");

  // Fire one toast on entry into done/error (not on every re-render).
  useEffect(() => {
    if (fired.current === status) return;
    fired.current = status;
    if (status === "done") toast.success(message ?? t("successTitle"));
    if (status === "error") toast.error(message ?? te("unknownError"));
  }, [status, message, t, te]);

  if (status === "idle" || status === "done") return null;

  if (status === "error") {
    return <ErrorBanner message={message} onRetry={onRetry ?? (() => {})} />;
  }

  // loading / processing
  const hasProgress =
    status === "processing" && typeof progress === "number" && progress >= 0;
  const label = message ?? (status === "loading" ? t("loading") : t("processing"));

  return (
    <div
      className="rounded-[14px] p-5"
      style={{ background: "var(--bg-2)", border: "1px solid var(--line)" }}
    >
      <div className="flex items-center gap-2.5">
        <Spinner size={16} />
        <span className="text-[13.5px]" style={{ color: "var(--text-2)" }}>
          {label}
        </span>
      </div>
      {hasProgress && (
        <div
          className="mt-3 h-1.5 w-full overflow-hidden rounded-full"
          style={{ background: "var(--line-2)" }}
          role="progressbar"
          aria-valuenow={Math.round(progress!)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full transition-[width] duration-300"
            style={{
              width: `${Math.min(100, Math.max(0, progress!))}%`,
              background: "var(--indigo)",
            }}
          />
        </div>
      )}
    </div>
  );
}
