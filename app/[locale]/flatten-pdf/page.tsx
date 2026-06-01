import { setRequestLocale, getTranslations } from "next-intl/server";
import { ToolShell } from "@/components/tools/ToolShell";
import { FlattenPdf } from "@/components/tools/FlattenPdf";
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
      <JsonLd data={toolSchemas("flatten-pdf")} />
      <ToolShell toolId="flatten-pdf" subtitle={t("subtitle")} related={["edit", "remove-metadata", "compress"]}>
        <FlattenPdf />
      </ToolShell>
    </>
  );
}
