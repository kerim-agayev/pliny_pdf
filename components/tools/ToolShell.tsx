"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { TOOLS, toolById, type Tool } from "@/lib/tools";
import { PrivacyBadge } from "@/components/shared/PrivacyBadge";
import { IconChevron, IconShield, IconArrow } from "@/components/shared/icons";

export function ToolShell({
  toolId,
  subtitle,
  related,
  fullWidth = false,
  children,
}: {
  toolId: string;
  subtitle: string;
  related?: string[];
  fullWidth?: boolean;
  children: React.ReactNode;
}) {
  const t = useTranslations("ToolUI");
  const tt = useTranslations("Tools");
  const tool = toolById(toolId)!;
  const Icon = tool.icon;

  const relatedTools = (
    related
      ? related.map((id) => TOOLS.find((x) => x.id === id)).filter(Boolean)
      : TOOLS.filter((x) => x.cat === tool.cat && x.id !== tool.id && x.available).slice(0, 3)
  ) as Tool[];

  return (
    <section className="px-5 pt-10 pb-24 sm:px-10">
      <div className="mx-auto max-w-[1180px]">
        <nav className="mb-7 flex items-center gap-2 text-[13px]" style={{ color: "var(--text-3)" }}>
          <Link href="/">{t("home")}</Link>
          <IconChevron size={12} color="var(--text-3)" />
          <Link href="/tools">{t("tools")}</Link>
          <IconChevron size={12} color="var(--text-3)" />
          <span style={{ color: "var(--text-2)" }}>{tt(`${tool.id}.name`)}</span>
        </nav>

        <div className="mb-3.5 flex items-center gap-3.5">
          <div
            className="flex size-[52px] items-center justify-center rounded-[13px]"
            style={{ background: "rgba(107,92,231,0.14)", border: "1px solid rgba(107,92,231,0.3)", color: "#BFB5FF" }}
          >
            <Icon size={24} sw={1.6} />
          </div>
          <div>
            <h1 className="text-[clamp(28px,4vw,36px)] tracking-[-0.025em]">{tt(`${tool.id}.name`)}</h1>
            <p className="mt-0.5 text-[14.5px]" style={{ color: "var(--text-2)" }}>{subtitle}</p>
          </div>
        </div>

        <PrivacyBadge type={tool.mode} big />

        {fullWidth ? (
          <div className="mt-8">{children}</div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
          <div className="min-w-0">{children}</div>

          <aside className="flex flex-col gap-4">
            {/* How it works */}
            <div className="pp-card" style={{ padding: 24 }}>
              <h3 className="mb-[18px] text-[15px] tracking-[-0.015em]">{t("howItWorks")}</h3>
              <div className="flex flex-col gap-[18px]">
                {[1, 2, 3].map((n) => {
                  const prefix = tool.mode === "cloud" ? "cloudStep" : "step";
                  return (
                    <div key={n} className="flex gap-3.5">
                      <div
                        className="pp-mono flex size-6 shrink-0 items-center justify-center rounded-md text-[11px] font-semibold"
                        style={{ background: "rgba(107,92,231,0.14)", color: "#BFB5FF" }}
                      >
                        {n}
                      </div>
                      <div>
                        <div className="mb-0.5 text-[13.5px] font-medium">{t(`${prefix}${n}Title`)}</div>
                        <div className="text-[12.5px] leading-relaxed" style={{ color: "var(--text-2)" }}>
                          {t(`${prefix}${n}Body`)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Security note */}
            {tool.mode === "local" && (
              <div
                className="rounded-[14px] p-[18px]"
                style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.18)" }}
              >
                <div className="mb-2 flex items-center gap-2">
                  <IconShield size={15} color="#34D399" sw={1.7} />
                  <div className="text-[13.5px] font-semibold" style={{ color: "#6EE7B7" }}>
                    {t("verifiablePrivacy")}
                  </div>
                </div>
                <p className="mb-2.5 text-[12.5px] leading-relaxed" style={{ color: "var(--text-2)" }}>
                  {t("verifyBody")}
                </p>
                <span className="pp-mono text-[11.5px]" style={{ color: "#6EE7B7" }}>{t("howWeVerify")}</span>
              </div>
            )}

            {/* Related tools */}
            {relatedTools.length > 0 && (
              <div className="pp-card" style={{ padding: 24 }}>
                <h3 className="mb-3.5 text-[15px] tracking-[-0.015em]">{t("relatedTools")}</h3>
                <div className="flex flex-col gap-1">
                  {relatedTools.map((rt) => (
                    <Link
                      key={rt.id}
                      href={`/${rt.slug}`}
                      className="pp-related -mx-2 flex items-center gap-3 rounded-lg px-2 py-2.5"
                    >
                      <div
                        className="flex size-7 items-center justify-center rounded-[7px]"
                        style={{ background: "rgba(127,127,127,0.06)", border: "1px solid var(--line)", color: rt.accent }}
                      >
                        <rt.icon size={15} sw={1.7} />
                      </div>
                      <div className="flex-1 text-[13.5px]" style={{ color: "var(--text)" }}>
                        {tt(`${rt.id}.name`)}
                      </div>
                      <IconArrow size={13} color="var(--text-3)" />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </aside>
          </div>
        )}
      </div>
    </section>
  );
}
