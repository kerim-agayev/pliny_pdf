import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { ToolsCatalog } from "@/components/marketing/ToolsCatalog";

export const metadata: Metadata = {
  title: "All PDF tools — PlinyPDF",
  description: "Every PlinyPDF tool. Local-first by default; cloud only where it materially helps.",
};

export default async function ToolsRoute({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ToolsCatalog />;
}
