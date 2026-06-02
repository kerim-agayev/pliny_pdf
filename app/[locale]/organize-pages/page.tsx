import { setRequestLocale, getTranslations } from "next-intl/server";
import { ToolShell } from "@/components/tools/ToolShell";
import { ToolMount } from "@/components/tools/ToolMount";
import { toolMetadata } from "@/lib/seo";
import { toolSchemas } from "@/lib/structured-data";
import { JsonLd } from "@/components/seo/JsonLd";

export const generateMetadata = toolMetadata("organize-pages");

export default async function OrganizePagesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("ToolPages.organizePages");
  return (
    <>
      <JsonLd data={toolSchemas("organize-pages")} />
      <ToolShell toolId="organize-pages" subtitle={t("subtitle")} related={["merge", "delete-pages", "rotate"]} fullWidth>
        <ToolMount component="OrganizePages" />
      </ToolShell>
    </>
  );
}
