// Sentry init for the browser. Next.js 16 loads this in place of the legacy
// sentry.client.config.ts. No-op when NEXT_PUBLIC_SENTRY_DSN is unset, so local
// dev and the build stay clean until a DSN is provided in prod env.
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: !!dsn,
  tracesSampleRate: 0.1,
  // Privacy-first brand: keep session replay off.
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
