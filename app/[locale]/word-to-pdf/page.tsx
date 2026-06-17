import { setRequestLocale, getTranslations } from "next-intl/server";
import { ToolShell } from "@/components/tools/ToolShell";
import { ToolMount } from "@/components/tools/ToolMount";
import { toolMetadata } from "@/lib/seo";
import { toolSchemas } from "@/lib/structured-data";
import { JsonLd } from "@/components/seo/JsonLd";

export const generateMetadata = toolMetadata("word-to-pdf");

export default async function WordToPdfPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("ToolPages.wordToPdf");
  return (
    <>
      <JsonLd data={toolSchemas("word-to-pdf", locale)} />
      <ToolShell toolId="word-to-pdf" subtitle={t("subtitle")} related={["pdf-to-word", "merge", "compress"]}>
        <ToolMount
          component="CloudConvertTool"
          props={{
            namespace: "ToolPages.wordToPdf",
            accept: "word",
            endpoint: "/api/convert/word-to-pdf",
            outExt: ".pdf",
          }}
        />
      </ToolShell>
    </>
  );
}
