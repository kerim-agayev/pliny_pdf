import { setRequestLocale, getTranslations } from "next-intl/server";
import { ToolShell } from "@/components/tools/ToolShell";
import { CropPdf } from "@/components/tools/CropPdf";
import { toolMetadata } from "@/lib/seo";
import { toolSchemas } from "@/lib/structured-data";
import { JsonLd } from "@/components/seo/JsonLd";

export const generateMetadata = toolMetadata("crop-pdf");

export default async function CropPdfPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("ToolPages.cropPdf");
  return (
    <>
      <JsonLd data={toolSchemas("crop-pdf")} />
      <ToolShell toolId="crop-pdf" subtitle={t("subtitle")} related={["rotate", "compress", "organize-pages"]} fullWidth>
        <CropPdf />
      </ToolShell>
    </>
  );
}
