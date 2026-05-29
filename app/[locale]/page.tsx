import { setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { PrivacyBadge } from "@/components/shared/PrivacyBadge";
import { Link } from "@/i18n/navigation";

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
  return (
    <section className="mx-auto flex max-w-4xl flex-col items-start gap-8 px-6 py-24 sm:py-32">
      <PrivacyBadge type="local" />
      <h1 className="text-balance text-5xl font-bold tracking-tight sm:text-6xl">
        {t("headline")}
      </h1>
      <p className="max-w-2xl text-lg text-muted-foreground">{t("subhead")}</p>
      <Button asChild size="lg">
        <Link href="/tools">{t("cta")}</Link>
      </Button>
    </section>
  );
}
