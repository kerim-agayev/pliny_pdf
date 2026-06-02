"use client";

import { useTranslations } from "next-intl";
import { IconCheck, IconDownload, IconAlert, IconRefresh } from "@/components/shared/icons";
import { Kbd, useModKey } from "@/components/shared/Kbd";

/** Green success panel with a download button and a secondary action. */
export function SuccessPanel({
  title,
  meta,
  onDownload,
  onReset,
  badge,
}: {
  title: string;
  meta?: string;
  onDownload: () => void;
  onReset: () => void;
  badge?: string;
}) {
  const t = useTranslations("ToolUI");
  const mod = useModKey();
  return (
    <div
      className="rounded-[18px] p-7 sm:p-9"
      style={{
        background: "linear-gradient(180deg, rgba(16,185,129,0.08), rgba(16,185,129,0.02))",
        border: "1px solid rgba(16,185,129,0.22)",
      }}
    >
      <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
        <div
          className="flex size-14 shrink-0 items-center justify-center rounded-[14px]"
          style={{ background: "rgba(16,185,129,0.18)", color: "#34D399" }}
        >
          <IconCheck size={26} sw={2.4} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-[22px] tracking-[-0.015em]">{title}</h3>
            {badge && (
              <span
                className="pp-badge"
                style={{ background: "rgba(16,185,129,0.12)", borderColor: "rgba(16,185,129,0.28)", color: "#6EE7B7" }}
              >
                {badge}
              </span>
            )}
          </div>
          {meta && <p className="pp-mono mt-1 text-[13px]" style={{ color: "var(--text-2)" }}>{meta}</p>}
        </div>
        <div className="flex gap-2.5">
          <button
            type="button"
            className="pp-btn pp-btn-ghost pp-btn-lg"
            onClick={onReset}
            data-pp-shortcut="reset"
            aria-keyshortcuts="Escape"
          >
            {t("processAnother")} <Kbd>Esc</Kbd>
          </button>
          <button
            type="button"
            className="pp-btn pp-btn-lg"
            onClick={onDownload}
            data-pp-shortcut="download"
            aria-keyshortcuts="Control+D Meta+D"
            style={{ background: "var(--emerald)", boxShadow: "0 8px 20px -10px rgba(16,185,129,0.6)" }}
          >
            <IconDownload size={15} /> {t("download")} <Kbd>{mod("D")}</Kbd>
          </button>
        </div>
      </div>
    </div>
  );
}

/** Friendly error banner with reassurance and retry. `note` overrides the default
 * local-privacy reassurance (cloud tools pass a cloud-appropriate note). */
export function ErrorBanner({
  message,
  note,
  onRetry,
}: {
  message?: string;
  note?: string;
  onRetry: () => void;
}) {
  const t = useTranslations("ToolUI");
  return (
    <div
      className="rounded-[14px] p-5"
      style={{ background: "rgba(244,63,94,0.06)", border: "1px solid rgba(244,63,94,0.22)" }}
    >
      <div className="mb-1.5 flex items-center gap-2">
        <IconAlert size={16} color="#F43F5E" sw={1.8} />
        <div className="text-sm font-semibold" style={{ color: "#FDA4AF" }}>
          {message ?? t("errorTitle")}
        </div>
      </div>
      <p className="mb-3 text-[12.5px]" style={{ color: "var(--text-2)" }}>{note ?? t("neverUploaded")}</p>
      <button type="button" className="pp-btn pp-btn-ghost" style={{ padding: "8px 14px" }} onClick={onRetry}>
        <IconRefresh size={14} /> {t("tryAgain")}
      </button>
    </div>
  );
}
