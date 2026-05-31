"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { IconCheck } from "@/components/shared/icons";
import { useSession } from "@/lib/auth/client";
import { postJson, ApiError } from "@/lib/api";

export function PlanCard({
  plan,
  yearly = false,
  compact = false,
}: {
  plan: "free" | "pro";
  yearly?: boolean;
  compact?: boolean;
}) {
  const t = useTranslations("Pricing");
  const isPro = plan === "pro";
  const price = isPro ? (yearly ? 39 : 4.99) : 0;
  const unit = isPro ? (yearly ? t("perYear") : t("perMonth")) : t("forever");
  const features = t.raw(isPro ? "proFeatures" : "freeFeatures") as string[];

  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string>();
  const alreadyPro = isPro && (session?.user as { plan?: string } | undefined)?.plan === "pro";

  const ctaStyle = {
    padding: 12,
    background: isPro ? "var(--indigo)" : "transparent",
    color: isPro ? "white" : "var(--text)",
    border: isPro ? "none" : "1px solid var(--line-2)",
    boxShadow: isPro
      ? "0 1px 0 rgba(255,255,255,0.12) inset, 0 8px 20px -10px rgba(107,92,231,0.6)"
      : "none",
  } as const;

  // Pro CTA → create a Lemonsqueezy checkout for the signed-in user. Logged-out
  // users are sent to signup first (we need an account to attach the purchase to).
  async function upgrade() {
    if (!session?.user) {
      router.push("/signup");
      return;
    }
    setCheckoutError(undefined);
    setLoading(true);
    try {
      const { url } = await postJson<{ url: string }>("/api/billing/checkout", {
        plan: yearly ? "yearly" : "monthly",
      });
      window.location.href = url;
    } catch (e) {
      setCheckoutError(e instanceof ApiError ? e.message : t("checkoutError"));
      setLoading(false);
    }
  }

  return (
    <div
      className="pp-card relative"
      style={{
        padding: compact ? 28 : 36,
        borderColor: isPro ? "var(--indigo-line)" : "var(--line)",
        background: isPro
          ? "linear-gradient(180deg, rgba(107,92,231,0.08), rgba(107,92,231,0) 60%), var(--card)"
          : "var(--card)",
        boxShadow: isPro
          ? "0 0 0 1px var(--indigo-line), 0 20px 60px -30px rgba(107,92,231,0.4)"
          : "none",
      }}
    >
      {isPro && (
        <div
          className="absolute -top-px right-5 rounded-b-lg px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-white"
          style={{ background: "var(--indigo)" }}
        >
          {t("mostPopular")}
        </div>
      )}
      <div className="mb-1.5 flex items-baseline justify-between">
        <h3 className="text-[22px] tracking-tight">{isPro ? t("proName") : t("freeName")}</h3>
        {isPro && yearly && (
          <span
            className="pp-badge"
            style={{ background: "rgba(16,185,129,0.12)", borderColor: "rgba(16,185,129,0.28)", color: "#6EE7B7" }}
          >
            {t("save35")}
          </span>
        )}
      </div>
      <p className="mb-5 text-sm" style={{ color: "var(--text-2)" }}>
        {isPro ? t("proTagline") : t("freeTagline")}
      </p>
      <div className="mb-6 flex items-baseline gap-2">
        <div className="font-[family-name:var(--font-display)] text-5xl font-bold tracking-[-0.04em]">
          ${price}
        </div>
        <div className="text-[13px]" style={{ color: "var(--text-2)" }}>{unit}</div>
      </div>
      {isPro ? (
        alreadyPro ? (
          <div
            className="pp-btn block w-full text-center"
            style={{ ...ctaStyle, opacity: 0.75, cursor: "default", pointerEvents: "none" }}
          >
            {t("currentPlan")}
          </div>
        ) : (
          <button
            type="button"
            onClick={upgrade}
            disabled={loading}
            className="pp-btn block w-full text-center"
            style={{ ...ctaStyle, opacity: loading ? 0.7 : 1, cursor: loading ? "default" : "pointer" }}
          >
            {loading ? t("redirecting") : t("proCta")}
          </button>
        )
      ) : (
        <Link href="/signup" className="pp-btn block text-center" style={ctaStyle}>
          {t("freeCta")}
        </Link>
      )}
      {isPro && checkoutError && (
        <p className="mt-2.5 text-center text-[12.5px]" style={{ color: "#F87171" }}>
          {checkoutError}
        </p>
      )}
      <hr className="pp-hr" style={{ margin: "24px 0" }} />
      <ul className="flex list-none flex-col gap-3 p-0">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm" style={{ color: "var(--text)" }}>
            <span className="pp-check mt-px"><IconCheck size={11} /></span>
            <span style={{ color: i === 0 && isPro ? "var(--text-2)" : "var(--text)" }}>{f}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
