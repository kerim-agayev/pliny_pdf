import { setRequestLocale, getTranslations } from "next-intl/server";
import { ToolShell } from "@/components/tools/ToolShell";
import { ProtectTool } from "@/components/tools/ProtectTool";
import { toolMetadata } from "@/lib/seo";
import { toolSchemas } from "@/lib/structured-data";
import { JsonLd } from "@/components/seo/JsonLd";

export const generateMetadata = toolMetadata("password-protect");

export default async function ProtectPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("ToolPages.protect");
  return (
    <>
      <JsonLd data={toolSchemas("password-protect")} />
      <ToolShell toolId="protect" subtitle={t("subtitle")} related={["unlock", "merge", "compress"]}>
        <ProtectTool />
      </ToolShell>
    </>
  );
}
