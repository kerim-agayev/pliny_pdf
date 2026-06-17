import "./globals.css";

/**
 * Root 404 fallback (Wave 9I) for paths that don't match the [locale] segment
 * (e.g. a bad URL with no locale prefix). There is no root layout, so this page
 * renders its own <html>/<body>. English-only and self-contained by design — the
 * branded, localized 404 lives in app/[locale]/not-found.tsx.
 */
export default function RootNotFound() {
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
        <p className="pp-mono" style={{ color: "var(--indigo)", fontSize: 14 }}>
          404
        </p>
        <h1 style={{ fontSize: 32, margin: 0 }}>Page not found</h1>
        <p style={{ color: "var(--text-2)", maxWidth: 420, margin: 0 }}>
          The page you&apos;re looking for doesn&apos;t exist or has moved.
        </p>
        <a href="/" className="pp-btn pp-btn-lg" style={{ textDecoration: "none" }}>
          Go to PlinyPDF
        </a>
      </body>
    </html>
  );
}
