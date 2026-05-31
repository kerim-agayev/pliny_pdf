import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { LegalShell, LegalSection } from "@/components/marketing/LegalShell";

export const metadata: Metadata = {
  title: "Privacy Policy — PlinyPDF",
  description:
    "How PlinyPDF handles your data: GDPR & KVKK compliant, no tracking, local processing for most tools, files deleted within 24 hours for cloud tools.",
};

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Privacy");

  return (
    <LegalShell title={t("title")} lastUpdated={t("lastUpdated")} intro={t("intro")}>
      <LegalSection heading={t("h.collect")}>
        <p>We collect the minimum needed to run the service:</p>
        <ul className="ml-5 list-disc space-y-1.5">
          <li>
            <strong>Email address</strong> — only if you create an account, used for sign-in and
            account-related email.
          </li>
          <li>
            <strong>Payment data</strong> — handled entirely by Lemonsqueezy as Merchant of Record.
            We never see or store your card details.
          </li>
          <li>
            <strong>File metadata for cloud tools</strong> — filename, size, and timestamp of
            conversions you run while signed in. The file <em>contents</em> are deleted within 24
            hours; the metadata row is kept 7 days (Free) or 30 days (Pro), then purged.
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading={t("h.dontCollect")}>
        <ul className="ml-5 list-disc space-y-1.5">
          <li>
            The contents of files you process with <strong>local tools</strong> — they never leave
            your browser, so we couldn&apos;t collect them if we wanted to.
          </li>
          <li>Advertising or cross-site tracking cookies.</li>
          <li>Third-party ad-network identifiers. We run no ads.</li>
        </ul>
      </LegalSection>

      <LegalSection heading={t("h.thirdParties")}>
        <p>We rely on a small number of processors, each for one job:</p>
        <ul className="ml-5 list-disc space-y-1.5">
          <li>
            <strong>Supabase</strong> (EU region) — database for accounts and subscriptions.
          </li>
          <li>
            <strong>Cloudflare R2</strong> — temporary storage for cloud-tool files, deleted within
            24 hours.
          </li>
          <li>
            <strong>Google</strong> — only if you choose &ldquo;Sign in with Google&rdquo; (OAuth).
          </li>
          <li>
            <strong>Lemonsqueezy</strong> — payment processor and Merchant of Record; handles all
            billing and VAT.
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading={t("h.cookies")}>
        <p>
          One cookie: the authentication session cookie, set only when you sign in. No analytics or
          advertising cookies.
        </p>
      </LegalSection>

      <LegalSection heading={t("h.retention")}>
        <p>
          Cloud-tool files: deleted within 24 hours. File-history metadata: 7 days (Free) / 30 days
          (Pro). Account data: kept until you ask us to delete it.
        </p>
      </LegalSection>

      <LegalSection heading={t("h.rights")}>
        <p>
          Under the GDPR (EU) and KVKK (Türkiye) you have the right to access, correct, export, and
          erase your personal data, and to withdraw consent at any time. To exercise any of these,
          email{" "}
          <a href="mailto:privacy@plinypdf.com" className="underline hover:text-[var(--text)]">
            privacy@plinypdf.com
          </a>{" "}
          and we&apos;ll respond within 30 days.
        </p>
      </LegalSection>

      <LegalSection heading={t("h.contact")}>
        <p>
          Questions about this policy? Email{" "}
          <a href="mailto:privacy@plinypdf.com" className="underline hover:text-[var(--text)]">
            privacy@plinypdf.com
          </a>
          .
        </p>
      </LegalSection>
    </LegalShell>
  );
}
