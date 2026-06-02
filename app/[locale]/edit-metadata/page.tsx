import { setRequestLocale, getTranslations } from "next-intl/server";
import { ToolShell } from "@/components/tools/ToolShell";
import { ToolMount } from "@/components/tools/ToolMount";
import { toolMetadata } from "@/lib/seo";
import { toolSchemas } from "@/lib/structured-data";
import { JsonLd } from "@/components/seo/JsonLd";

export const generateMetadata = toolMetadata("edit-metadata");

export default async function EditMetadataPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("ToolPages.editMetadata");
  return (
    <>
      <JsonLd data={toolSchemas("edit-metadata")} />
      <ToolShell toolId="edit-metadata" subtitle={t("subtitle")} related={["remove-metadata", "edit", "flatten-pdf"]}>
        <ToolMount component="EditMetadata" />
      </ToolShell>
    </>
  );
}
