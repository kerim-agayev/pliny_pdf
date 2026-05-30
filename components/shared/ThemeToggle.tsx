"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { IconSun, IconMoon } from "./icons";

const OPTIONS = [
  { k: "light", Icon: IconSun },
  { k: "dark", Icon: IconMoon },
] as const;

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const current = mounted ? resolvedTheme ?? "dark" : "dark";

  return (
    <div
      className="inline-flex items-center gap-0.5 rounded-full p-0.5"
      style={{ background: "var(--card)", border: "1px solid var(--line)" }}
      role="group"
      aria-label="Theme"
    >
      {OPTIONS.map(({ k, Icon }) => {
        const active = current === k;
        return (
          <button
            key={k}
            type="button"
            aria-label={`${k} theme`}
            aria-pressed={active}
            onClick={() => setTheme(k)}
            className="inline-flex size-[26px] items-center justify-center rounded-full transition-colors"
            style={{
              background: active
                ? k === "dark"
                  ? "rgba(255,255,255,0.08)"
                  : "rgba(107,92,231,0.14)"
                : "transparent",
              color: active ? "var(--text)" : "var(--text-3)",
            }}
          >
            <Icon size={13} sw={1.8} />
          </button>
        );
      })}
    </div>
  );
}
