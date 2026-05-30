"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { PlanCard } from "./PlanCard";
import { IconChevron } from "@/components/shared/icons";

export function PricingClient() {
  const t = useTranslations("Pricing");
  const [yearly, setYearly] = useState(true);
  const [openFAQ, setOpenFAQ] = useState(0);
  const guarantees = t.raw("guarantees") as string[];
  const faq = t.raw("faq") as { q: string; a: string }[];

  return (
    <div>
      <section className="px-5 pt-[88px] pb-12 text-center sm:px-10">
        <div className="pp-mono mb-3.5 text-[11.5px] uppercase tracking-[0.14em]" style={{ color: "#8B7CF0" }}>
          {t("kicker")}
        </div>
        <h1 className="mb-[18px] text-[clamp(40px,7vw,64px)] tracking-[-0.035em]" style={{ textWrap: "balance" }}>
          {t("title1")}
          <br />
          <span className="font-medium" style={{ color: "var(--text-2)" }}>{t("title2")}</span>
        </h1>
        <p className="mx-auto mb-9 max-w-[520px] text-[18px]" style={{ color: "var(--text-2)" }}>
          {t("subtitle")}
        </p>

        <div className="inline-flex flex-wrap items-center justify-center gap-3">
          <div className="flex gap-1 rounded-full p-1" style={{ background: "var(--card)", border: "1px solid var(--line)" }}>
            {[
              { label: t("monthly"), y: false },
              { label: t("yearly"), y: true },
            ].map(({ label, y }) => {
              const active = y === yearly;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => setYearly(y)}
                  className="rounded-full px-4 py-[7px] text-[13px] font-medium transition-colors"
                  style={{
                    background: active ? "rgba(127,127,127,0.12)" : "transparent",
                    color: active ? "var(--text)" : "var(--text-2)",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <span
            className="pp-badge"
            style={{ background: "rgba(16,185,129,0.12)", borderColor: "rgba(16,185,129,0.28)", color: "#6EE7B7" }}
          >
            {t("saveYearly")}
          </span>
        </div>
      </section>

      <section className="px-5 pb-24 pt-6 sm:px-10">
        <div className="mx-auto grid max-w-[920px] grid-cols-1 gap-5 md:grid-cols-2">
          <PlanCard plan="free" yearly={yearly} />
          <PlanCard plan="pro" yearly={yearly} />
        </div>
        <div
          className="mx-auto mt-6 flex max-w-[920px] flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[13px]"
          style={{ color: "var(--text-3)" }}
        >
          {guarantees.map((g, i) => (
            <span key={i} className="inline-flex items-center gap-5">
              {i > 0 && <span aria-hidden>·</span>}
              {g}
            </span>
          ))}
        </div>
      </section>

      <section className="px-5 pb-28 pt-16 sm:px-10" style={{ borderTop: "1px solid var(--line)" }}>
        <div className="mx-auto max-w-[920px]">
          <div className="pp-mono mb-3.5 text-[11.5px] uppercase tracking-[0.14em]" style={{ color: "#8B7CF0" }}>
            {t("faqKicker")}
          </div>
          <h2 className="mb-9 text-[clamp(28px,4vw,36px)] tracking-[-0.025em]">{t("faqTitle")}</h2>
          <div className="flex flex-col gap-2.5">
            {faq.map((item, i) => {
              const open = openFAQ === i;
              return (
                <div key={i} className="pp-card overflow-hidden" style={{ padding: 0 }}>
                  <button
                    type="button"
                    onClick={() => setOpenFAQ(open ? -1 : i)}
                    className="flex w-full items-center justify-between px-6 py-5 text-left text-base font-medium"
                    style={{ color: "var(--text)" }}
                  >
                    {item.q}
                    <IconChevron
                      size={16}
                      color="var(--text-2)"
                      style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.18s ease" }}
                    />
                  </button>
                  {open && (
                    <div className="max-w-[720px] px-6 pb-[22px] text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
