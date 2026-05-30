import { setRequestLocale, getTranslations } from "next-intl/server";
import { ComingSoon } from "@/components/marketing/ComingSoon";

export default async function BlogPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Pages");
  return <ComingSoon title={t("blog")} />;
}
