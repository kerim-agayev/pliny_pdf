import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
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
    path: "/about",
    title: "About — PlinyPDF",
    description:
      "Why PlinyPDF exists: a privacy-first PDF toolkit that processes your files in the browser. Named after Pliny the Elder.",
  });
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("About");

  return (
    <LegalShell title={t("title")} intro={t("intro")}>
      <LegalSection heading={t("h.story")}>
        <p>
          PlinyPDF is named after Pliny the Elder (23–79 CE), the Roman scholar whose{" "}
          <em>Naturalis Historia</em> tried to organize all of human knowledge into a single,
          accessible work. We took that spirit — organize, make useful, respect the reader — and
          pointed it at the most boring, universal document format on earth: the PDF.
        </p>
      </LegalSection>

      <LegalSection heading={t("h.mission")}>
        <p>
          We built PlinyPDF because every other online PDF tool uploads your files to a server you
          don&apos;t control. Your contracts, medical records, and financial statements get copied
          to someone else&apos;s machine just to rotate a page. We think that&apos;s wrong. Your
          files are yours.
        </p>
        <p>So the rule is simple: do the work in your browser whenever it&apos;s technically possible.</p>
      </LegalSection>

      <LegalSection heading={t("h.howItWorks")}>
        <p>
          Ten of our thirteen tools run entirely in your browser using WebAssembly. Your file never
          touches our servers — there is no upload to intercept, log, or leak.
        </p>
        <p>
          You don&apos;t have to take our word for it. Open your browser&apos;s DevTools, switch to
          the Network tab, and{" "}
          <Link href="/merge-pdf" className="underline hover:text-[var(--text)]">
            merge a PDF
          </Link>
          . You&apos;ll see no upload traffic. That&apos;s the whole point.
        </p>
      </LegalSection>

      <LegalSection heading={t("h.cloudTools")}>
        <p>
          Three tools genuinely need a server: PDF → Word, Word → PDF, and AI Summary. Office
          conversion needs LibreOffice; summarization needs a language model. For these, your file is
          processed over an encrypted connection, deleted within 24 hours, and{" "}
          <strong>never used to train any model</strong>. They&apos;re clearly marked with a blue
          &ldquo;Cloud&rdquo; badge so you always know where your file is going.
        </p>
      </LegalSection>

      <LegalSection heading={t("h.stack")}>
        <p>
          Built with Next.js, pdf-lib, and pdfjs-dist compiled to WebAssembly. No ads, ever. No
          tracking pixels. No selling data. Read our{" "}
          <Link href="/privacy" className="underline hover:text-[var(--text)]">
            Privacy Policy
          </Link>{" "}
          for the specifics.
        </p>
      </LegalSection>
    </LegalShell>
  );
}
