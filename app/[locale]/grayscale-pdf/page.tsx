import { setRequestLocale, getTranslations } from "next-intl/server";
import { ToolShell } from "@/components/tools/ToolShell";
import { ToolMount } from "@/components/tools/ToolMount";
import { toolMetadata } from "@/lib/seo";
import { toolSchemas } from "@/lib/structured-data";
import { JsonLd } from "@/components/seo/JsonLd";

export const generateMetadata = toolMetadata("grayscale-pdf");

export default async function GrayscalePdfPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("ToolPages.grayscalePdf");
  return (
    <>
      <JsonLd data={toolSchemas("grayscale-pdf", locale)} />
      <ToolShell toolId="grayscale-pdf" subtitle={t("subtitle")} related={["compress", "crop-pdf", "edit"]}>
        <ToolMount component="GrayscalePdf" />
      </ToolShell>
    </>
  );
}
