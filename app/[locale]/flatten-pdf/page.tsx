import { setRequestLocale, getTranslations } from "next-intl/server";
import { ToolShell } from "@/components/tools/ToolShell";
import { ToolMount } from "@/components/tools/ToolMount";
import { toolMetadata } from "@/lib/seo";
import { toolSchemas } from "@/lib/structured-data";
import { JsonLd } from "@/components/seo/JsonLd";

export const generateMetadata = toolMetadata("flatten-pdf");

export default async function FlattenPdfPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("ToolPages.flattenPdf");
  return (
    <>
      <JsonLd data={toolSchemas("flatten-pdf", locale)} />
      <ToolShell toolId="flatten-pdf" subtitle={t("subtitle")} related={["edit", "remove-metadata", "compress"]}>
        <ToolMount component="FlattenPdf" />
      </ToolShell>
    </>
  );
}
