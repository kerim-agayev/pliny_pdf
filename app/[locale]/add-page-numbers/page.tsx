import { setRequestLocale, getTranslations } from "next-intl/server";
import { ToolShell } from "@/components/tools/ToolShell";
import { ToolMount } from "@/components/tools/ToolMount";
import { toolMetadata } from "@/lib/seo";
import { toolSchemas } from "@/lib/structured-data";
import { JsonLd } from "@/components/seo/JsonLd";

export const generateMetadata = toolMetadata("add-page-numbers");

export default async function AddPageNumbersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("ToolPages.addPageNumbers");
  return (
    <>
      <JsonLd data={toolSchemas("add-page-numbers", locale)} />
      <ToolShell toolId="add-page-numbers" subtitle={t("subtitle")} related={["header-footer", "edit", "rotate"]} fullWidth>
        <ToolMount component="AddPageNumbers" />
      </ToolShell>
    </>
  );
}
