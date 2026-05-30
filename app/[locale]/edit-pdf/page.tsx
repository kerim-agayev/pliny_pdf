import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { ToolShell } from "@/components/tools/ToolShell";
import { EditorTool } from "@/components/tools/EditorTool";

export const metadata: Metadata = {
  title: "PDF Editor — PlinyPDF",
  description: "Annotate, highlight, draw and mark up PDFs in your browser. Nothing is uploaded.",
};

export default async function EditorPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("ToolPages.editor");
  return (
    <ToolShell toolId="edit" subtitle={t("subtitle")} fullWidth>
      <EditorTool />
    </ToolShell>
  );
}
