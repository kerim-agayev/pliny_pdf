import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { ToolShell } from "@/components/tools/ToolShell";
import { MergeTool } from "@/components/tools/MergeTool";

export const metadata: Metadata = {
  title: "Merge PDF — PlinyPDF",
  description: "Combine multiple PDFs into one, right in your browser. No upload, no limits.",
};

export default async function MergePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("ToolPages.merge");
  return (
    <ToolShell toolId="merge" subtitle={t("subtitle")} related={["split", "compress", "rotate"]}>
      <MergeTool />
    </ToolShell>
  );
}
