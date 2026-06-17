import { setRequestLocale, getTranslations } from "next-intl/server";
import { ToolShell } from "@/components/tools/ToolShell";
import { ToolMount } from "@/components/tools/ToolMount";
import { toolMetadata } from "@/lib/seo";
import { toolSchemas } from "@/lib/structured-data";
import { JsonLd } from "@/components/seo/JsonLd";

export const generateMetadata = toolMetadata("reverse-pages");

export default async function ReversePagesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("ToolPages.reversePages");
  return (
    <>
      <JsonLd data={toolSchemas("reverse-pages", locale)} />
      <ToolShell toolId="reversePages" subtitle={t("subtitle")} related={["organize-pages", "rotate", "split"]}>
        <ToolMount component="ReversePagesTool" />
      </ToolShell>
    </>
  );
}
