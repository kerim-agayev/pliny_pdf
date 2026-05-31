import { setRequestLocale, getTranslations } from "next-intl/server";
import { ToolShell } from "@/components/tools/ToolShell";
import { PdfToJpgTool } from "@/components/tools/PdfToJpgTool";
import { toolMetadata } from "@/lib/seo";
import { toolSchemas } from "@/lib/structured-data";
import { JsonLd } from "@/components/seo/JsonLd";

export const generateMetadata = toolMetadata("pdf-to-jpg");

export default async function PdfToJpgPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("ToolPages.pdfToJpg");
  return (
    <>
      <JsonLd data={toolSchemas("pdf-to-jpg")} />
      <ToolShell toolId="pdf-to-jpg" subtitle={t("subtitle")} related={["jpg-to-pdf", "compress", "merge"]}>
        <PdfToJpgTool />
      </ToolShell>
    </>
  );
}
