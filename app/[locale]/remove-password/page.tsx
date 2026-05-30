import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { ToolShell } from "@/components/tools/ToolShell";
import { UnlockTool } from "@/components/tools/UnlockTool";

export const metadata: Metadata = {
  title: "Remove PDF Password — PlinyPDF",
  description: "Remove a password from a PDF you own, entirely in your browser.",
};

export default async function UnlockPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("ToolPages.unlock");
  return (
    <ToolShell toolId="unlock" subtitle={t("subtitle")} related={["protect", "merge", "compress"]}>
      <UnlockTool />
    </ToolShell>
  );
}
