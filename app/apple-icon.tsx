import { ImageResponse } from "next/og";

// Generated Apple touch icon (Wave 9I), 180×180 with a rounded-square inset so it
// reads well on an iOS home screen. Served at /apple-icon.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
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
          fontSize: 120,
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
