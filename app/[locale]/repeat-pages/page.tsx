import { setRequestLocale, getTranslations } from "next-intl/server";
import { ToolShell } from "@/components/tools/ToolShell";
import { ToolMount } from "@/components/tools/ToolMount";
import { toolMetadata } from "@/lib/seo";
import { toolSchemas } from "@/lib/structured-data";
import { JsonLd } from "@/components/seo/JsonLd";

export const generateMetadata = toolMetadata("repeat-pages");

export default async function RepeatPagesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("ToolPages.repeatPages");
  return (
    <>
      <JsonLd data={toolSchemas("repeat-pages", locale)} />
      <ToolShell
        toolId="repeatPages"
        subtitle={t("subtitle")}
        related={["organize-pages", "n-up-layout", "reverse-pages"]}
      >
        <ToolMount component="RepeatPagesTool" />
      </ToolShell>
    </>
  );
}
