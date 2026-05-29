import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "tr", "ru"],
  defaultLocale: "en",
  localePrefix: "always",
});
