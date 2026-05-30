import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { ToolShell } from "@/components/tools/ToolShell";
import { WatermarkTool } from "@/components/tools/WatermarkTool";

export const metadata: Metadata = {
  title: "Add Watermark — PlinyPDF",
  description: "Stamp text on every page with a live preview, entirely in your browser.",
};

export default async function WatermarkPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("ToolPages.watermark");
  return (
    <ToolShell toolId="watermark" subtitle={t("subtitle")} fullWidth>
      <WatermarkTool />
    </ToolShell>
  );
}
