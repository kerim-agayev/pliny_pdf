"use client";

import { useEffect, useState } from "react";
import posthog from "posthog-js";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ANALYTICS_CONSENT_KEY } from "@/components/analytics/PostHogProvider";

/**
 * Lightweight, dismissible privacy notice (Wave 9I).
 *
 * Analytics are cookieless (see PostHogProvider) so no consent gate is required —
 * this is an honesty/transparency notice, not a GDPR cookie wall. It shows once on
 * first visit; "Got it" dismisses, "Opt out" stops PostHog capture for good.
 * State is persisted in localStorage; nothing renders until mounted to avoid a
 * hydration flash.
 */
export function PrivacyNotice() {
  const t = useTranslations("PrivacyNotice");
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem(ANALYTICS_CONSENT_KEY)) setShow(true);
  }, []);

  if (!show) return null;

  function dismiss() {
    localStorage.setItem(ANALYTICS_CONSENT_KEY, "dismissed");
    setShow(false);
  }

  function optOut() {
    localStorage.setItem(ANALYTICS_CONSENT_KEY, "opted-out");
    posthog.opt_out_capturing();
    setShow(false);
  }

  return (
    <div
      role="dialog"
      aria-label={t("body")}
      className="pp-card fixed bottom-4 left-4 z-[80] max-w-xs p-4 shadow-[var(--shadow-lg)]"
      style={{ animation: "rdFade 0.2s ease both" }}
    >
      <p className="text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>
        {t("body")}
      </p>
      <div className="mt-3 flex items-center gap-2">
        <button type="button" onClick={dismiss} className="pp-btn flex-1 justify-center">
          {t("gotIt")}
        </button>
        <button
          type="button"
          onClick={optOut}
          className="pp-btn pp-btn-ghost flex-1 justify-center"
        >
          {t("optOut")}
        </button>
      </div>
      <Link
        href="/privacy"
        className="mt-2 inline-block text-xs underline"
        style={{ color: "var(--text-3)" }}
        onClick={dismiss}
      >
        {t("privacyLink")}
      </Link>
    </div>
  );
}
