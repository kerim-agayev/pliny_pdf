import { setRequestLocale, getTranslations } from "next-intl/server";
import { ToolShell } from "@/components/tools/ToolShell";
import { TextToPdf } from "@/components/tools/TextToPdf";
import { toolMetadata } from "@/lib/seo";
import { toolSchemas } from "@/lib/structured-data";
import { JsonLd } from "@/components/seo/JsonLd";

export const generateMetadata = toolMetadata("text-to-pdf");

export default async function TextToPdfPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("ToolPages.textToPdf");
  return (
    <>
      <JsonLd data={toolSchemas("text-to-pdf")} />
      <ToolShell toolId="text-to-pdf" subtitle={t("subtitle")} related={["markdown-to-pdf", "jpg-to-pdf", "word-to-pdf"]}>
        <TextToPdf />
      </ToolShell>
    </>
  );
}
