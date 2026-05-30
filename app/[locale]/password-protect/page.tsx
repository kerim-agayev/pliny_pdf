import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { ToolShell } from "@/components/tools/ToolShell";
import { ProtectTool } from "@/components/tools/ProtectTool";

export const metadata: Metadata = {
  title: "Password Protect PDF — PlinyPDF",
  description: "Encrypt a PDF with a password, entirely in your browser.",
};

export default async function ProtectPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("ToolPages.protect");
  return (
    <ToolShell toolId="protect" subtitle={t("subtitle")} related={["unlock", "merge", "compress"]}>
      <ProtectTool />
    </ToolShell>
  );
}
