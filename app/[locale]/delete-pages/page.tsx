import { setRequestLocale, getTranslations } from "next-intl/server";
import { ToolShell } from "@/components/tools/ToolShell";
import { DeletePages } from "@/components/tools/DeletePages";
import { toolMetadata } from "@/lib/seo";
import { toolSchemas } from "@/lib/structured-data";
import { JsonLd } from "@/components/seo/JsonLd";

export const generateMetadata = toolMetadata("delete-pages");

export default async function DeletePagesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("ToolPages.deletePages");
  return (
    <>
      <JsonLd data={toolSchemas("delete-pages")} />
      <ToolShell toolId="delete-pages" subtitle={t("subtitle")} related={["extract-pages", "split", "rotate"]}>
        <DeletePages />
      </ToolShell>
    </>
  );
}
