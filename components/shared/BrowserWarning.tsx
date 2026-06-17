"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

const DISMISS_KEY = "pp-browser-warning";

/**
 * Detects genuinely outdated browsers only — Internet Explorer (any version) and
 * Safari < 14 — and shows a one-time, dismissible banner (Wave 9I). Modern
 * Chrome/Firefox/Edge/Safari must never see this. Detection runs client-side so the
 * UA string is the real browser, not the SSR runtime.
 */
function isOutdated(ua: string): boolean {
  // Internet Explorer: "MSIE" (≤10) or "Trident" (11).
  if (/MSIE |Trident\//.test(ua)) return true;

  // Safari < 14. Exclude Chrome/Chromium/Android (they also carry "Safari" in UA).
  const isSafari = /Safari\//.test(ua) && !/Chrome|Chromium|Android|CriOS|FxiOS|Edg\//.test(ua);
  if (isSafari) {
    const m = ua.match(/Version\/(\d+)/);
    if (m && Number(m[1]) < 14) return true;
  }
  return false;
}

export function BrowserWarning() {
  const t = useTranslations("BrowserWarning");
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof navigator === "undefined") return;
    if (localStorage.getItem(DISMISS_KEY)) return;
    if (isOutdated(navigator.userAgent)) setShow(true);
  }, []);

  if (!show) return null;

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setShow(false);
  }

  return (
    <div
      role="alert"
      className="flex w-full items-center justify-center gap-3 px-4 py-2 text-center text-sm font-medium text-white"
      style={{ background: "var(--rose)" }}
    >
      <span>{t("message")}</span>
      <button
        type="button"
        onClick={dismiss}
        aria-label={t("dismiss")}
        className="shrink-0 rounded px-2 py-0.5 underline"
      >
        {t("dismiss")}
      </button>
    </div>
  );
}
