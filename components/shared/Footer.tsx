import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { PlinyMark, IconHeart } from "./icons";

const LOCALE_LABELS: Record<string, string> = {
  en: "English",
  tr: "Türkçe",
  ru: "Русский",
};

export function Footer() {
  const t = useTranslations("Footer");
  const year = 2026;

  const columns: { title: string; links: { label: string; href: string }[] }[] = [
    {
      title: t("product"),
      links: [
        { label: t("allTools"), href: "/tools" },
        { label: t("about"), href: "/about" },
        { label: t("roadmap"), href: "/tools" },
        { label: t("changelog"), href: "/tools" },
      ],
    },
    {
      title: t("tools"),
      links: [
        { label: "Merge PDF", href: "/merge-pdf" },
        { label: "Compress PDF", href: "/compress-pdf" },
        { label: "Add Watermark", href: "/add-watermark" },
        { label: "Annotate PDF", href: "/pdf-editor" },
      ],
    },
    {
      title: t("company"),
      links: [
        { label: t("about"), href: "/about" },
        { label: t("blog"), href: "/blog" },
        { label: t("privacyPolicy"), href: "/privacy" },
        { label: t("terms"), href: "/terms" },
        { label: t("support"), href: "/support" },
      ],
    },
  ];

  return (
    <footer style={{ borderTop: "1px solid var(--line)", background: "var(--bg)", contain: "layout" }}>
      <div className="mx-auto max-w-[1240px] px-5 pt-14 pb-8 sm:px-10">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr_1fr]">
          <div className="col-span-2 md:col-span-1">
            <div className="mb-3.5 flex items-center gap-2.5">
              <PlinyMark size={26} color="var(--text)" />
              <span className="font-[family-name:var(--font-display)] text-base font-bold">
                PlinyPDF
              </span>
            </div>
            <p className="max-w-[260px] text-[13px] leading-relaxed" style={{ color: "var(--text-2)" }}>
              {t("tagline")}
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <div
                className="mb-3.5 text-[11px] font-semibold uppercase tracking-[0.1em]"
                style={{ color: "var(--text-2)" }}
              >
                {col.title}
              </div>
              <ul className="flex flex-col gap-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-[13.5px] transition-colors hover:text-[var(--text)]"
                      style={{ color: "var(--text-2)" }}
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <div
              className="mb-3.5 text-[11px] font-semibold uppercase tracking-[0.1em]"
              style={{ color: "var(--text-2)" }}
            >
              {t("languages")}
            </div>
            <ul className="flex flex-col gap-2.5">
              {routing.locales.map((loc) => (
                <li key={loc}>
                  <Link
                    href="/"
                    locale={loc}
                    className="text-[13.5px] transition-colors hover:text-[var(--text)]"
                    style={{ color: "var(--text-2)" }}
                  >
                    {LOCALE_LABELS[loc]}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <hr className="pp-hr my-0" />
        <div
          className="flex flex-col items-start justify-between gap-2 pt-6 text-[12.5px] sm:flex-row sm:items-center"
          style={{ color: "var(--text-2)" }}
        >
          <span>{t("rights", { year })}</span>
          <span className="inline-flex items-center gap-1.5">
            {t("madeWith")} <IconHeart size={12} color="#F472B6" sw={2} /> {t("forPrivacy")}
          </span>
        </div>
      </div>
    </footer>
  );
}
