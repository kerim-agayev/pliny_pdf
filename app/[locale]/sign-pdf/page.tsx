import { setRequestLocale, getTranslations } from "next-intl/server";
import { ToolShell } from "@/components/tools/ToolShell";
import { ToolMount } from "@/components/tools/ToolMount";
import { toolMetadata } from "@/lib/seo";
import { toolSchemas } from "@/lib/structured-data";
import { JsonLd } from "@/components/seo/JsonLd";

export const generateMetadata = toolMetadata("sign-pdf");

export default async function SignPdfPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("ToolPages.signPdf");
  return (
    <>
      <JsonLd data={toolSchemas("sign-pdf")} />
      <ToolShell toolId="sign-pdf" subtitle={t("subtitle")} related={["edit", "header-footer", "protect"]} fullWidth>
        <ToolMount component="SignPdf" />
      </ToolShell>
    </>
  );
}
