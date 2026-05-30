import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { ToolShell } from "@/components/tools/ToolShell";
import { JpgToPdfTool } from "@/components/tools/JpgToPdfTool";

export const metadata: Metadata = {
  title: "JPG to PDF — PlinyPDF",
  description: "Combine JPG or PNG images into one PDF, in your browser.",
};

export default async function JpgToPdfPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("ToolPages.jpgToPdf");
  return (
    <ToolShell toolId="jpg-to-pdf" subtitle={t("subtitle")} related={["pdf-to-jpg", "merge", "compress"]}>
      <JpgToPdfTool />
    </ToolShell>
  );
}
