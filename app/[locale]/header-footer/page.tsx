import { setRequestLocale, getTranslations } from "next-intl/server";
import { ToolShell } from "@/components/tools/ToolShell";
import { ToolMount } from "@/components/tools/ToolMount";
import { toolMetadata } from "@/lib/seo";
import { toolSchemas } from "@/lib/structured-data";
import { JsonLd } from "@/components/seo/JsonLd";

export const generateMetadata = toolMetadata("header-footer");

export default async function HeaderFooterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("ToolPages.headerFooter");
  return (
    <>
      <JsonLd data={toolSchemas("header-footer", locale)} />
      <ToolShell toolId="header-footer" subtitle={t("subtitle")} related={["add-page-numbers", "watermark", "edit"]} fullWidth>
        <ToolMount component="HeaderFooter" />
      </ToolShell>
    </>
  );
}
