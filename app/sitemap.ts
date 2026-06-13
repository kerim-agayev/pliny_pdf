import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { TOOLS } from "@/lib/tools";
import { getAllSlugs } from "@/lib/blog";
import { SITE_URL } from "@/lib/seo";

/**
 * Sitemap for every public route × 3 locales, with hreflang alternates so search
 * engines understand the locale variants. Tool routes come from TOOLS, blog from
 * the markdown folder — single source of truth, no manual list to drift.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  // Locale-prefixed paths (everything under [locale]).
  const staticPaths = ["", "/tools", "/about", "/privacy", "/terms", "/support", "/blog"];
  const toolPaths = TOOLS.filter((t) => t.available).map((t) => `/${t.slug}`);
  const blogPaths = getAllSlugs().map((slug) => `/blog/${slug}`);
  const allPaths = [...staticPaths, ...toolPaths, ...blogPaths];

  const entries: MetadataRoute.Sitemap = [];
  for (const path of allPaths) {
    const languages: Record<string, string> = {};
    for (const loc of routing.locales) {
      languages[loc] = `${SITE_URL}/${loc}${path}`;
    }
    for (const loc of routing.locales) {
      entries.push({
        url: `${SITE_URL}/${loc}${path}`,
        changeFrequency: path.startsWith("/blog/") ? "monthly" : "weekly",
        priority: path === "" ? 1 : path.startsWith("/blog") ? 0.6 : 0.8,
        alternates: { languages },
      });
    }
  }
  return entries;
}
