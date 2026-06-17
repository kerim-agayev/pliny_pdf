"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { useTranslations } from "next-intl";

// Branded route-level error boundary (Wave 9I). Renders inside the locale layout
// (Navbar/Footer/providers present), reports to Sentry, and offers a retry.
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("ErrorPage");

  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <section className="mx-auto w-full max-w-2xl px-4 py-24 text-center sm:py-32">
      <h1 className="mb-3 text-[clamp(28px,4vw,40px)] tracking-[-0.03em]">{t("title")}</h1>
      <p className="mx-auto mb-8 max-w-md text-base" style={{ color: "var(--text-2)" }}>
        {t("body")}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button type="button" onClick={reset} className="pp-btn pp-btn-lg">
          {t("retry")}
        </button>
        <a href="/" className="pp-btn pp-btn-ghost pp-btn-lg" style={{ textDecoration: "none" }}>
          {t("home")}
        </a>
      </div>
    </section>
  );
}
