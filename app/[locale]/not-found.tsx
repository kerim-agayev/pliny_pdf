import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ToolCard } from "@/components/shared/ToolCard";

// Branded localized 404 (Wave 9I). Rendered inside the locale layout, so it
// inherits the Navbar/Footer/providers. Shown for notFound() within localized
// routes (including the [...rest] catch-all for unknown paths).
const POPULAR = ["merge", "compress", "split", "edit-pdf", "rotate", "sign-pdf"];

export default async function NotFound() {
  const t = await getTranslations("NotFound");

  return (
    <section className="mx-auto w-full max-w-4xl px-4 py-20 text-center sm:py-28">
      <p className="pp-mono mb-4 text-sm" style={{ color: "var(--indigo)" }}>
        404
      </p>
      <h1 className="mb-3 text-[clamp(32px,5vw,48px)] tracking-[-0.03em]">{t("title")}</h1>
      <p className="mx-auto mb-8 max-w-md text-base" style={{ color: "var(--text-2)" }}>
        {t("body")}
      </p>
      <div className="mb-14 flex flex-wrap items-center justify-center gap-3">
        <Link href="/" className="pp-btn pp-btn-lg">
          {t("home")}
        </Link>
        <Link href="/tools" className="pp-btn pp-btn-ghost pp-btn-lg">
          {t("allTools")}
        </Link>
      </div>

      <p className="mb-5 text-sm font-medium" style={{ color: "var(--text-3)" }}>
        {t("popular")}
      </p>
      <div className="grid grid-cols-1 gap-4 text-left sm:grid-cols-2 lg:grid-cols-3">
        {POPULAR.map((id) => (
          <ToolCard key={id} toolId={id} dotted />
        ))}
      </div>
    </section>
  );
}
