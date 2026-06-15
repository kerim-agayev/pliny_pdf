"use client";

import { useTranslations } from "next-intl";
import { IconAlert, IconArrow } from "@/components/shared/icons";

/**
 * Limit indicator shown inside every tool's FileDropzone (Phase 9 Wave 9A).
 * Ported 1:1 from the Phase 9 design handoff (phase9-kit.jsx · LimitBadge), with
 * all copy localized. States: default (indigo pill), cloud (appends the daily
 * quota, amber when ≤2 left), free (anon sub-line), anonymous (sign-in upsell),
 * over-limit (red pill), and an optional live file-size meter.
 */
export function LimitBadge({
  tier = "free",
  size = 25,
  count = 100,
  unit = "pages",
  signedInSize = 25,
  signedInCount = 100,
  anonSize = 10,
  anonCount = 30,
  cloud = false,
  quotaUsed,
  quotaTotal,
  over = false,
  overUnit = "mb",
  fileSize = 0,
  filePages = 0,
  loadedSize = null,
  align = "center",
}: {
  tier?: "free" | "anonymous";
  size?: number;
  count?: number;
  unit?: "pages" | "images";
  signedInSize?: number;
  signedInCount?: number;
  anonSize?: number;
  anonCount?: number;
  cloud?: boolean;
  quotaUsed?: number;
  quotaTotal?: number;
  over?: boolean;
  /** Which limit was exceeded — drives the red message. */
  overUnit?: "mb" | "pages";
  fileSize?: number;
  filePages?: number;
  loadedSize?: number | null;
  align?: "center" | "left";
}) {
  const t = useTranslations("LimitBadge");
  const center = align === "center";
  const mb = t("mbUnit");
  const unitWord = unit === "images" ? t("imagesUnit") : t("pagesUnit");
  const fmt = (s: number, c: number) => `${s} ${mb} · ${c} ${unitWord}`;
  const hasQuota = cloud && typeof quotaUsed === "number" && typeof quotaTotal === "number" && Number.isFinite(quotaTotal);
  const lowQuota = hasQuota && (quotaTotal! - quotaUsed!) <= 2;

  if (over) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: center ? "center" : "flex-start", gap: 6 }}>
        <div
          style={{
            display: "inline-flex", alignItems: "center", gap: 8, padding: "7px 13px",
            borderRadius: 999, background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.42)",
            color: "#FCA5A5", fontSize: 13, fontWeight: 500,
          }}
        >
          <IconAlert size={14} sw={2} />
          {overUnit === "pages" ? t("overPages", { pages: filePages, limit: count }) : t("over", { fileSize, size })}
        </div>
        {tier === "anonymous" && <SignInUpsell label={t("signIn", { limits: fmt(signedInSize, signedInCount) })} />}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: center ? "center" : "flex-start", gap: 5 }}>
      <div
        className="pp-mono"
        style={{
          display: "inline-flex", alignItems: "center", gap: 9, padding: "6px 12px",
          borderRadius: 999, background: "var(--indigo-dim)", border: "1px solid var(--indigo-line)",
          color: "#BFB5FF", fontSize: 12.5, fontWeight: 500, letterSpacing: "-0.01em", maxWidth: "100%", flexWrap: "wrap", justifyContent: "center",
        }}
      >
        <span style={{ color: "var(--text-3)", fontWeight: 600, letterSpacing: "0.04em", fontSize: 11 }}>{t("max")}</span>
        <span style={{ color: "var(--text)" }}>{size} {mb}</span>
        <Sep />
        <span style={{ color: "var(--text)" }}>{count} {unitWord}</span>
        {hasQuota && (
          <>
            <Sep />
            <span style={{ color: lowQuota ? "#FBBF24" : "#6EE7B7" }}>{t("today", { used: quotaUsed!, total: quotaTotal! })}</span>
          </>
        )}
      </div>
      {loadedSize != null && <FileMeter used={loadedSize} max={size} unitLabel={mb} />}
      {tier === "anonymous" ? (
        <SignInUpsell label={t("signIn", { limits: fmt(signedInSize, signedInCount) })} />
      ) : (
        <div style={{ fontSize: 11.5, color: "var(--text-3)" }}>{t("anonTier", { limits: fmt(anonSize, anonCount) })}</div>
      )}
    </div>
  );
}

function Sep() {
  return <span style={{ color: "var(--line-2)" }}>·</span>;
}

function SignInUpsell({ label }: { label: string }) {
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        color: "#A5B4FC", fontSize: 11.5, fontWeight: 500,
      }}
    >
      {label} <IconArrow size={12} />
    </span>
  );
}

function FileMeter({ used, max, unitLabel }: { used: number; max: number; unitLabel: string }) {
  const pct = Math.min(100, (used / max) * 100);
  const danger = used > max;
  return (
    <div className="pp-mono" style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 11, color: "var(--text-2)" }}>
      <div style={{ width: 96, height: 5, borderRadius: 999, background: "var(--line)", overflow: "hidden" }}>
        <div
          style={{
            width: `${pct}%`, height: "100%", borderRadius: 999,
            background: danger ? "#EF4444" : "linear-gradient(90deg,var(--indigo),var(--indigo-hi))",
          }}
        />
      </div>
      <span>
        <span style={{ color: "var(--text)" }}>{used} {unitLabel}</span> / {max} {unitLabel}
      </span>
    </div>
  );
}
