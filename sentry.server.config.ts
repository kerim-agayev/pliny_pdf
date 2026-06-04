// Sentry init for the Next.js server runtime (Node). Loaded via instrumentation.ts.
// No-op when SENTRY_DSN is unset, so local dev and the build stay clean until a
// DSN is provided in prod env. Mirrors the PostHog provider's gated pattern.
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: !!dsn,
  tracesSampleRate: 0.1,
});
