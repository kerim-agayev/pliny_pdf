import { setRequestLocale, getTranslations } from "next-intl/server";
import { ToolShell } from "@/components/tools/ToolShell";
import { ToolMount } from "@/components/tools/ToolMount";
import { toolMetadata } from "@/lib/seo";
import { toolSchemas } from "@/lib/structured-data";
import { JsonLd } from "@/components/seo/JsonLd";

export const generateMetadata = toolMetadata("pdf-booklet");

export default async function PdfBookletPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("ToolPages.pdfBooklet");
  return (
    <>
      <JsonLd data={toolSchemas("pdf-booklet")} />
      <ToolShell
        toolId="pdfBooklet"
        subtitle={t("subtitle")}
        related={["n-up-layout", "repeat-pages", "organize-pages"]}
      >
        <ToolMount component="PdfBookletTool" />
      </ToolShell>
    </>
  );
}
