import type { MetadataRoute } from "next";

/**
 * PWA web app manifest (Wave 9I). Served at /manifest.webmanifest.
 * Icons are generated dynamically by app/icon.tsx (any size) and app/apple-icon.tsx.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PlinyPDF — Edit PDFs without uploading them",
    short_name: "PlinyPDF",
    description:
      "Privacy-first online PDF toolkit. Files are processed in your browser whenever possible.",
    start_url: "/",
    display: "standalone",
    background_color: "#0F0F0F",
    theme_color: "#6B5CE7",
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
