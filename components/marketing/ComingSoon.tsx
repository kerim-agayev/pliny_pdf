import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { IconArrow } from "@/components/shared/icons";

export function ComingSoon({ title }: { title: string }) {
  const t = useTranslations("ComingSoon");
  return (
    <section className="mx-auto flex max-w-xl flex-col items-center gap-5 px-6 py-32 text-center">
      <span className="pp-badge pro" style={{ padding: "5px 12px" }}>{t("badge")}</span>
      <h1 className="text-[clamp(32px,5vw,44px)] tracking-[-0.03em]">{title}</h1>
      <p className="max-w-md text-[16px]" style={{ color: "var(--text-2)" }}>{t("body")}</p>
      <Link href="/" className="pp-btn pp-btn-lg">
        {t("back")} <IconArrow size={15} />
      </Link>
    </section>
  );
}
