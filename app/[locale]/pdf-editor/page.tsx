import { setRequestLocale, getTranslations } from "next-intl/server";
import { ToolShell } from "@/components/tools/ToolShell";
import { ToolMount } from "@/components/tools/ToolMount";
import { toolMetadata } from "@/lib/seo";
import { toolSchemas } from "@/lib/structured-data";
import { JsonLd } from "@/components/seo/JsonLd";

export const generateMetadata = toolMetadata("pdf-editor");

export default async function AnnotateEditorPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("ToolPages.editor");
  return (
    <>
      <JsonLd data={toolSchemas("pdf-editor", locale)} />
      <ToolShell toolId="edit" subtitle={t("subtitle")} fullWidth>
        <ToolMount component="EditorTool" />
      </ToolShell>
    </>
  );
}
