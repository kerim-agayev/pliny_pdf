"use client";

import { useEffect } from "react";
import posthog from "posthog-js";

/**
 * Initializes PostHog on the client. No-op when NEXT_PUBLIC_POSTHOG_KEY is unset,
 * so local dev and the build stay clean until a key is provided in prod env.
 * Slotted between ThemeProvider and NextIntlClientProvider in the locale layout.
 */
export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key || posthog.__loaded) return;
    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
      capture_pageview: true,
      capture_pageleave: true,
      // Privacy-first brand: don't autocapture every DOM interaction.
      autocapture: false,
      persistence: "localStorage+cookie",
      // Wave 9G: don't fetch surveys.js / dead-clicks-autocapture.js on every page.
      disable_surveys: true,
      capture_dead_clicks: false,
    });
  }, []);

  return children;
}
