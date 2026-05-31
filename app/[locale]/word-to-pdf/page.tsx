import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { ToolShell } from "@/components/tools/ToolShell";
import { CloudConvertTool } from "@/components/tools/CloudConvertTool";

export const metadata: Metadata = {
  title: "Word to PDF — PlinyPDF",
  description:
    "Convert a Word document into a perfectly formatted PDF. Processed securely on our servers and deleted within 24 hours.",
};

export default async function WordToPdfPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("ToolPages.wordToPdf");
  return (
    <ToolShell toolId="word-to-pdf" subtitle={t("subtitle")} related={["pdf-to-word", "merge", "compress"]}>
      <CloudConvertTool
        namespace="ToolPages.wordToPdf"
        accept="word"
        endpoint="/api/convert/word-to-pdf"
        outExt=".pdf"
      />
    </ToolShell>
  );
}
