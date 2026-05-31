import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getAllPosts } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog — PlinyPDF",
  description: "Privacy, PDFs, and how online tools really work. Guides and comparisons from PlinyPDF.",
};

export default async function BlogPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Blog");
  const posts = getAllPosts();
  const fmt = new Intl.DateTimeFormat(locale, { year: "numeric", month: "long", day: "numeric" });

  return (
    <section className="mx-auto max-w-[760px] px-5 pt-16 pb-24 sm:px-8">
      <h1 className="font-[family-name:var(--font-display)] text-[clamp(30px,5vw,42px)] font-bold tracking-[-0.03em]">
        {t("title")}
      </h1>
      <p className="mt-3 text-[17px]" style={{ color: "var(--text-2)" }}>
        {t("subtitle")}
      </p>

      {posts.length === 0 ? (
        <p className="mt-12" style={{ color: "var(--text-3)" }}>
          {t("empty")}
        </p>
      ) : (
        <ul className="mt-12 flex flex-col gap-7">
          {posts.map((post) => (
            <li key={post.slug}>
              <Link href={`/blog/${post.slug}`} className="group block">
                <article
                  className="pp-card transition-colors"
                  style={{ padding: 24 }}
                >
                  <div
                    className="pp-mono flex items-center gap-2 text-[12px]"
                    style={{ color: "var(--text-3)" }}
                  >
                    <time dateTime={post.date}>{fmt.format(new Date(post.date))}</time>
                    <span>·</span>
                    <span>
                      {post.readingTime} {t("minRead")}
                    </span>
                  </div>
                  <h2 className="mt-2.5 font-[family-name:var(--font-display)] text-[21px] font-semibold tracking-[-0.02em] transition-colors group-hover:text-[var(--brand)]">
                    {post.title}
                  </h2>
                  <p className="mt-2 text-[15px] leading-relaxed" style={{ color: "var(--text-2)" }}>
                    {post.excerpt}
                  </p>
                  <span className="mt-3 inline-block text-[14px] font-medium" style={{ color: "var(--brand)" }}>
                    {t("readMore")}
                  </span>
                </article>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
