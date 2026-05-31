import { setRequestLocale, getTranslations } from "next-intl/server";
import { ToolShell } from "@/components/tools/ToolShell";
import { MergeTool } from "@/components/tools/MergeTool";
import { toolMetadata } from "@/lib/seo";
import { toolSchemas } from "@/lib/structured-data";
import { JsonLd } from "@/components/seo/JsonLd";

export const generateMetadata = toolMetadata("merge-pdf");

export default async function MergePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("ToolPages.merge");
  return (
    <>
      <JsonLd data={toolSchemas("merge-pdf")} />
      <ToolShell toolId="merge" subtitle={t("subtitle")} related={["split", "compress", "rotate"]}>
        <MergeTool />
      </ToolShell>
    </>
  );
}
