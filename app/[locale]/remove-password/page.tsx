import { setRequestLocale, getTranslations } from "next-intl/server";
import { ToolShell } from "@/components/tools/ToolShell";
import { UnlockTool } from "@/components/tools/UnlockTool";
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
        <UnlockTool />
      </ToolShell>
    </>
  );
}
