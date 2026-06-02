import { setRequestLocale, getTranslations } from "next-intl/server";
import { ToolShell } from "@/components/tools/ToolShell";
import { ToolMount } from "@/components/tools/ToolMount";
import { toolMetadata } from "@/lib/seo";
import { toolSchemas } from "@/lib/structured-data";
import { JsonLd } from "@/components/seo/JsonLd";

export const generateMetadata = toolMetadata("ocr-pdf");

export default async function OcrPdfPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("ToolPages.ocrPdf");
  return (
    <>
      <JsonLd data={toolSchemas("ocr-pdf")} />
      <ToolShell toolId="ocr-pdf" subtitle={t("subtitle")} related={["pdf-to-word", "summarize", "compress"]}>
        <ToolMount component="OcrPdf" />
      </ToolShell>
    </>
  );
}
