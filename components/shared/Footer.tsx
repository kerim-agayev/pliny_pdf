import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function Footer() {
  const t = useTranslations("Footer");
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border/60 bg-background">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <p className="font-heading text-lg font-bold tracking-tight">
              PlinyPDF
            </p>
            <p className="mt-2 max-w-xs text-sm text-muted-foreground">
              {t("tagline")}
            </p>
          </div>
          <FooterColumn title={t("tools")}>
            <Link href="/tools" className="text-muted-foreground hover:text-foreground">
              {t("tools")}
            </Link>
          </FooterColumn>
          <FooterColumn title={t("company")}>
            <Link href="/about" className="text-muted-foreground hover:text-foreground">
              {t("about")}
            </Link>
            <Link href="/blog" className="text-muted-foreground hover:text-foreground">
              {t("blog")}
            </Link>
          </FooterColumn>
          <FooterColumn title={t("legal")}>
            <Link
              href="/privacy"
              className="text-muted-foreground hover:text-foreground"
            >
              {t("privacyPolicy")}
            </Link>
            <Link href="/terms" className="text-muted-foreground hover:text-foreground">
              {t("terms")}
            </Link>
          </FooterColumn>
        </div>
        <div className="mt-10 flex flex-col gap-2 border-t border-border/60 pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>{t("copyright", { year })}</span>
          <span className="font-mono">{t("homage")}</span>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-3 text-sm font-semibold">{title}</p>
      <div className="flex flex-col gap-2 text-sm">{children}</div>
    </div>
  );
}
