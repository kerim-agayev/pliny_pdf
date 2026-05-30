import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { ToolShell } from "@/components/tools/ToolShell";
import { RotateTool } from "@/components/tools/RotateTool";

export const metadata: Metadata = {
  title: "Rotate PDF — PlinyPDF",
  description: "Rotate PDF pages 90, 180 or 270 degrees, in your browser.",
};

export default async function RotatePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("ToolPages.rotate");
  return (
    <ToolShell toolId="rotate" subtitle={t("subtitle")} related={["merge", "split", "compress"]}>
      <RotateTool />
    </ToolShell>
  );
}
