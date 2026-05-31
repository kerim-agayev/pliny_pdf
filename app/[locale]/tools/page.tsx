import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { ToolsCatalog } from "@/components/marketing/ToolsCatalog";
import { pageMetadata } from "@/lib/seo";
import { softwareApplicationSchema } from "@/lib/structured-data";
import { JsonLd } from "@/components/seo/JsonLd";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata({
    locale,
    path: "/tools",
    title: "All PDF tools — PlinyPDF",
    description:
      "Every PlinyPDF tool. Local-first by default; cloud only where it materially helps.",
  });
}

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
  return (
    <>
      <JsonLd data={softwareApplicationSchema()} />
      <ToolsCatalog initialCategory={category} />
    </>
  );
}
