import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ToolCard } from "@/components/shared/ToolCard";
import { PlanCard } from "@/components/marketing/PlanCard";
import { PrivacyBadge } from "@/components/shared/PrivacyBadge";
import { pageMetadata } from "@/lib/seo";
import {
  IconArrow,
  IconCheck,
  IconDownload,
  IconMerge,
  IconPlus,
  IconX,
  IconGrip,
  IconShield,
  IconSparkle,
  IconGlobe,
} from "@/components/shared/icons";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata({
    locale,
    path: "/",
    title: "PlinyPDF — Edit PDFs without uploading them",
    description:
      "Privacy-first online PDF toolkit. Files are processed in your browser whenever possible.",
  });
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <HomeContent />;
}

function HomeContent() {
  const t = useTranslations("Home");
  const popular = ["merge", "compress", "pdf-to-word", "watermark", "split", "protect"];

  const why = [
    { Icon: IconShield, accent: "#34D399", title: t("whyPrivacyTitle"), body: t("whyPrivacyBody"), sub: t("whyPrivacySub") },
    { Icon: IconSparkle, accent: "#BFB5FF", title: t("whyAiTitle"), body: t("whyAiBody"), sub: t("whyAiSub") },
    { Icon: IconGlobe, accent: "#60A5FA", title: t("whyLangTitle"), body: t("whyLangBody"), sub: t("whyLangSub") },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="pp-grad-hero relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(color-mix(in srgb, var(--text) 4%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb, var(--text) 4%, transparent) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
            maskImage: "radial-gradient(ellipse 70% 60% at 50% 30%, black 30%, transparent 80%)",
            WebkitMaskImage: "radial-gradient(ellipse 70% 60% at 50% 30%, black 30%, transparent 80%)",
          }}
        />
        <div className="relative mx-auto max-w-[1100px] px-6 pt-[88px] pb-24 text-center sm:px-10">
          <div
            className="mb-7 inline-flex items-center gap-2 rounded-full py-1.5 pl-2 pr-3 text-[12.5px]"
            style={{ background: "rgba(127,127,127,0.06)", border: "1px solid var(--line-2)", color: "var(--text-2)" }}
          >
            <span className="pp-badge local" style={{ padding: "2px 8px", fontSize: 10.5 }}>
              <span className="pp-dot" /> v2.4
            </span>
            {t("heroBadge")} · <span style={{ color: "#8B7CF0" }}>{t("heroBadgeLink")}</span>
          </div>
          <h1 className="mb-6 text-[clamp(44px,7vw,76px)] font-bold leading-[1.02] tracking-[-0.035em]" style={{ textWrap: "balance" }}>
            {t("headlineStart")}
            <br />
            <span
              className="italic"
              style={{
                background: "linear-gradient(90deg, #BFB5FF 0%, #6B5CE7 60%, #34D399 100%)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                WebkitTextFillColor: "transparent",
                fontWeight: 600,
              }}
            >
              {t("headlineAccent")}
            </span>
          </h1>
          <p className="mx-auto mb-9 max-w-[620px] text-[19px] leading-relaxed" style={{ color: "var(--text-2)" }}>
            {t("subhead")}
          </p>
          <div className="mb-10 flex flex-wrap justify-center gap-3">
            <Link href="/tools" className="pp-btn pp-btn-lg">
              {t("ctaPrimary")} <IconArrow size={16} />
            </Link>
            <Link href="/tools" className="pp-btn pp-btn-lg pp-btn-ghost">
              {t("ctaSecondary")} <IconArrow size={16} />
            </Link>
          </div>
          <div className="inline-flex flex-wrap justify-center gap-6 text-[13.5px]" style={{ color: "var(--text-2)" }}>
            <span className="inline-flex items-center gap-2">
              <span className="pp-dot" style={{ color: "#34D399" }} /> {t("trustNoUploads")}
            </span>
            <span style={{ color: "var(--line-2)" }}>·</span>
            <span className="inline-flex items-center gap-2">
              <span className="pp-mono" style={{ color: "#8B7CF0" }}>∞</span> {t("trustNoLimits")}
            </span>
            <span style={{ color: "var(--line-2)" }}>·</span>
            <span className="inline-flex items-center gap-2">
              <IconX size={13} color="#F43F5E" sw={2} /> {t("trustNoWatermark")}
            </span>
          </div>
        </div>
        <div className="relative mx-auto max-w-[980px] px-6 pb-20 sm:px-10">
          <HeroPreview />
        </div>
      </section>

      {/* Popular tools */}
      <section className="px-5 py-24 sm:px-10" style={{ borderTop: "1px solid var(--line)" }}>
        <div className="mx-auto max-w-[1180px]">
          <div className="mb-11 flex items-end justify-between gap-10">
            <div>
              <Kicker>{t("popularKicker")}</Kicker>
              <h2 className="text-[40px] tracking-[-0.025em]">{t("popularTitle")}</h2>
            </div>
            <Link href="/tools" className="inline-flex shrink-0 items-center gap-1.5 pb-2 text-sm" style={{ color: "var(--text-2)" }}>
              {t("seeAllTools")} <IconArrow size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {popular.map((id) => (
              <ToolCard key={id} toolId={id} />
            ))}
          </div>
        </div>
      </section>

      {/* Why */}
      <section className="px-5 py-24 sm:px-10" style={{ borderTop: "1px solid var(--line)", background: "var(--bg-2)" }}>
        <div className="mx-auto max-w-[1180px]">
          <Kicker>{t("whyKicker")}</Kicker>
          <h2 className="max-w-[700px] text-[40px] tracking-[-0.025em]">{t("whyTitle")}</h2>
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            {why.map((c, i) => (
              <div key={i} className="pp-card" style={{ padding: 28 }}>
                <div
                  className="mb-5 flex items-center justify-center rounded-[11px]"
                  style={{ width: 44, height: 44, background: "rgba(127,127,127,0.06)", border: "1px solid var(--line)", color: c.accent }}
                >
                  <c.Icon size={22} sw={1.6} />
                </div>
                <h3 className="mb-2.5 text-[19px] tracking-[-0.02em]">{c.title}</h3>
                <p className="mb-[18px] text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>{c.body}</p>
                <div className="pp-mono pt-3.5 text-[11.5px]" style={{ color: "var(--text-3)", borderTop: "1px solid var(--line)" }}>
                  {c.sub}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing preview */}
      <section className="px-5 py-24 sm:px-10" style={{ borderTop: "1px solid var(--line)" }}>
        <div className="mx-auto max-w-[1180px]">
          <div className="mb-11 flex items-end justify-between gap-10">
            <div>
              <Kicker>{t("pricingKicker")}</Kicker>
              <h2 className="text-[40px] tracking-[-0.025em]">{t("pricingTitle")}</h2>
            </div>
            <Link href="/pricing" className="inline-flex shrink-0 items-center gap-1.5 pb-2 text-sm" style={{ color: "var(--text-2)" }}>
              {t("pricingSeeAll")} <IconArrow size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <PlanCard plan="free" compact />
            <PlanCard plan="pro" compact />
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section
        className="px-5 py-[120px] text-center sm:px-10"
        style={{
          borderTop: "1px solid var(--line)",
          background:
            "radial-gradient(60% 100% at 50% 0%, rgba(107,92,231,0.22) 0%, rgba(107,92,231,0) 70%), var(--bg)",
        }}
      >
        <h2 className="mb-5 text-[clamp(36px,6vw,56px)] tracking-[-0.03em]" style={{ textWrap: "balance" }}>
          {t("ctaTitle1")}
          <br />
          {t("ctaTitle2")}
        </h2>
        <p className="mx-auto mb-8 max-w-[520px] text-[17px]" style={{ color: "var(--text-2)" }}>
          {t("ctaBody")}
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/tools" className="pp-btn pp-btn-lg">
            {t("ctaStart")} <IconArrow size={16} />
          </Link>
          <Link href="/pricing" className="pp-btn pp-btn-lg pp-btn-ghost">
            {t("ctaPricing")}
          </Link>
        </div>
      </section>
    </div>
  );
}

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <div className="pp-mono mb-3 text-[11.5px] font-medium uppercase tracking-[0.14em]" style={{ color: "#8B7CF0" }}>
      {children}
    </div>
  );
}

function HeroPreview() {
  const t = useTranslations("Home");
  const files = [
    { name: "invoice-q4.pdf", size: "124 KB", pages: 2 },
    { name: "invoice-q3.pdf", size: "98 KB", pages: 1 },
    { name: "invoice-q2.pdf", size: "142 KB", pages: 3 },
  ];
  return (
    <div
      className="relative rounded-[18px] p-5"
      style={{
        background: "linear-gradient(180deg, var(--card), var(--bg-2))",
        border: "1px solid var(--line-2)",
        boxShadow: "var(--shadow-lg)",
      }}
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="flex size-7 items-center justify-center rounded-lg"
            style={{ background: "rgba(107,92,231,0.14)", border: "1px solid rgba(107,92,231,0.3)", color: "#8B7CF0" }}
          >
            <IconMerge size={15} sw={1.7} />
          </div>
          <div>
            <div className="text-[13.5px] font-semibold">Merge PDF</div>
            <div className="pp-mono text-[11px]" style={{ color: "var(--text-3)" }}>plinypdf.com/merge</div>
          </div>
        </div>
        <PrivacyBadge type="local" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1.4fr_1fr]">
        <div className="flex flex-col gap-2 rounded-xl p-3.5" style={{ background: "var(--bg)", border: "1px solid var(--line)" }}>
          {files.map((f) => (
            <div key={f.name} className="pp-filerow" style={{ padding: "10px 12px" }}>
              <IconGrip size={14} color="var(--text-3)" />
              <div
                className="flex h-8 w-7 shrink-0 items-end justify-center rounded pb-0.5"
                style={{ background: "linear-gradient(180deg, #2A1B47, #1A1228)", border: "1px solid rgba(107,92,231,0.3)" }}
              >
                <span className="pp-mono text-[7px]" style={{ color: "#BFB5FF" }}>PDF</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[12.5px] font-medium" style={{ color: "var(--text)" }}>{f.name}</div>
                <div className="pp-mono text-[10.5px]" style={{ color: "var(--text-3)" }}>{f.size} · {f.pages} pages</div>
              </div>
              <IconX size={13} color="var(--text-3)" />
            </div>
          ))}
          <div
            className="mt-1 flex items-center justify-center gap-2 rounded-[10px] px-3 py-2.5 text-[12.5px]"
            style={{ border: "1.5px dashed var(--line-2)", color: "var(--text-3)" }}
          >
            <IconPlus size={13} /> Drop more PDFs
          </div>
        </div>
        <div className="flex flex-col gap-3 rounded-xl p-3.5" style={{ background: "var(--bg)", border: "1px solid var(--line)" }}>
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--text-3)" }}>Output</div>
          <div
            className="flex flex-1 flex-col gap-2 rounded-lg p-3"
            style={{ background: "linear-gradient(180deg, rgba(107,92,231,0.16), rgba(107,92,231,0.02))", border: "1px solid rgba(107,92,231,0.3)" }}
          >
            <div className="flex items-center gap-2">
              <span className="pp-check"><IconCheck size={11} /></span>
              <div className="text-[12.5px] font-medium">merged.pdf</div>
            </div>
            <div className="pp-mono text-[10.5px]" style={{ color: "var(--text-3)" }}>6 pages · 364 KB · 0.4 s</div>
            <div className="flex-1" />
            <button className="pp-btn w-full justify-center" style={{ padding: 9 }}>
              <IconDownload size={14} /> {t("previewDownload")}
            </button>
          </div>
          <div className="pp-mono flex items-center gap-1.5 text-[10.5px]" style={{ color: "var(--text-3)" }}>
            <span className="pp-dot" style={{ color: "#34D399" }} /> {t("previewProcessed")}
          </div>
        </div>
      </div>
    </div>
  );
}
