import { setRequestLocale, getTranslations } from "next-intl/server";
import { ToolShell } from "@/components/tools/ToolShell";
import { ToolMount } from "@/components/tools/ToolMount";
import { toolMetadata } from "@/lib/seo";
import { toolSchemas } from "@/lib/structured-data";
import { JsonLd } from "@/components/seo/JsonLd";

export const generateMetadata = toolMetadata("split-pdf");

export default async function SplitPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("ToolPages.split");
  return (
    <>
      <JsonLd data={toolSchemas("split-pdf", locale)} />
      <ToolShell toolId="split" subtitle={t("subtitle")} related={["merge", "rotate", "compress"]}>
        <ToolMount component="SplitTool" />
      </ToolShell>
    </>
  );
}
