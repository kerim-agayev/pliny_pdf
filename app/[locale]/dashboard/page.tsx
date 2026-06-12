import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { setRequestLocale, getTranslations, getFormatter } from "next-intl/server";
import { and, desc, eq, lt } from "drizzle-orm";
import { Link } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { fileHistory } from "@/lib/db/schema";
import { remainingServerTool } from "@/lib/ratelimit";
import { TOOLS, toolBySlug } from "@/lib/tools";
import { formatBytes } from "@/lib/format";
import { PrivacyBadge } from "@/components/shared/PrivacyBadge";
import { RecentFiles } from "@/components/shared/RecentFiles";
import {
  IconArrow,
  IconClock,
  IconStar,
  IconSettings,
  IconFile,
  type IconProps,
} from "@/components/shared/icons";

export const metadata: Metadata = {
  title: "Dashboard — PlinyPDF",
};

type ComponentIcon = (p: IconProps) => React.ReactElement;

const QUICK_TOOLS = ["merge", "compress", "watermark", "split", "rotate", "protect"];
const SERVER_LIMIT = 10;
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

export default async function DashboardRoute({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, format] = await Promise.all([getTranslations("Dashboard"), getFormatter()]);

  // Auth guard
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect(`/${locale}/login`);
  const user = session.user;

  // 7-day history window; purge older rows on load.
  const windowDays = 7;
  const cutoff = new Date(Date.now() - windowDays * 86_400_000);
  await db
    .delete(fileHistory)
    .where(and(eq(fileHistory.userId, user.id), lt(fileHistory.createdAt, cutoff)));

  const recent = await db
    .select()
    .from(fileHistory)
    .where(eq(fileHistory.userId, user.id))
    .orderBy(desc(fileHistory.createdAt))
    .limit(8);

  const sr = await remainingServerTool("free", user.id);
  const serverUsed = clamp(SERVER_LIMIT - sr, 0, SERVER_LIMIT);

  const firstName = (user.name || user.email || "").split(/[\s@]/)[0] || "there";
  const quick = QUICK_TOOLS
    .map((id) => TOOLS.find((x) => x.id === id))
    .filter((x): x is (typeof TOOLS)[number] => Boolean(x));

  return (
    <div className="flex">
      {/* Sidebar */}
      <aside
        className="hidden w-60 flex-col gap-7 px-4 py-7 lg:flex"
        style={{ borderRight: "1px solid var(--line)", minHeight: "calc(100vh - 64px)" }}
      >
        <div>
          <SideLabel>Library</SideLabel>
          <SideItem Icon={IconClock} label="Recent" href="/dashboard" active />
          <SideItem Icon={IconStar} label="Favorites" href="/tools" />
          <div className="mt-3.5">
            <RecentFiles compact />
          </div>
        </div>
        <div>
          <SideLabel>Tools</SideLabel>
          {["Organize", "Convert", "Edit", "Secure"].map((c) => (
            <SideItem key={c} label={c} href={`/tools?category=${c}`} />
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
              className="pp-badge mb-2"
              style={{
                fontSize: 10.5,
                letterSpacing: "0.06em",
                background: "rgba(127,127,127,0.16)",
                borderColor: "var(--line-2)",
                color: "var(--text)",
              }}
            >
              {t("planFree")}
            </div>
            <h1 className="text-[32px] tracking-[-0.025em]">
              {t("greeting")}, {firstName}.
            </h1>
          </div>
        </div>

        {/* Quick tools */}
        <section className="mb-9">
          <div className="mb-3.5 text-[13px] font-medium" style={{ color: "var(--text-2)" }}>
            {t("quickTools")}
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {quick.map((tool) => (
              <Link
                key={tool.id}
                href={`/${tool.slug}`}
                className="pp-quick flex flex-col items-start gap-3.5 px-3.5 py-5 text-left"
              >
                <div
                  className="flex size-9 items-center justify-center rounded-[10px]"
                  style={{ background: "rgba(127,127,127,0.06)", border: "1px solid var(--line)", color: tool.accent }}
                >
                  <tool.icon size={17} sw={1.7} />
                </div>
                <div>
                  <div className="text-[13.5px] font-medium" style={{ color: "var(--text)" }}>
                    {tool.name}
                  </div>
                  <div
                    className="pp-mono mt-1 text-[10.5px] uppercase tracking-[0.06em]"
                    style={{ color: "var(--text-3)" }}
                  >
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
            <div className="mb-3.5 flex items-baseline justify-between gap-3">
              <h2 className="text-lg tracking-[-0.015em]">{t("recentActivity")}</h2>
              <span className="pp-mono text-[11.5px]" style={{ color: "var(--text-3)" }}>
                {t("historyRange", { days: windowDays })}
              </span>
            </div>
            <div className="pp-card" style={{ padding: recent.length ? 6 : 28 }}>
              {recent.length === 0 ? (
                <div className="mx-auto flex max-w-[440px] flex-col items-center gap-2.5 py-8 text-center">
                  <div
                    className="flex size-11 items-center justify-center rounded-xl"
                    style={{ background: "rgba(127,127,127,0.06)", border: "1px solid var(--line)", color: "var(--text-3)" }}
                  >
                    <IconFile size={19} sw={1.7} />
                  </div>
                  <div className="text-[13.5px] leading-relaxed" style={{ color: "var(--text-2)" }}>
                    {t("emptyPrivacy")}
                  </div>
                </div>
              ) : (
                recent.map((f, i) => {
                  const tool = toolBySlug(f.toolSlug);
                  const Icon = (tool?.icon ?? IconFile) as ComponentIcon;
                  const accent = tool?.accent ?? "#60A5FA";
                  return (
                    <div key={f.id}>
                      <div className="pp-related flex items-center gap-4 rounded-xl px-4 py-3.5">
                        <div
                          className="flex size-9 shrink-0 items-center justify-center rounded-[9px]"
                          style={{ background: "rgba(127,127,127,0.06)", border: "1px solid var(--line)", color: accent }}
                        >
                          <Icon size={17} sw={1.7} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="mb-0.5 truncate text-sm font-medium" style={{ color: "var(--text)" }}>
                            {f.filename}
                          </div>
                          <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-3)" }}>
                            <span>{tool?.name ?? f.toolSlug}</span>
                            <span>·</span>
                            <span className="pp-mono">{formatBytes(f.size)}</span>
                          </div>
                        </div>
                        <div className="hidden sm:block">
                          <PrivacyBadge type="cloud" />
                        </div>
                        <div
                          className="pp-mono hidden w-[100px] text-right text-xs md:block"
                          style={{ color: "var(--text-3)" }}
                        >
                          {format.relativeTime(f.createdAt)}
                        </div>
                      </div>
                      {i < recent.length - 1 && <hr className="pp-hr" style={{ margin: "0 16px" }} />}
                    </div>
                  );
                })
              )}
            </div>
            {recent.length > 0 && (
              <p className="mt-2.5 text-[11.5px]" style={{ color: "var(--text-3)" }}>
                {t("privacyNote")}
              </p>
            )}
          </section>

          {/* Usage */}
          <aside className="flex flex-col gap-3.5">
            <h2 className="text-lg tracking-[-0.015em]">{t("usage")}</h2>
            <UsageCard
              label={t("serverTools")}
              used={serverUsed}
              total={SERVER_LIMIT}
              color="#6B5CE7"
              sub={t("perDay", { used: serverUsed, total: SERVER_LIMIT })}
            />
            <div className="mt-1.5 rounded-[14px] p-4" style={{ background: "var(--bg-2)", border: "1px solid var(--line)" }}>
              <div className="pp-mono text-[11px] uppercase tracking-[0.08em]" style={{ color: "var(--text-3)" }}>
                {t("localToolsLabel")}
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-[12.5px]" style={{ color: "var(--text-2)" }}>
                <span className="pp-mono" style={{ color: "#34D399" }}>∞</span>
                {t("localToolsNote")}
              </div>
              <Link href="/tools" className="mt-2.5 inline-flex items-center gap-1 text-[12px]" style={{ color: "var(--text-3)" }}>
                {t("exploreTools")} <IconArrow size={11} />
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
  active,
  href,
}: {
  Icon?: ComponentIcon;
  label: string;
  active?: boolean;
  href?: string;
}) {
  const className =
    "flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-[13.5px] transition-colors";
  const style = {
    background: active ? "rgba(127,127,127,0.07)" : "transparent",
    color: active ? "var(--text)" : "var(--text-2)",
  };
  const inner = (
    <>
      {Icon && <Icon size={15} sw={1.7} color={active ? "#BFB5FF" : "currentColor"} />}
      <span className="flex-1">{label}</span>
    </>
  );
  if (href) {
    return (
      <Link href={href} className={`pp-related ${className}`} style={style}>
        {inner}
      </Link>
    );
  }
  return (
    <div className={className} style={style}>
      {inner}
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
        <div className="text-[13px]" style={{ color: "var(--text-2)" }}>
          {label}
        </div>
        <div className="pp-mono text-xs">
          <span style={{ color }}>{used}</span>
          <span style={{ color: "var(--text-3)" }}> / {total}</span>
        </div>
      </div>
      <div className="pp-progress">
        <span style={{ width: `${(used / total) * 100}%`, background: `linear-gradient(90deg, ${color}, ${color}99)` }} />
      </div>
      <div className="mt-2.5 text-[11.5px]" style={{ color: "var(--text-3)" }}>
        {sub}
      </div>
    </div>
  );
}
