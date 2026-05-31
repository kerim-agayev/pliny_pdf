import { setRequestLocale, getTranslations } from "next-intl/server";
import { ToolShell } from "@/components/tools/ToolShell";
import { RotateTool } from "@/components/tools/RotateTool";
import { toolMetadata } from "@/lib/seo";
import { toolSchemas } from "@/lib/structured-data";
import { JsonLd } from "@/components/seo/JsonLd";

export const generateMetadata = toolMetadata("rotate-pdf");

export default async function RotatePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("ToolPages.rotate");
  return (
    <>
      <JsonLd data={toolSchemas("rotate-pdf")} />
      <ToolShell toolId="rotate" subtitle={t("subtitle")} related={["merge", "split", "compress"]}>
        <RotateTool />
      </ToolShell>
    </>
  );
}
