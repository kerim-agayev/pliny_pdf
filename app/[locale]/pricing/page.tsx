import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { PricingClient } from "@/components/marketing/PricingClient";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata({
    locale,
    path: "/pricing",
    title: "Pricing — PlinyPDF",
    description: "Free is generous. Pro is cheap. Cancel anytime, VAT-compliant invoices.",
  });
}

export default async function PricingRoute({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <PricingClient />;
}
