import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { LegalShell, LegalSection } from "@/components/marketing/LegalShell";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata({
    locale,
    path: "/support",
    title: "Support & Refunds — PlinyPDF",
    description:
      "Get help with PlinyPDF, ask billing questions, or request a refund under our 14-day guarantee. We reply within 24 hours.",
  });
}

export default async function SupportPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Support");

  const mail = (chunks: React.ReactNode) => (
    <a href="mailto:support@plinypdf.com" className="underline hover:text-[var(--text)]">
      {chunks}
    </a>
  );

  return (
    <LegalShell title={t("title")} intro={t("intro")}>
      <LegalSection heading={t("h.refunds")}>
        <p>{t.rich("refundsBody", { mail })}</p>
      </LegalSection>

      <LegalSection heading={t("h.contact")}>
        <p>{t.rich("contactBody", { mail })}</p>
      </LegalSection>
    </LegalShell>
  );
}
