import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { LegalShell, LegalSection } from "@/components/marketing/LegalShell";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata({
    locale,
    path: "/terms",
    title: "Terms of Service — PlinyPDF",
    description:
      "PlinyPDF Terms of Service: acceptable use, billing via Lemonsqueezy, 14-day money-back guarantee, and how local and cloud tools handle your files.",
  });
}

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Terms");

  return (
    <LegalShell title={t("title")} lastUpdated={t("lastUpdated")} intro={t("intro")}>
      <LegalSection heading={t("h.service")}>
        <p>
          PlinyPDF provides online tools for working with PDF files — merging, splitting,
          compressing, converting, annotating, and AI summarization. The service is offered as-is and
          may change as we add or improve tools.
        </p>
      </LegalSection>

      <LegalSection heading={t("h.account")}>
        <p>
          You may use all local tools without an account. If you create one, you are responsible for
          keeping your credentials secure and for activity under your account.
        </p>
      </LegalSection>

      <LegalSection heading={t("h.acceptableUse")}>
        <ul className="ml-5 list-disc space-y-1.5">
          <li>Don&apos;t use PlinyPDF to process illegal content.</li>
          <li>Respect copyright — only process files you have the right to.</li>
          <li>Don&apos;t abuse the free tier with automated or bulk scripting.</li>
        </ul>
      </LegalSection>

      <LegalSection heading={t("h.billing")}>
        <p>
          Pro subscriptions are billed through <strong>Lemonsqueezy</strong>, our Merchant of Record,
          which handles payment and VAT. We offer a <strong>14-day money-back guarantee</strong> — no
          questions asked. You can cancel anytime; your Pro access continues until the end of the
          current billing period. We don&apos;t do aggressive auto-renewal or win-back tactics.
        </p>
      </LegalSection>

      <LegalSection heading={t("h.processing")}>
        <p>
          <strong>Local tools</strong> run in your browser; we have zero access to those files.{" "}
          <strong>Cloud tools</strong> (PDF ↔ Word, AI Summary) are processed on our servers and
          deleted within 24 hours, and are never used to train any model.
        </p>
      </LegalSection>

      <LegalSection heading={t("h.liability")}>
        <p>
          The service is provided &ldquo;as is&rdquo; without warranties of any kind. To the maximum
          extent permitted by law, PlinyPDF is not liable for any indirect or consequential damages
          arising from use of the service. Always keep your own copy of important files.
        </p>
      </LegalSection>

      <LegalSection heading={t("h.law")}>
        <p>
          These terms are governed by applicable law in the operator&apos;s jurisdiction. Where local
          consumer-protection law grants you stronger rights, those rights prevail.
        </p>
      </LegalSection>

      <LegalSection heading={t("h.contact")}>
        <p>
          Questions about these terms? Email{" "}
          <a href="mailto:legal@plinypdf.com" className="underline hover:text-[var(--text)]">
            legal@plinypdf.com
          </a>
          .
        </p>
      </LegalSection>
    </LegalShell>
  );
}
