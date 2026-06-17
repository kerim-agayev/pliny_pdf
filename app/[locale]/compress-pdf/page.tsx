import { setRequestLocale, getTranslations } from "next-intl/server";
import { ToolShell } from "@/components/tools/ToolShell";
import { ToolMount } from "@/components/tools/ToolMount";
import { toolMetadata } from "@/lib/seo";
import { toolSchemas } from "@/lib/structured-data";
import { JsonLd } from "@/components/seo/JsonLd";

export const generateMetadata = toolMetadata("compress-pdf");

export default async function CompressPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("ToolPages.compress");
  return (
    <>
      <JsonLd data={toolSchemas("compress-pdf", locale)} />
      <ToolShell toolId="compress" subtitle={t("subtitle")} related={["merge", "split", "rotate"]}>
        <ToolMount component="CompressTool" />
      </ToolShell>
    </>
  );
}
