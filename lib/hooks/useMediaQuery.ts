"use client";

import { useEffect, useState } from "react";

/**
 * SSR-safe media-query subscription. Returns false during SSR / first paint, then
 * the real match after mount (so the desktop chrome renders first and the mobile
 * editor swaps in on a phone). Used to switch the Edit PDF editor between the
 * desktop top toolbar and the bottom-fixed MobileToolbar (Wave 8D).
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    setMatches(mql.matches);
    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}
