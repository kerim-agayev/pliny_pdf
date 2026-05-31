"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { CATEGORIES, TOOLS, type FilterCategory } from "@/lib/tools";
import { ToolCard } from "@/components/shared/ToolCard";

export function ToolsCatalog({ initialCategory }: { initialCategory?: string }) {
  const t = useTranslations("ToolsPage");
  const initial = (CATEGORIES as readonly string[]).includes(initialCategory ?? "")
    ? (initialCategory as FilterCategory)
    : "All";
  const [filter, setFilter] = useState<FilterCategory>(initial);
  const filtered = filter === "All" ? TOOLS : TOOLS.filter((tool) => tool.cat === filter);

  return (
    <section className="px-5 pt-16 pb-28 sm:px-10">
      <div className="mx-auto max-w-[1180px]">
        <div className="pp-mono mb-3.5 text-[11.5px] font-medium uppercase tracking-[0.14em]" style={{ color: "#8B7CF0" }}>
          {t("kicker")} · {TOOLS.length}
        </div>
        <h1 className="mb-4 text-[clamp(40px,6vw,56px)] tracking-[-0.03em]">{t("title")}</h1>
        <p className="mb-10 max-w-[580px] text-[18px]" style={{ color: "var(--text-2)" }}>
          {t("subtitle")}
        </p>

        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div
            className="flex flex-wrap gap-1 rounded-full p-1"
            style={{ background: "var(--card)", border: "1px solid var(--line)" }}
          >
            {CATEGORIES.map((c) => {
              const active = filter === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setFilter(c)}
                  className="rounded-full px-3.5 py-[7px] text-[13px] font-medium transition-colors"
                  style={{
                    background: active ? "rgba(127,127,127,0.12)" : "transparent",
                    color: active ? "var(--text)" : "var(--text-2)",
                  }}
                >
                  {t(`category.${c}`)}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-3.5 text-[13px]" style={{ color: "var(--text-2)" }}>
            <span className="inline-flex items-center gap-1.5">
              <span className="pp-dot" style={{ color: "#34D399" }} /> {t("legendLocal")}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="pp-dot" style={{ color: "#60A5FA" }} /> {t("legendCloud")}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((tool) => (
            <ToolCard key={tool.id} toolId={tool.id} dotted />
          ))}
        </div>

        <div
          className="mt-14 flex flex-col items-start justify-between gap-6 rounded-2xl px-8 py-7 sm:flex-row sm:items-center"
          style={{
            background: "linear-gradient(90deg, rgba(107,92,231,0.12), rgba(107,92,231,0.04))",
            border: "1px solid rgba(107,92,231,0.24)",
          }}
        >
          <div>
            <h3 className="mb-1.5 text-xl">{t("missingTitle")}</h3>
            <p className="text-sm" style={{ color: "var(--text-2)" }}>{t("missingBody")}</p>
          </div>
          <button type="button" className="pp-btn pp-btn-ghost shrink-0">{t("missingCta")}</button>
        </div>
      </div>
    </section>
  );
}
