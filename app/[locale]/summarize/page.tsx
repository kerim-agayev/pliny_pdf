import { setRequestLocale, getTranslations } from "next-intl/server";
import { ToolShell } from "@/components/tools/ToolShell";
import { SummarizeTool } from "@/components/tools/SummarizeTool";
import { toolMetadata } from "@/lib/seo";
import { toolSchemas } from "@/lib/structured-data";
import { JsonLd } from "@/components/seo/JsonLd";

export const generateMetadata = toolMetadata("summarize");

export default async function SummarizePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("ToolPages.summarize");
  return (
    <>
      <JsonLd data={toolSchemas("summarize")} />
      <ToolShell toolId="summarize" subtitle={t("subtitle")} related={["pdf-to-word", "merge", "compress"]}>
        <SummarizeTool />
      </ToolShell>
    </>
  );
}
