import { setRequestLocale, getTranslations } from "next-intl/server";
import { ToolShell } from "@/components/tools/ToolShell";
import { ToolMount } from "@/components/tools/ToolMount";
import { toolMetadata } from "@/lib/seo";
import { toolSchemas } from "@/lib/structured-data";
import { JsonLd } from "@/components/seo/JsonLd";

export const generateMetadata = toolMetadata("jpg-to-pdf");

export default async function JpgToPdfPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("ToolPages.jpgToPdf");
  return (
    <>
      <JsonLd data={toolSchemas("jpg-to-pdf")} />
      <ToolShell toolId="jpg-to-pdf" subtitle={t("subtitle")} related={["pdf-to-jpg", "merge", "compress"]}>
        <ToolMount component="JpgToPdfTool" />
      </ToolShell>
    </>
  );
}
