import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { ToolShell } from "@/components/tools/ToolShell";
import { SummarizeTool } from "@/components/tools/SummarizeTool";

export const metadata: Metadata = {
  title: "AI PDF Summary — PlinyPDF",
  description:
    "Summarize any PDF with AI — executive summary, outline, or per-section. Text is sent for summarization only and never stored.",
};

export default async function SummarizePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("ToolPages.summarize");
  return (
    <ToolShell toolId="summarize" subtitle={t("subtitle")} related={["pdf-to-word", "compress", "merge"]}>
      <SummarizeTool />
    </ToolShell>
  );
}
