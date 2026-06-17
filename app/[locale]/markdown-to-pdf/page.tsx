import { setRequestLocale, getTranslations } from "next-intl/server";
import { ToolShell } from "@/components/tools/ToolShell";
import { ToolMount } from "@/components/tools/ToolMount";
import { toolMetadata } from "@/lib/seo";
import { toolSchemas } from "@/lib/structured-data";
import { JsonLd } from "@/components/seo/JsonLd";

export const generateMetadata = toolMetadata("markdown-to-pdf");

export default async function MarkdownToPdfPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("ToolPages.markdownToPdf");
  return (
    <>
      <JsonLd data={toolSchemas("markdown-to-pdf", locale)} />
      <ToolShell toolId="markdown-to-pdf" subtitle={t("subtitle")} related={["text-to-pdf", "word-to-pdf", "jpg-to-pdf"]} fullWidth>
        <ToolMount component="MarkdownToPdf" />
      </ToolShell>
    </>
  );
}
