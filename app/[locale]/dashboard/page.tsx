import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { TOOLS } from "@/lib/tools";
import { PrivacyBadge } from "@/components/shared/PrivacyBadge";
import {
  IconArrow,
  IconBolt,
  IconClock,
  IconStar,
  IconFolder,
  IconSettings,
  IconDownload,
  IconMerge,
  IconCompress,
  IconWatermark,
  IconWord,
  IconImage,
  type IconProps,
} from "@/components/shared/icons";

export const metadata: Metadata = {
  title: "Dashboard — PlinyPDF",
};

type ComponentIcon = (p: IconProps) => React.ReactElement;

const RECENT: { name: string; tool: string; Icon: ComponentIcon; accent: string; mode: "local" | "cloud"; size: string; when: string }[] = [
  { name: "Q4-financial-report-merged.pdf", tool: "Merge PDF", Icon: IconMerge, accent: "#A78BFA", mode: "local", size: "7.2 MB", when: "2 min ago" },
  { name: "investor-deck-2026.pdf", tool: "Compress PDF", Icon: IconCompress, accent: "#F472B6", mode: "local", size: "4.8 → 1.9 MB", when: "1h ago" },
  { name: "contract-signed.pdf", tool: "Add Watermark", Icon: IconWatermark, accent: "#F472B6", mode: "local", size: "892 KB", when: "Yesterday" },
  { name: "meeting-notes.docx", tool: "PDF to Word", Icon: IconWord, accent: "#60A5FA", mode: "cloud", size: "124 KB", when: "Yesterday" },
  { name: "scanned-receipts.pdf", tool: "PDF to JPG", Icon: IconImage, accent: "#60A5FA", mode: "local", size: "12 images", when: "2 days ago" },
];

const QUICK = ["merge", "compress", "watermark", "split", "rotate", "protect"];

export default async function DashboardRoute({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Dashboard");
  const quick = QUICK.map((id) => TOOLS.find((x) => x.id === id)!).filter(Boolean);

  return (
    <div className="flex">
      {/* Sidebar */}
      <aside
        className="hidden w-60 flex-col gap-7 px-4 py-7 lg:flex"
        style={{ borderRight: "1px solid var(--line)", minHeight: "calc(100vh - 64px)" }}
      >
        <div>
          <SideLabel>Library</SideLabel>
          <SideItem Icon={IconClock} label="Recent" count="12" active />
          <SideItem Icon={IconStar} label="Favorites" count="3" />
          <SideItem Icon={IconFolder} label="History" count="47" />
        </div>
        <div>
          <SideLabel>Tools</SideLabel>
          {["Organize", "Convert", "Edit", "Secure"].map((c) => (
            <SideItem key={c} label={c} />
          ))}
        </div>
        <div className="mt-auto">
          <SideItem Icon={IconSettings} label="Settings" />
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-hidden px-5 pt-9 pb-20 sm:px-10">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div
              className="pp-badge pro mb-2"
              style={{ fontSize: 10.5, letterSpacing: "0.06em" }}
            >
              {t("planFree")}
            </div>
            <h1 className="text-[32px] tracking-[-0.025em]">{t("greeting")}, Aslan.</h1>
          </div>
        </div>

        {/* Quick tools */}
        <section className="mb-9">
          <div className="mb-3.5 text-[13px] font-medium" style={{ color: "var(--text-2)" }}>
            {t("quickTools")}
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {quick.map((tool) => (
              <Link key={tool.id} href={`/${tool.slug}`} className="pp-quick flex flex-col items-start gap-3.5 px-3.5 py-5 text-left">
                <div
                  className="flex size-9 items-center justify-center rounded-[10px]"
                  style={{ background: "rgba(127,127,127,0.06)", border: "1px solid var(--line)", color: tool.accent }}
                >
                  <tool.icon size={17} sw={1.7} />
                </div>
                <div>
                  <div className="text-[13.5px] font-medium" style={{ color: "var(--text)" }}>{tool.name}</div>
                  <div className="pp-mono mt-1 text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--text-3)" }}>
                    {tool.mode}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.7fr_1fr]">
          {/* Recent activity */}
          <section>
            <div className="mb-3.5 flex items-baseline justify-between">
              <h2 className="text-lg tracking-[-0.015em]">{t("recentActivity")}</h2>
            </div>
            <div className="pp-card" style={{ padding: 6 }}>
              {RECENT.map((f, i) => (
                <div key={f.name}>
                  <div className="pp-related flex items-center gap-4 rounded-xl px-4 py-3.5">
                    <div
                      className="flex size-9 shrink-0 items-center justify-center rounded-[9px]"
                      style={{ background: "rgba(127,127,127,0.06)", border: "1px solid var(--line)", color: f.accent }}
                    >
                      <f.Icon size={17} sw={1.7} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-0.5 truncate text-sm font-medium" style={{ color: "var(--text)" }}>{f.name}</div>
                      <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-3)" }}>
                        <span>{f.tool}</span>
                        <span>·</span>
                        <span className="pp-mono">{f.size}</span>
                      </div>
                    </div>
                    <div className="hidden sm:block"><PrivacyBadge type={f.mode} /></div>
                    <div className="pp-mono hidden w-[88px] text-right text-xs md:block" style={{ color: "var(--text-3)" }}>{f.when}</div>
                    <button
                      type="button"
                      className="flex size-[30px] items-center justify-center rounded-lg"
                      style={{ border: "1px solid var(--line)", color: "var(--text-2)" }}
                      aria-label="Download"
                    >
                      <IconDownload size={13} />
                    </button>
                  </div>
                  {i < RECENT.length - 1 && <hr className="pp-hr" style={{ margin: "0 16px" }} />}
                </div>
              ))}
            </div>
          </section>

          {/* Usage */}
          <aside className="flex flex-col gap-3.5">
            <h2 className="text-lg tracking-[-0.015em]">{t("usage")}</h2>
            <UsageCard label={t("serverTools")} used={7} total={10} color="#6B5CE7" sub={t("perDay", { used: 7, total: 10 })} />
            <UsageCard label={t("aiSummaries")} used={1} total={2} color="#F472B6" sub={t("perMonth", { used: 1, total: 2 })} />
            <div
              className="mt-2 rounded-[14px] p-5"
              style={{ background: "linear-gradient(180deg, rgba(107,92,231,0.1), rgba(107,92,231,0.02))", border: "1px solid rgba(107,92,231,0.22)" }}
            >
              <div className="mb-2 flex items-center gap-2">
                <IconBolt size={14} color="#BFB5FF" sw={1.7} />
                <div className="text-[13px] font-semibold" style={{ color: "#BFB5FF" }}>{t("upgradeTitle")}</div>
              </div>
              <p className="mb-3 text-[12.5px] leading-relaxed" style={{ color: "var(--text-2)" }}>{t("upgradeBody")}</p>
              <Link href="/pricing" className="inline-flex items-center gap-1 text-[12.5px]" style={{ color: "#BFB5FF" }}>
                {t("upgradeCta")} <IconArrow size={11} />
              </Link>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

function SideLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="pp-mono mb-2 px-3 text-[10.5px] uppercase tracking-[0.14em]" style={{ color: "var(--text-3)" }}>
      {children}
    </div>
  );
}

function SideItem({
  Icon,
  label,
  count,
  active,
}: {
  Icon?: ComponentIcon;
  label: string;
  count?: string;
  active?: boolean;
}) {
  return (
    <div
      className="flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-[13.5px]"
      style={{ background: active ? "rgba(127,127,127,0.07)" : "transparent", color: active ? "var(--text)" : "var(--text-2)" }}
    >
      {Icon && <Icon size={15} sw={1.7} color={active ? "#BFB5FF" : "currentColor"} />}
      <span className="flex-1">{label}</span>
      {count !== undefined && <span className="pp-mono text-[11px]" style={{ color: "var(--text-3)" }}>{count}</span>}
    </div>
  );
}

function UsageCard({
  label,
  used,
  total,
  color,
  sub,
}: {
  label: string;
  used: number;
  total: number;
  color: string;
  sub: string;
}) {
  return (
    <div className="pp-card" style={{ padding: 18 }}>
      <div className="mb-3 flex items-center justify-between">
        <div className="text-[13px]" style={{ color: "var(--text-2)" }}>{label}</div>
        <div className="pp-mono text-xs">
          <span style={{ color }}>{used}</span>
          <span style={{ color: "var(--text-3)" }}> / {total}</span>
        </div>
      </div>
      <div className="pp-progress">
        <span style={{ width: `${(used / total) * 100}%`, background: `linear-gradient(90deg, ${color}, ${color}99)` }} />
      </div>
      <div className="mt-2.5 text-[11.5px]" style={{ color: "var(--text-3)" }}>{sub}</div>
    </div>
  );
}
