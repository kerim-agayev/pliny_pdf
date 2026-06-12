import { setRequestLocale, getTranslations } from "next-intl/server";
import { ToolShell } from "@/components/tools/ToolShell";
import { ToolMount } from "@/components/tools/ToolMount";
import { toolMetadata } from "@/lib/seo";
import { toolSchemas } from "@/lib/structured-data";
import { JsonLd } from "@/components/seo/JsonLd";

export const generateMetadata = toolMetadata("n-up-layout");

export default async function NupLayoutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("ToolPages.nupLayout");
  return (
    <>
      <JsonLd data={toolSchemas("n-up-layout")} />
      <ToolShell toolId="nupLayout" subtitle={t("subtitle")} related={["organize-pages", "split", "rotate"]}>
        <ToolMount component="NupLayoutTool" />
      </ToolShell>
    </>
  );
}
