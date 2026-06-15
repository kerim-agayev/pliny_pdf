"use client";

import { useEffect, useState } from "react";

export interface DailyUsage {
  plan: "anon" | "free" | "pro";
  used: number;
  total: number | null;
  remaining: number | null;
}

/**
 * Fetches the visitor's remaining daily server-tool quota once, for the cloud-tool
 * LimitBadge (Phase 9 Wave 9A). Pass `enabled=false` for local tools to skip the
 * request. Fails silently → the badge just omits the daily line.
 */
export function useDailyUsage(enabled: boolean): DailyUsage | null {
  const [usage, setUsage] = useState<DailyUsage | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    fetch("/api/usage", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: DailyUsage | null) => {
        if (active && d) setUsage(d);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [enabled]);

  return usage;
}
