"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import "./globals.css";

/**
 * Top-level error boundary (Wave 9I) — catches errors thrown in the root/layout
 * itself, where the localized error.tsx can't render. Must supply its own
 * <html>/<body>. English-only; reports to Sentry.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en" className="dark">
      <body
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          padding: 24,
          textAlign: "center",
          background: "var(--bg)",
          color: "var(--text)",
        }}
      >
        <h1 style={{ fontSize: 32, margin: 0 }}>Something went wrong</h1>
        <p style={{ color: "var(--text-2)", maxWidth: 420, margin: 0 }}>
          An unexpected error occurred. Please try again.
        </p>
        <button type="button" onClick={reset} className="pp-btn pp-btn-lg">
          Try again
        </button>
      </body>
    </html>
  );
}
