# Wave 3E — Blog swap

## Sub-tasks
- [x] Deleted `content/blog/best-ilovepdf-alternatives-2026.md` (`git rm`).
- [x] Wrote `content/blog/how-plinypdf-protects-your-privacy.md` (965 words). Frontmatter matches
  the existing shape (title/date/excerpt/readingTime/slug); date 2026-06-02.
  H2 sections: problem with online PDF tools · how browser-side processing works · verify it
  yourself (DevTools Network test) · what about cloud tools (24h delete, no training) · the
  privacy promise. Internal links: /merge-pdf, /compress-pdf, /summarize, /tools, /privacy, /about.
- [x] Blog index: no manual edit needed — `lib/blog.ts` `getAllPosts()` reads the dir and sorts
  newest-first; sitemap uses `getAllSlugs()`. Both auto-update.

## Convention note
Internal links are written WITHOUT a locale prefix (`/merge-pdf`); the blog post page applies
`localizeLinks(content, locale)` so each reader gets `/en|/tr|/ru` automatically. (This is why we
did NOT hardcode `/en/...` as the raw CLAUDE_3.md text suggested — that would break tr/ru readers.)

## Verification
- `bun run build` green; `/[locale]/blog/how-plinypdf-protects-your-privacy` prerendered; old post
  route dropped. No MISSING_MESSAGE.
- Curl: /en/blog shows the new title, not the old; old slug → HTTP 404; new post's internal links
  render as `/en/merge-pdf`, `/en/compress-pdf`, `/en/summarize`, `/en/privacy`, `/en/about`, `/en/tools`.

## Gate 3E
/en/blog (and /tr, /ru) lists the new privacy post, old iLovePDF-alternatives post gone; the
DevTools-test section reads correctly; internal links work per locale.
