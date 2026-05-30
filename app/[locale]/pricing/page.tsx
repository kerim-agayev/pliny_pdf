import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { PricingClient } from "@/components/marketing/PricingClient";

export const metadata: Metadata = {
  title: "Pricing — PlinyPDF",
  description: "Free is generous. Pro is cheap. Cancel anytime, VAT-compliant invoices via Paddle.",
};

export default async function PricingRoute({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <PricingClient />;
}
