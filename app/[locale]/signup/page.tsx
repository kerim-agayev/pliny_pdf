import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { AuthForm } from "@/components/auth/AuthForm";

export const metadata: Metadata = {
  title: "Create your account — PlinyPDF",
};

export default async function SignupPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <AuthForm mode="signup" />;
}
