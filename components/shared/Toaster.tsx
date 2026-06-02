"use client";

import { useEffect, useState } from "react";
import { Toaster as SonnerToaster } from "sonner";
import { useTheme } from "./ThemeProvider";

/**
 * App-wide toast host. Mounted once in the locale layout.
 * - Follows the site theme (light/dark) via ThemeProvider.
 * - Bottom-center on mobile, top-right on desktop.
 * - Auto-dismiss 4s, at most 3 visible.
 * Tools import `{ toast }` from "sonner" directly to fire notifications.
 */
export function Toaster() {
  const { theme } = useTheme();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return (
    <SonnerToaster
      theme={theme}
      richColors
      closeButton
      duration={4000}
      visibleToasts={3}
      position={isMobile ? "bottom-center" : "top-right"}
      toastOptions={{
        style: {
          background: "var(--bg-2)",
          border: "1px solid var(--line)",
          color: "var(--text)",
          fontFamily: "var(--font-inter)",
        },
      }}
    />
  );
}
