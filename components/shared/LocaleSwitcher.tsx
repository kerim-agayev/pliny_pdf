"use client";

import { useLocale } from "next-intl";
import { useTransition } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

const labels: Record<(typeof routing.locales)[number], string> = {
  en: "EN",
  tr: "TR",
  ru: "RU",
};

export function LocaleSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const active = useLocale();
  const [isPending, startTransition] = useTransition();

  return (
    <div className="inline-flex items-center gap-1 rounded-md border border-border bg-card/40 p-0.5 font-mono text-xs">
      {routing.locales.map((locale) => {
        const isActive = locale === active;
        return (
          <button
            key={locale}
            type="button"
            disabled={isPending || isActive}
            onClick={() => {
              startTransition(() => {
                router.replace(pathname, { locale });
              });
            }}
            className={
              isActive
                ? "rounded-sm bg-brand px-2 py-1 text-primary-foreground"
                : "rounded-sm px-2 py-1 text-muted-foreground hover:text-foreground"
            }
          >
            {labels[locale]}
          </button>
        );
      })}
    </div>
  );
}
