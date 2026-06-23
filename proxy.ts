import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const handler = createMiddleware(routing);

export default function proxy(request: Parameters<typeof handler>[0]) {
  return handler(request);
}

export const config = {
  // Exclude the dynamic metadata icon routes (apple-icon, icon) too — they have no
  // dot, so without this the i18n middleware locale-prefixes them → /en/apple-icon 404.
  matcher: "/((?!api|trpc|_next|_vercel|apple-icon|icon|.*\\..*).*)",
};
