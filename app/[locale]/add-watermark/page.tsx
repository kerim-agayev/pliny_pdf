import { setRequestLocale, getTranslations } from "next-intl/server";
import { ToolShell } from "@/components/tools/ToolShell";
import { ToolMount } from "@/components/tools/ToolMount";
import { toolMetadata } from "@/lib/seo";
import { toolSchemas } from "@/lib/structured-data";
import { JsonLd } from "@/components/seo/JsonLd";

export const generateMetadata = toolMetadata("add-watermark");

export default async function WatermarkPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("ToolPages.watermark");
  return (
    <>
      <JsonLd data={toolSchemas("add-watermark")} />
      <ToolShell toolId="watermark" subtitle={t("subtitle")} fullWidth>
        <ToolMount component="WatermarkTool" />
      </ToolShell>
    </>
  );
}
