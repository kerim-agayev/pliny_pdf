import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { ToolShell } from "@/components/tools/ToolShell";
import { SplitTool } from "@/components/tools/SplitTool";

export const metadata: Metadata = {
  title: "Split PDF — PlinyPDF",
  description: "Extract a page range or split a PDF into separate files, in your browser.",
};

export default async function SplitPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("ToolPages.split");
  return (
    <ToolShell toolId="split" subtitle={t("subtitle")} related={["merge", "rotate", "compress"]}>
      <SplitTool />
    </ToolShell>
  );
}
