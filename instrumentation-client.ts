// Sentry init for the browser. Next.js 16 loads this in place of the legacy
// sentry.client.config.ts. No-op when NEXT_PUBLIC_SENTRY_DSN is unset, so local
// dev and the build stay clean until a DSN is provided in prod env.
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

// TEMPORARY DIAGNOSTIC — remove after confirming Sentry receives events.
// If this logs `false`, the DSN was not inlined at build time (Vercel build
// cache / env var added after the build) — redeploy WITHOUT build cache.
console.log("[sentry] client DSN present at build:", !!dsn);

Sentry.init({
  dsn,
  enabled: !!dsn,
  debug: true, // TEMPORARY: surface Sentry transport logs in the console.
  tracesSampleRate: 0.1,
  // Privacy-first brand: keep session replay off.
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,
});

// TEMPORARY DIAGNOSTIC — fires on every page load. If this appears in Sentry
// Issues, the DSN/transport/project path works end-to-end and the earlier
// failure was the test method (console-thrown errors don't hit window.onerror).
// Remove this block once confirmed.
if (dsn) {
  Sentry.captureMessage("Sentry test message (client init)", "error");
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
