import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

// Catch-all for unknown localized paths (Wave 9I). Sets the request locale so the
// branded not-found.tsx can translate, then triggers the 404.
export default async function CatchAll({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  notFound();
}
