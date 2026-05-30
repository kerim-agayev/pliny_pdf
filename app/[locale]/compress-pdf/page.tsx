import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { ToolShell } from "@/components/tools/ToolShell";
import { CompressTool } from "@/components/tools/CompressTool";

export const metadata: Metadata = {
  title: "Compress PDF — PlinyPDF",
  description: "Shrink your PDF with three quality presets, entirely in your browser.",
};

export default async function CompressPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("ToolPages.compress");
  return (
    <ToolShell toolId="compress" subtitle={t("subtitle")} related={["merge", "split", "rotate"]}>
      <CompressTool />
    </ToolShell>
  );
}
