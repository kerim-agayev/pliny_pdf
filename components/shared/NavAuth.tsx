"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useSession, signOut } from "@/lib/auth/client";
import { IconArrow } from "./icons";

function initialsOf(name: string): string {
  const parts = name.split(/[\s@._-]+/).filter(Boolean);
  return (parts.slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "U").slice(0, 2);
}

/**
 * Auth-aware navbar slot. Logged out → Sign in + Start Free (same as before).
 * Logged in → avatar with a dropdown (identity, Dashboard, Sign out).
 * Renders the logged-out state during the initial session fetch to avoid a flash
 * and keep SSR/client hydration in sync.
 */
export function NavAuth() {
  const t = useTranslations("Nav");
  const { data: session } = useSession();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const user = session?.user;

  if (!user) {
    return (
      <>
        <Link href="/login" className="pp-nav-link hidden sm:inline-flex">
          {t("login")}
        </Link>
        <Link href="/signup" className="pp-btn" style={{ padding: "8px 14px" }}>
          {t("signup")} <IconArrow size={14} />
        </Link>
      </>
    );
  }

  const name = user.name || user.email || "";

  async function doSignOut() {
    setOpen(false);
    await signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex size-9 items-center justify-center rounded-full text-[13px] font-semibold transition-opacity hover:opacity-90"
        style={{
          background: "rgba(107,92,231,0.18)",
          border: "1px solid rgba(107,92,231,0.35)",
          color: "#BFB5FF",
        }}
        title={name}
      >
        {initialsOf(name)}
      </button>

      {open && (
        <div
          role="menu"
          className="pp-card absolute right-0 mt-2 w-56 overflow-hidden"
          style={{ padding: 6 }}
        >
          <div className="px-3 py-2.5">
            <div className="truncate text-[13.5px] font-medium" style={{ color: "var(--text)" }}>
              {user.name}
            </div>
            <div className="truncate text-[12px]" style={{ color: "var(--text-3)" }}>
              {user.email}
            </div>
          </div>
          <hr className="pp-hr" style={{ margin: "2px 0" }} />
          <Link
            href="/dashboard"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="pp-related block rounded-lg px-3 py-2 text-[13.5px]"
            style={{ color: "var(--text)" }}
          >
            {t("dashboard")}
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={doSignOut}
            className="pp-related block w-full rounded-lg px-3 py-2 text-left text-[13.5px]"
            style={{ color: "#FDA4AF" }}
          >
            {t("signout")}
          </button>
        </div>
      )}
    </div>
  );
}
