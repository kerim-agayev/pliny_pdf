import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { PlinyMark } from "./icons";
import { ThemeToggle } from "./ThemeToggle";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { NavAuth } from "./NavAuth";
import { MobileNav } from "./MobileNav";

export function Navbar() {
  const t = useTranslations("Nav");
  return (
    <header
      className="sticky top-0 z-40 backdrop-blur"
      style={{
        borderBottom: "1px solid var(--line)",
        background: "color-mix(in srgb, var(--bg) 78%, transparent)",
      }}
    >
      <nav className="mx-auto flex h-16 max-w-[1240px] items-center justify-between px-5 sm:px-10">
        <div className="flex items-center gap-9">
          <Link href="/" className="flex items-center gap-2.5">
            <PlinyMark size={28} color="var(--text)" />
            <span className="font-[family-name:var(--font-display)] text-[17.5px] font-bold tracking-tight">
              PlinyPDF
            </span>
          </Link>
          <div className="hidden items-center gap-1 md:flex">
            <Link href="/tools" className="pp-nav-link">{t("tools")}</Link>
            <Link href="/about" className="pp-nav-link">{t("about")}</Link>
            <Link href="/privacy" className="pp-nav-link">{t("privacy")}</Link>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <LocaleSwitcher />
          <NavAuth />
          <MobileNav />
        </div>
      </nav>
    </header>
  );
}
