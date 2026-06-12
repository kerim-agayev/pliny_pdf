"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { IconX } from "./icons";

/**
 * Mobile-only nav. Below `md` the Navbar hides its inline links; this hamburger
 * opens a dropdown sheet with the same primary links. Hidden at `md` and up.
 */
export function MobileNav() {
  const t = useTranslations("Nav");
  const [open, setOpen] = useState(false);

  const links = [
    { href: "/tools", label: t("tools") },
    { href: "/about", label: t("about") },
    { href: "/privacy", label: t("privacy") },
  ];

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label="Menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex size-9 items-center justify-center rounded-lg"
        style={{ color: "var(--text-2)", border: "1px solid var(--line)" }}
      >
        {open ? (
          <IconX size={18} />
        ) : (
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
            <path d="M3 6h18M3 12h18M3 18h18" />
          </svg>
        )}
      </button>

      {open && (
        <>
          {/* Backdrop closes the sheet */}
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40"
            style={{ background: "transparent" }}
          />
          <div
            className="absolute left-0 right-0 top-16 z-50 flex flex-col gap-1 px-5 py-3"
            style={{
              borderBottom: "1px solid var(--line)",
              background: "color-mix(in srgb, var(--bg) 96%, transparent)",
              backdropFilter: "blur(8px)",
            }}
          >
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="pp-nav-link py-2.5 text-[15px]"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
