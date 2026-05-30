import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { ToolShell } from "@/components/tools/ToolShell";
import { PdfToJpgTool } from "@/components/tools/PdfToJpgTool";

export const metadata: Metadata = {
  title: "PDF to JPG — PlinyPDF",
  description: "Convert each PDF page to a JPG image, in your browser.",
};

export default async function PdfToJpgPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("ToolPages.pdfToJpg");
  return (
    <ToolShell toolId="pdf-to-jpg" subtitle={t("subtitle")} related={["jpg-to-pdf", "compress", "split"]}>
      <PdfToJpgTool />
    </ToolShell>
  );
}
