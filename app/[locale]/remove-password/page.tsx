import { setRequestLocale, getTranslations } from "next-intl/server";
import { ToolShell } from "@/components/tools/ToolShell";
import { ToolMount } from "@/components/tools/ToolMount";
import { toolMetadata } from "@/lib/seo";
import { toolSchemas } from "@/lib/structured-data";
import { JsonLd } from "@/components/seo/JsonLd";

export const generateMetadata = toolMetadata("remove-password");

export default async function UnlockPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("ToolPages.unlock");
  return (
    <>
      <JsonLd data={toolSchemas("remove-password")} />
      <ToolShell toolId="unlock" subtitle={t("subtitle")} related={["protect", "merge", "compress"]}>
        <ToolMount component="UnlockTool" />
      </ToolShell>
    </>
  );
}
