import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { setRequestLocale, getTranslations, getFormatter } from "next-intl/server";
import { and, desc, eq, lt, count } from "drizzle-orm";
import { Link } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { fileHistory } from "@/lib/db/schema";
import { remainingServerTool, remainingAi } from "@/lib/ratelimit";
import { TOOLS, toolBySlug } from "@/lib/tools";
import { formatBytes } from "@/lib/format";
import { PrivacyBadge } from "@/components/shared/PrivacyBadge";
import {
  IconArrow,
  IconBolt,
  IconClock,
  IconStar,
  IconFolder,
  IconSettings,
  IconFile,
  type IconProps,
} from "@/components/shared/icons";

export const metadata: Metadata = {
  title: "Dashboard — PlinyPDF",
};

type ComponentIcon = (p: IconProps) => React.ReactElement;

// Quick-tool shortcuts. Pro leads with the cloud/AI tools it unlocks.
const QUICK_FREE = ["merge", "compress", "watermark", "split", "rotate", "protect"];
const QUICK_PRO = ["summarize", "merge", "compress", "watermark", "pdf-to-word", "split", "protect"];

const SERVER_LIMIT = 10;
const AI_LIMIT = 2;

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

export default async function DashboardRoute({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, format] = await Promise.all([getTranslations("Dashboard"), getFormatter()]);

  // Auth guard — server-side session via the shared Better Auth instance.
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect(`/${locale}/login`);
  const user = session.user;
  const plan = ((user as { plan?: string }).plan ?? "free") === "pro" ? "pro" : "free";
  const isPro = plan === "pro";

  // History window: 7 days free, 30 days Pro. Purge older rows on load (cron later).
  const windowDays = isPro ? 30 : 7;
  const cutoff = new Date(Date.now() - windowDays * 86_400_000);
  await db
    .delete(fileHistory)
    .where(and(eq(fileHistory.userId, user.id), lt(fileHistory.createdAt, cutoff)));

  const recent = await db
    .select()
    .from(fileHistory)
    .where(eq(fileHistory.userId, user.id))
    .orderBy(desc(fileHistory.createdAt))
    .limit(isPro ? 12 : 8);

  // Free: live usage from the rate limiter. Pro: period totals (no caps).
  let serverUsed = 0;
  let aiUsed = 0;
  let filesProcessed = 0;
  let aiProcessed = 0;
  if (isPro) {
    const [[fp], [ac]] = await Promise.all([
      db.select({ c: count() }).from(fileHistory).where(eq(fileHistory.userId, user.id)),
      db
        .select({ c: count() })
        .from(fileHistory)
        .where(and(eq(fileHistory.userId, user.id), eq(fileHistory.toolSlug, "summarize"))),
    ]);
    filesProcessed = Number(fp?.c ?? 0);
    aiProcessed = Number(ac?.c ?? 0);
  } else {
    const [sr, ar] = await Promise.all([
      remainingServerTool("free", user.id),
      remainingAi("free", user.id),
    ]);
    serverUsed = clamp(SERVER_LIMIT - sr, 0, SERVER_LIMIT);
    aiUsed = clamp(AI_LIMIT - ar, 0, AI_LIMIT);
  }

  const firstName = (user.name || user.email || "").split(/[\s@]/)[0] || "there";
  const quick = (isPro ? QUICK_PRO : QUICK_FREE)
    .map((id) => TOOLS.find((x) => x.id === id))
    .filter((x): x is (typeof TOOLS)[number] => Boolean(x));

  return (
    <div className="flex">
      {/* Sidebar */}
      <aside
        className="hidden w-60 flex-col gap-7 px-4 py-7 lg:flex"
        style={{ borderRight: "1px solid var(--line)", minHeight: "calc(100vh - 64px)" }}
      >
        {isPro && (
          <div
            className="flex items-center gap-2.5 rounded-[10px] px-3 py-2.5"
            style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.22)" }}
          >
            <span
              style={{ width: 8, height: 8, borderRadius: "50%", background: "#34D399", boxShadow: "0 0 8px #34D399" }}
            />
            <div className="text-[12.5px] font-semibold" style={{ color: "#6EE7B7" }}>
              {t("proUnlimited")}
            </div>
          </div>
        )}
        <div>
          <SideLabel>Library</SideLabel>
          <SideItem Icon={IconClock} label="Recent" href="/dashboard" active />
          <SideItem Icon={IconStar} label="Favorites" href="/tools" />
          <SideItem Icon={IconFolder} label={t("historyRange", { days: windowDays })} href="/dashboard" />
        </div>
        <div>
          <SideLabel>Tools</SideLabel>
          {(isPro ? ["Organize", "Convert", "Edit", "Secure", "AI"] : ["Organize", "Convert", "Edit", "Secure"]).map(
            (c) => (
              <SideItem key={c} label={c} href={`/tools?category=${c}`} />
            ),
          )}
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
                ...(isPro
                  ? { background: "rgba(16,185,129,0.12)", borderColor: "rgba(16,185,129,0.28)", color: "#6EE7B7" }
                  : { background: "rgba(127,127,127,0.16)", borderColor: "var(--line-2)", color: "var(--text)" }),
              }}
            >
              {isPro ? t("planPro") : t("planFree")}
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

          {/* Usage (Free) or stats (Pro) */}
          <aside className="flex flex-col gap-3.5">
            <h2 className="text-lg tracking-[-0.015em]">{isPro ? t("thisMonth") : t("usage")}</h2>
            {isPro ? (
              <div className="pp-card" style={{ padding: 20 }}>
                <div className="grid grid-cols-2 gap-[18px]">
                  <StatCell label={t("filesProcessed")} value={String(filesProcessed)} note={t("unlimited")} />
                  <StatCell label={t("aiSummaries")} value={String(aiProcessed)} note={t("unlimited")} />
                </div>
                <hr className="pp-hr" style={{ margin: "16px 0 0" }} />
                <div className="mt-3.5 flex items-center gap-1.5 text-[12.5px]" style={{ color: "var(--text-2)" }}>
                  <IconBolt size={13} color="#6EE7B7" sw={1.7} />
                  {t("proPerk")}
                </div>
              </div>
            ) : (
              <>
                <UsageCard
                  label={t("serverTools")}
                  used={serverUsed}
                  total={SERVER_LIMIT}
                  color="#6B5CE7"
                  sub={t("perDay", { used: serverUsed, total: SERVER_LIMIT })}
                />
                <UsageCard
                  label={t("aiSummaries")}
                  used={aiUsed}
                  total={AI_LIMIT}
                  color="#F472B6"
                  sub={t("perMonth", { used: aiUsed, total: AI_LIMIT })}
                />
                <div
                  className="mt-2 rounded-[14px] p-5"
                  style={{
                    background: "linear-gradient(180deg, rgba(107,92,231,0.1), rgba(107,92,231,0.02))",
                    border: "1px solid rgba(107,92,231,0.22)",
                  }}
                >
                  <div className="mb-2 flex items-center gap-2">
                    <IconBolt size={14} color="#BFB5FF" sw={1.7} />
                    <div className="text-[13px] font-semibold" style={{ color: "#BFB5FF" }}>
                      {t("upgradeTitle")}
                    </div>
                  </div>
                  <p className="mb-3 text-[12.5px] leading-relaxed" style={{ color: "var(--text-2)" }}>
                    {t("upgradeBody")}
                  </p>
                  <Link
                    href="/pricing"
                    className="inline-flex items-center gap-1 text-[12.5px]"
                    style={{ color: "#BFB5FF" }}
                  >
                    {t("upgradeCta")} <IconArrow size={11} />
                  </Link>
                </div>
              </>
            )}
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

function StatCell({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div>
      <div
        className="pp-mono mb-1.5 text-[11px] uppercase tracking-[0.06em]"
        style={{ color: "var(--text-3)" }}
      >
        {label}
      </div>
      <div
        className="text-2xl font-semibold tracking-[-0.02em]"
        style={{ color: "var(--text)", fontFamily: "var(--font-display)" }}
      >
        {value}
      </div>
      <div className="pp-mono mt-0.5 text-[10.5px]" style={{ color: "#6EE7B7" }}>
        {note}
      </div>
    </div>
  );
}
