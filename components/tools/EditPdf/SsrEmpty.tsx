"use client";

import { useState, useEffect } from "react";

/**
 * Server-renders the Edit PDF empty-state placeholder (for LCP), then drops it
 * after hydration so it doesn't double-render alongside the real client editor.
 * Both now live in normal document flow, so the global footer sits below them.
 */
export function SsrEmpty({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted ? null : <>{children}</>; // SSR paints it (LCP), drops after hydrate
}
