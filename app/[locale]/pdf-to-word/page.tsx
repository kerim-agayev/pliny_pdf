import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { ToolShell } from "@/components/tools/ToolShell";
import { CloudConvertTool } from "@/components/tools/CloudConvertTool";

export const metadata: Metadata = {
  title: "PDF to Word — PlinyPDF",
  description:
    "Convert a PDF into an editable Word document. Processed securely on our servers and deleted within 24 hours.",
};

export default async function PdfToWordPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("ToolPages.pdfToWord");
  return (
    <ToolShell toolId="pdf-to-word" subtitle={t("subtitle")} related={["word-to-pdf", "compress", "merge"]}>
      <CloudConvertTool
        namespace="ToolPages.pdfToWord"
        accept="pdf"
        endpoint="/api/convert/pdf-to-word"
        outExt=".docx"
      />
    </ToolShell>
  );
}
