import { setRequestLocale, getTranslations } from "next-intl/server";
import { ToolShell } from "@/components/tools/ToolShell";
import { ToolMount } from "@/components/tools/ToolMount";
import { toolMetadata } from "@/lib/seo";
import { toolSchemas } from "@/lib/structured-data";
import { JsonLd } from "@/components/seo/JsonLd";

export const generateMetadata = toolMetadata("pdf-to-text");

export default async function PdfToTextPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("ToolPages.pdfToText");
  return (
    <>
      <JsonLd data={toolSchemas("pdf-to-text")} />
      <ToolShell toolId="pdfToText" subtitle={t("subtitle")} fullWidth>
        <ToolMount component="PdfToTextTool" />
      </ToolShell>
    </>
  );
}
