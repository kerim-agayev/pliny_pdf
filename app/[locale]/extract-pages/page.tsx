import { setRequestLocale, getTranslations } from "next-intl/server";
import { ToolShell } from "@/components/tools/ToolShell";
import { ExtractPages } from "@/components/tools/ExtractPages";
import { toolMetadata } from "@/lib/seo";
import { toolSchemas } from "@/lib/structured-data";
import { JsonLd } from "@/components/seo/JsonLd";

export const generateMetadata = toolMetadata("extract-pages");

export default async function ExtractPagesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("ToolPages.extractPages");
  return (
    <>
      <JsonLd data={toolSchemas("extract-pages")} />
      <ToolShell toolId="extract-pages" subtitle={t("subtitle")} related={["delete-pages", "split", "merge"]}>
        <ExtractPages />
      </ToolShell>
    </>
  );
}
