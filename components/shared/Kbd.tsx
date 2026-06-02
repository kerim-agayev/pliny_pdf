"use client";

import { useEffect, useState } from "react";

/**
 * Returns a formatter for shortcut labels that adapts to the platform:
 * `⌘O` on macOS, `Ctrl+O` elsewhere. Resolved after mount (navigator is
 * client-only) — pair with `suppressHydrationWarning` on the rendered chip.
 */
export function useModKey(): (key: string) => string {
  const [mac, setMac] = useState(false);
  useEffect(() => {
    setMac(/Mac|iPhone|iPad|iPod/i.test(navigator.userAgent));
  }, []);
  return (key: string) => (mac ? `⌘${key}` : `Ctrl+${key}`);
}

/** Small keyboard-hint chip, e.g. `<Kbd>{mod("O")}</Kbd>`. */
export function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd
      className="pp-mono inline-flex items-center rounded-[5px] px-1.5 py-px text-[10.5px] font-medium leading-[1.5]"
      style={{ background: "rgba(127,127,127,0.08)", border: "1px solid var(--line-2)", color: "var(--text-3)" }}
      suppressHydrationWarning
    >
      {children}
    </kbd>
  );
}
