import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import Markdown from "markdown-to-jsx";
import { Link } from "@/i18n/navigation";
import { getAllSlugs, getPost } from "@/lib/blog";
import { pageMetadata, ogImageUrl, SITE_URL } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  const meta = pageMetadata({
    locale,
    path: `/blog/${slug}`,
    title: `${post.title} — PlinyPDF`,
    description: post.excerpt,
  });
  // Articles get the richer "article" OG type + published date.
  return {
    ...meta,
    openGraph: { ...meta.openGraph, type: "article", publishedTime: post.date },
  };
}

// Markdown styling using the project's design tokens. (Internal links are locale-prefixed
// by `localizeLinks` before rendering, so the anchor override stays a simple props form.)
const mdOptions = {
  overrides: {
    h2: {
      props: {
        className:
          "mt-9 mb-3 font-[family-name:var(--font-display)] text-[22px] font-semibold tracking-[-0.02em]",
      },
    },
    h3: {
      props: {
        className: "mt-6 mb-2 font-[family-name:var(--font-display)] text-[18px] font-semibold",
      },
    },
    p: { props: { className: "my-4 text-[16px] leading-[1.75]" } },
    ul: { props: { className: "my-4 ml-5 list-disc space-y-2 text-[16px] leading-[1.7]" } },
    ol: { props: { className: "my-4 ml-5 list-decimal space-y-2 text-[16px] leading-[1.7]" } },
    a: { props: { className: "underline hover:text-[var(--text)]" } },
    strong: { props: { className: "font-semibold text-[var(--text)]" } },
    table: { props: { className: "my-6 w-full border-collapse text-[14.5px]" } },
    th: {
      props: {
        className: "border-b py-2 pr-4 text-left font-semibold",
        style: { borderColor: "var(--line)" },
      },
    },
    td: {
      props: { className: "border-b py-2 pr-4 align-top", style: { borderColor: "var(--line)" } },
    },
  },
};

/** Prefix root-relative markdown links (e.g. /merge-pdf) with the active locale. */
function localizeLinks(markdown: string, locale: string): string {
  return markdown.replace(/\]\(\/(?!(?:en|tr|ru)\/)/g, `](/${locale}/`);
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const post = getPost(slug);
  if (!post) notFound();
  const t = await getTranslations("Blog");
  const fmt = new Intl.DateTimeFormat(locale, { year: "numeric", month: "long", day: "numeric" });

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    image: ogImageUrl(post.title, post.excerpt),
    url: `${SITE_URL}/${locale}/blog/${slug}`,
    author: { "@type": "Organization", name: "PlinyPDF" },
    publisher: { "@type": "Organization", name: "PlinyPDF" },
  };

  return (
    <article className="mx-auto max-w-[720px] px-5 pt-16 pb-24 sm:px-8">
      <JsonLd data={articleSchema} />
      <Link href="/blog" className="text-[14px]" style={{ color: "var(--text-3)" }}>
        {t("backToBlog")}
      </Link>
      <h1 className="mt-5 font-[family-name:var(--font-display)] text-[clamp(28px,4.5vw,40px)] font-bold leading-[1.1] tracking-[-0.03em]">
        {post.title}
      </h1>
      <div className="pp-mono mt-4 flex items-center gap-2 text-[12.5px]" style={{ color: "var(--text-3)" }}>
        <time dateTime={post.date}>{fmt.format(new Date(post.date))}</time>
        <span>·</span>
        <span>
          {post.readingTime} {t("minRead")}
        </span>
      </div>
      <div className="mt-8" style={{ color: "var(--text-2)" }}>
        <Markdown options={mdOptions}>{localizeLinks(post.content, locale)}</Markdown>
      </div>
    </article>
  );
}
