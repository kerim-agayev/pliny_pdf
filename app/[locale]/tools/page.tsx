import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { ToolsCatalog } from "@/components/marketing/ToolsCatalog";

export const metadata: Metadata = {
  title: "All PDF tools — PlinyPDF",
  description: "Every PlinyPDF tool. Local-first by default; cloud only where it materially helps.",
};

export default async function ToolsRoute({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string }>;
}) {
  const { locale } = await params;
  const { category } = await searchParams;
  setRequestLocale(locale);
  return <ToolsCatalog initialCategory={category} />;
}
