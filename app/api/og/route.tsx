import { ImageResponse } from "next/og";

export const runtime = "nodejs";

/**
 * Dynamic Open Graph image (1200×630). Driven by `?title=&desc=`.
 * Brand background + title/description, matching the dark theme tokens.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = (searchParams.get("title") ?? "PlinyPDF").slice(0, 120);
  const desc = (searchParams.get("desc") ?? "Edit PDFs without uploading them.").slice(0, 200);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background: "#0F0F0F",
          backgroundImage:
            "radial-gradient(1000px 500px at 80% -10%, rgba(107,92,231,0.35), transparent)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "#6B5CE7",
              display: "flex",
            }}
          />
          <div style={{ color: "#fff", fontSize: 30, fontWeight: 700 }}>PlinyPDF</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              color: "#fff",
              fontSize: 64,
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
              display: "flex",
            }}
          >
            {title}
          </div>
          <div style={{ color: "#A1A1AA", fontSize: 30, lineHeight: 1.35, display: "flex" }}>
            {desc}
          </div>
        </div>

        <div style={{ color: "#6EE7B7", fontSize: 24, display: "flex", gap: 10 }}>
          Private by default · Processed in your browser
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
