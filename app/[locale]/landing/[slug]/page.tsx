import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getLanding, landingSlugs } from "@/lib/landing";
import { toolBySlug } from "@/lib/tools";
import { pageMetadata } from "@/lib/seo";
import { breadcrumbSchema } from "@/lib/structured-data";
import { JsonLd } from "@/components/seo/JsonLd";
import { IconChevron, IconArrow } from "@/components/shared/icons";

// Landing pages are EN-only SEO content (see lib/landing.ts).
const LANDING_LOCALE = "en";

export function generateStaticParams() {
  return landingSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const page = getLanding(slug);
  if (locale !== LANDING_LOCALE || !page) return {};
  return pageMetadata({
    locale,
    path: `/landing/${slug}`,
    title: page.title,
    description: page.description,
  });
}

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  // EN-only: don't render thin English copy under /tr or /ru.
  if (locale !== LANDING_LOCALE) notFound();
  setRequestLocale(locale);

  const page = getLanding(slug);
  if (!page) notFound();

  const primary = toolBySlug(page.toolSlug);
  if (!primary) notFound();

  const related = page.related
    .map((s) => toolBySlug(s))
    .filter((t): t is NonNullable<typeof t> => Boolean(t));

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: page.faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  const breadcrumbs = breadcrumbSchema(locale, [
    { name: "Home", path: "/" },
    { name: page.h1, path: `/landing/${slug}` },
  ]);

  return (
    <section className="px-5 pt-16 pb-24 sm:px-10">
      <JsonLd data={[faqSchema, breadcrumbs]} />
      <div className="mx-auto max-w-[820px]">
        <nav className="mb-7 flex items-center gap-2 text-[13px]" style={{ color: "var(--text-3)" }}>
          <Link href="/">Home</Link>
          <IconChevron size={12} color="var(--text-3)" />
          <span style={{ color: "var(--text-2)" }}>{page.h1}</span>
        </nav>

        <h1 className="font-[family-name:var(--font-display)] text-[clamp(30px,5vw,46px)] font-bold leading-[1.08] tracking-[-0.03em]">
          {page.h1}
        </h1>

        <div className="mt-6 flex flex-col gap-4" style={{ color: "var(--text-2)" }}>
          {page.intro.map((para, i) => (
            <p key={i} className="text-[16.5px] leading-[1.75]">
              {para}
            </p>
          ))}
        </div>

        <div className="mt-8">
          <Link href={`/${primary.slug}`} className="pp-btn pp-btn-lg">
            {page.cta}
            <IconArrow size={15} color="currentColor" />
          </Link>
        </div>

        {/* FAQ */}
        <div className="mt-16">
          <h2 className="mb-5 font-[family-name:var(--font-display)] text-[24px] font-semibold tracking-[-0.02em]">
            Frequently asked questions
          </h2>
          <div className="flex flex-col gap-3">
            {page.faq.map((f) => (
              <div key={f.q} className="pp-card" style={{ padding: 22 }}>
                <h3 className="mb-2 text-[15.5px] font-semibold tracking-[-0.01em]">{f.q}</h3>
                <p className="text-[14.5px] leading-[1.7]" style={{ color: "var(--text-2)" }}>
                  {f.a}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Related tools */}
        {related.length > 0 && (
          <div className="mt-16">
            <h2 className="mb-5 font-[family-name:var(--font-display)] text-[24px] font-semibold tracking-[-0.02em]">
              Related tools
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {related.map((rt) => (
                <Link
                  key={rt.id}
                  href={`/${rt.slug}`}
                  className="pp-card flex items-center gap-3.5"
                  style={{ padding: 18 }}
                >
                  <div
                    className="flex size-9 shrink-0 items-center justify-center rounded-[9px]"
                    style={{
                      background: "rgba(127,127,127,0.06)",
                      border: "1px solid var(--line)",
                      color: rt.accent,
                    }}
                  >
                    <rt.icon size={18} sw={1.7} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[14.5px] font-medium" style={{ color: "var(--text)" }}>
                      {rt.name}
                    </div>
                    <div className="truncate text-[12.5px]" style={{ color: "var(--text-3)" }}>
                      {rt.desc}
                    </div>
                  </div>
                  <IconArrow size={13} color="var(--text-3)" />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
