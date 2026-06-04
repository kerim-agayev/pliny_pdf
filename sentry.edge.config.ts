// Sentry init for the Next.js edge runtime (middleware, edge routes). Loaded via
// instrumentation.ts. No-op when SENTRY_DSN is unset.
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: !!dsn,
  tracesSampleRate: 0.1,
});
