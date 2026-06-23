import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Inter, JetBrains_Mono } from "next/font/google";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/shared/ThemeProvider";
import { PostHogProvider } from "@/components/analytics/PostHogProvider";
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import { Toaster } from "@/components/shared/Toaster";
import { PrivacyNotice } from "@/components/shared/PrivacyNotice";
import { OfflineIndicator } from "@/components/shared/OfflineIndicator";
import { BrowserWarning } from "@/components/shared/BrowserWarning";
import { routing } from "@/i18n/routing";
import { SITE_URL } from "@/lib/seo";
import { organizationSchema } from "@/lib/structured-data";
import { JsonLd } from "@/components/seo/JsonLd";
import "../globals.css";

const sans = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const body = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext", "cyrillic"],
  display: "swap",
});

const mono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "PlinyPDF — Edit PDFs without uploading them",
  description:
    "Privacy-first online PDF toolkit. Files are processed in your browser whenever possible.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "PlinyPDF", statusBarStyle: "black-translucent" },
  // Explicit absolute icon URLs (root app/icon.tsx + app/apple-icon.tsx). Without
  // these the apple-touch-icon href resolves relative to /[locale] → /en/apple-icon 404.
  icons: { icon: "/icon", apple: "/apple-icon" },
};

export const viewport: Viewport = {
  themeColor: "#6B5CE7",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${sans.variable} ${body.variable} ${mono.variable} dark h-full antialiased`}
    >
      <body
        suppressHydrationWarning
        className="min-h-full flex flex-col bg-background text-foreground"
      >
        <JsonLd data={organizationSchema()} />
        {/* Wave 9G: warm up analytics/error connections early to cut LCP delay. */}
        <link rel="preconnect" href="https://eu.i.posthog.com" />
        <link rel="preconnect" href="https://eu-assets.i.posthog.com" />
        <link rel="preconnect" href="https://o4511506695127040.ingest.de.sentry.io" />
        <ThemeProvider>
          <PostHogProvider>
            <NextIntlClientProvider>
              <TooltipProvider>
                <BrowserWarning />
                <OfflineIndicator />
                <Navbar />
                <main className="flex-1">{children}</main>
                <Footer />
                <Toaster />
                <PrivacyNotice />
              </TooltipProvider>
            </NextIntlClientProvider>
          </PostHogProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
