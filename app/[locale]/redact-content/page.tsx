import { setRequestLocale, getTranslations } from "next-intl/server";
import { ToolShell } from "@/components/tools/ToolShell";
import { RedactContent } from "@/components/tools/RedactContent";
import { toolMetadata } from "@/lib/seo";
import { toolSchemas } from "@/lib/structured-data";
import { JsonLd } from "@/components/seo/JsonLd";

export const generateMetadata = toolMetadata("redact-content");

export default async function RedactContentPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("ToolPages.redactContent");
  return (
    <>
      <JsonLd data={toolSchemas("redact-content")} />
      <ToolShell toolId="redact-content" subtitle={t("subtitle")} related={["edit", "sign-pdf", "protect"]} fullWidth>
        <RedactContent />
      </ToolShell>
    </>
  );
}
