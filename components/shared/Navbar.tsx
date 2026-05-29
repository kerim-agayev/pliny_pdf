import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { LocaleSwitcher } from "./LocaleSwitcher";

export function Navbar() {
  const t = useTranslations("Nav");
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
      <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link
          href="/"
          className="font-heading text-lg font-bold tracking-tight"
        >
          PlinyPDF
        </Link>
        <div className="hidden items-center gap-6 text-sm text-muted-foreground sm:flex">
          <Link href="/tools" className="hover:text-foreground">
            {t("tools")}
          </Link>
          <Link href="/pricing" className="hover:text-foreground">
            {t("pricing")}
          </Link>
          <Link href="/privacy" className="hover:text-foreground">
            {t("privacy")}
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <LocaleSwitcher />
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link href="/login">{t("login")}</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/signup">{t("signup")}</Link>
          </Button>
        </div>
      </nav>
    </header>
  );
}
