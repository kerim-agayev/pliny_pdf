import { setRequestLocale, getTranslations } from "next-intl/server";
import { ToolShell } from "@/components/tools/ToolShell";
import { ToolMount } from "@/components/tools/ToolMount";
import { toolMetadata } from "@/lib/seo";
import { toolSchemas } from "@/lib/structured-data";
import { JsonLd } from "@/components/seo/JsonLd";

export const generateMetadata = toolMetadata("remove-metadata");

export default async function RemoveMetadataPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("ToolPages.removeMetadata");
  return (
    <>
      <JsonLd data={toolSchemas("remove-metadata")} />
      <ToolShell toolId="remove-metadata" subtitle={t("subtitle")} related={["edit-metadata", "protect", "flatten-pdf"]}>
        <ToolMount component="RemoveMetadata" />
      </ToolShell>
    </>
  );
}
