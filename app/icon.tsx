import { ImageResponse } from "next/og";

// Generated app icon (Wave 9I) — PlinyPDF "P" mark on the indigo brand color.
// Matches the logo block in app/api/og/route.tsx. Served at /icon.
export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#6B5CE7",
          color: "#fff",
          fontSize: 340,
          fontWeight: 700,
          fontFamily: "sans-serif",
        }}
      >
        P
      </div>
    ),
    { ...size },
  );
}
