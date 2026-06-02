import { setRequestLocale, getTranslations } from "next-intl/server";
import { ToolShell } from "@/components/tools/ToolShell";
import { ToolMount } from "@/components/tools/ToolMount";
import { toolMetadata } from "@/lib/seo";
import { toolSchemas } from "@/lib/structured-data";
import { JsonLd } from "@/components/seo/JsonLd";

export const generateMetadata = toolMetadata("pdf-to-word");

export default async function PdfToWordPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("ToolPages.pdfToWord");
  return (
    <>
      <JsonLd data={toolSchemas("pdf-to-word")} />
      <ToolShell toolId="pdf-to-word" subtitle={t("subtitle")} related={["word-to-pdf", "merge", "compress"]}>
        <ToolMount
          component="CloudConvertTool"
          props={{
            namespace: "ToolPages.pdfToWord",
            accept: "pdf",
            endpoint: "/api/convert/pdf-to-word",
            outExt: ".docx",
          }}
        />
      </ToolShell>
    </>
  );
}
