"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

/**
 * Top banner shown only while the browser is offline (Wave 9I). Most tools run
 * locally and keep working offline, but cloud tools and "Save" need a connection —
 * so we surface the state rather than letting actions silently fail.
 */
export function OfflineIndicator() {
  const t = useTranslations("OfflineIndicator");
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="w-full px-4 py-2 text-center text-sm font-medium text-white"
      style={{ background: "var(--amber)" }}
    >
      {t("message")}
    </div>
  );
}
