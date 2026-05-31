"use client";

import posthog from "posthog-js";

/**
 * Thin typed wrappers over PostHog capture. Safe to call anywhere on the client —
 * if PostHog wasn't initialized (no key), these are no-ops. The active locale is
 * derived from the URL so tool components don't each need to thread it through.
 */
function capture(event: string, props?: Record<string, unknown>) {
  if (typeof window === "undefined" || !posthog.__loaded) return;
  posthog.capture(event, props);
}

function currentLocale(): string {
  if (typeof window === "undefined") return "en";
  const seg = window.location.pathname.split("/")[1];
  return ["en", "tr", "ru"].includes(seg) ? seg : "en";
}

export const analytics = {
  /** A tool produced a result. `ms` = processing time, when meaningful (cloud/AI/heavy). */
  toolUsed: (toolSlug: string, ms?: number) =>
    capture("tool_used", {
      tool_slug: toolSlug,
      locale: currentLocale(),
      ...(ms != null ? { processing_time_ms: Math.round(ms) } : {}),
    }),
  signupCompleted: (method: "email" | "google") => capture("signup_completed", { method }),
  upgradeClicked: (plan: "monthly" | "yearly") => capture("upgrade_clicked", { plan }),
  checkoutOpened: () => capture("checkout_opened"),
};
