# CLAUDE_10.md — PlinyPDF Phase 10: Launch Polish + Bug Fixes

> Read this file first at the start of every Phase 10 session.
> Phase 1-9 docs are READ-ONLY.
> All Phase 10 memory lives under `docs/phase_10/`.

---

## 1. What this phase does

Phase 10 fixes remaining bugs, removes broken tools, updates
UI copy, and prepares the site for public launch. No new tools.

After Phase 10 the site is launch-ready for ProductHunt/HN/Reddit.

---

## 2. Issues to Fix (User-Reported)

### Issue 1 — Remove Compress PDF (33→32 tools)
**Problem:** Compress PDF doesn't work correctly. Has been
rewritten multiple times but still fails.

**Action:**
- `lib/tools.ts`: set Compress PDF `available: false`
- Update all "33 PDF tools" → "32 PDF tools" across:
  - Homepage hero text (EN/TR/RU)
  - `deploy/LAUNCH.md`
  - Any marketing copy mentioning tool count
- Remove `/en/landing/compress-pdf-online-free` landing page
  - Delete from `lib/landing.ts`
  - Route will 404 naturally
  - Remove from sitemap
- Replace compress blog post with new topic (see Issue 8)
- Keep backend code (server/routes/tools.ts compress route)
  → just hide from UI like AI Summary

### Issue 2 — PDF→Word 500 Error on Slide Deck PDFs
**Problem:** PDF to Word works on normal PDFs but gives
500 Internal Server Error on some Notebook/slide deck PDFs.

**Error:**
```
POST https://api.plinypdf.com/api/convert/pdf-to-word 500
```

**Investigation needed (Hetzner backend):**
- Check server logs: `journalctl -u plinypdf-backend`
- What does Gotenberg/LibreOffice return for slide deck PDFs?
- Is it a timeout? Memory issue? Unsupported format?
- Specific slide deck PDFs fail — normal PDFs work fine

**Action:**
- SSH to Hetzner, test with the failing PDF
- Check if Gotenberg needs configuration for slide decks
- If unfixable: show a better error message to user
  ("This PDF format is not supported for conversion")
  instead of generic 500

### Issue 3 — /tools Category Tabs Mobile Kayma
**Problem:** On mobile, the category filter tabs
(All, Organize, Convert, Edit, Secure) overflow.
"Secure" text drops to the next line, looks broken.

**Action:**
- Reduce tab text size on mobile
- OR: make tabs horizontally scrollable
- OR: abbreviate on mobile (e.g. icons only)
- Fix in `components/marketing/ToolsCatalog.tsx`

### Issue 4 — Homepage v2.4 Badge Mobile Kayma
**Problem:** On mobile, the "v2.4 · 33 PDF tools — all free ·
No account needed" line has a dot that shifts up and the
"No account needed" text breaks badly.

**Action:**
- Remove the dot separator on mobile
- OR: put "No account needed" on a new line on mobile
- OR: remove "No account needed" entirely on mobile
  (keep on desktop)
- Fix in homepage hero section (`app/[locale]/page.tsx`
  or the marketing component)
- Update 33 → 32 here too (Issue 1)

### Issue 5 — PDF→JPG Font Rendering (Block Characters)
**Problem:** Some PDFs render as block characters (█████)
when converted to JPG. Structure (tables, layout, logo)
is preserved but all text becomes unreadable squares.

**Root cause:** PDF has fonts that are either:
- Not embedded in the PDF
- Using CID/identity encoding PyMuPDF can't resolve
- PyMuPDF `page.get_pixmap()` can't render these fonts

**Test PDF:** `IMG-20260606-WA0000.jpg` shows the issue
(SlicedInvoices sample PDF).

**Investigation needed:**
- Get the actual PDF file that produced this output
- Test with PyMuPDF locally:
  ```python
  import pymupdf
  doc = pymupdf.open("test.pdf")
  page = doc[0]
  # Check fonts used
  fonts = page.get_fonts()
  print(fonts)
  # Try rendering with different settings
  pix = page.get_pixmap(dpi=150)
  pix.save("test.jpg")
  ```
- If fonts are not embedded: try font substitution
- If CID encoding: try `page.get_pixmap(alpha=False)` 
  or other PyMuPDF flags

**Action:**
- Fix font rendering in `server/services/pdf-tools.py`
  `pdf_to_jpg` function
- If unfixable for all PDFs: show warning for problematic ones

### Issue 6 — Merge PDF Preview Shows "Local" Instead of "Cloud"
**Problem:** Merge PDF tool preview card on homepage shows
"Local · Processed in your browser" badge, but Merge is
actually a CLOUD tool (processed on server).

**Action:**
- Fix the badge/label in the homepage preview section
- Should show "Cloud" badge + correct description
  (e.g. "Processed securely on our server · Deleted within 24h")
- Check: is this a data issue in lib/tools.ts (mode: "local"
  vs "cloud") or a rendering issue in the homepage component?

### Issue 7 — "Why PlinyPDF" Section: Replace AI Summary Text
**Problem:** Homepage "Why PlinyPDF" section still mentions
"AI-powered summaries" with "Drop a 200-page report..." copy.
AI Summary has been removed from UI.

**Action:**
- Replace the AI Summary card with a new feature highlight
- Suggested replacement options:
  A) "Edit PDF — Full editor" — Edit text, add images,
     stamps, links, whiteout, annotations, all in-browser
  B) "33 Free Tools" — Split, merge, rotate, sign, watermark,
     OCR — every tool free, no account needed
  C) "Works Offline" — Local tools work without internet.
     Your files never leave your device
- Update in EN/TR/RU (3 locales)
- Fix in the homepage marketing component

### Issue 8 — Replace Compress PDF Blog Post
**Problem:** Blog has a post about PDF compression
("how-to-compress-pdf-without-losing-quality"). Since
Compress PDF is being removed, this post should be
replaced with a different topic.

**Action:**
- Delete or rename the compress blog post in `content/blog/`
- Write a new blog post — suggested topics:
  A) "How to Edit PDF Files Online for Free"
  B) "How to Sign PDF Documents Digitally"
  C) "Best Free PDF Merger — Combine PDFs Online"
- Update sitemap if blog slug changes
- EN content (blog is EN-primary)

### Issue 9 — Lighthouse Final Check
**Action:**
- After all fixes, run Lighthouse on:
  - Homepage
  - /tools
  - /edit-pdf
- Confirm scores haven't regressed:
  - Performance ≥ 90
  - Accessibility ≥ 95
  - Best Practices ≥ 100
  - SEO ≥ 100

---

## 3. Waves

### Wave 10A — Compress PDF Removal + Count Update
1. `lib/tools.ts`: Compress PDF → `available: false`
2. All "33" → "32" in hero text (EN/TR/RU), LAUNCH.md
3. Remove compress landing page from `lib/landing.ts`
4. Homepage "Why PlinyPDF" → replace AI Summary card (Issue 7)
5. Homepage v2.4 badge mobile fix (Issue 4)
6. Homepage Merge preview "local" → "cloud" fix (Issue 6)
7. i18n updates EN/TR/RU

**GATE 10A:**
- Compress PDF not visible in /tools
- Tool count = 32 everywhere
- Landing page removed
- Homepage mobile badge clean
- AI Summary card replaced
- Merge shows "Cloud"
- `bun run build` green

### Wave 10B — UI Fixes
1. /tools category tabs mobile fix (Issue 3)
2. Blog: replace compress post with new topic (Issue 8)
3. Any remaining UI polish from testing

**GATE 10B:**
- Tabs don't overflow on mobile
- New blog post live
- `bun run build` green

### Wave 10C — Backend Bug Fixes
1. PDF→Word slide deck 500 error (Issue 2)
2. PDF→JPG font rendering blocks (Issue 5)
3. Both need Hetzner investigation + deploy

**GATE 10C:**
- PDF→Word: slide deck PDF converts or shows friendly error
- PDF→JPG: test PDF renders text correctly
- `bun run build` green
- Hetzner deployed

### Wave 10D — Lighthouse + Final QA
1. Lighthouse on 3 key pages
2. Fix any regressions
3. Final QA pass
4. Phase 10 docs complete

**GATE 10D:**
- Lighthouse scores maintained or improved
- All issues from Phase 10 verified fixed
- Phase 10 docs complete
- Site is launch-ready

---

## 4. Phase 10 memory — `docs/phase_10/`

Phase 1-9 docs are READ-ONLY. Create:

```
docs/phase_10/
  index.md
  decisions.md
  bugs.md
  log.md
  waves/
    wave_10a.md
    wave_10b.md
    wave_10c.md
    wave_10d.md
```

---

## 5. Constraints

- Do NOT touch Phase 1-9 docs
- Do NOT add new tools
- Do NOT touch Edit PDF tool logic (Phase 6+8 complete)
- All UI text in EN/TR/RU
- `bun run build` green after each sub-task
- Do NOT commit until gate confirmed by user
- Hetzner deploy only in Wave 10C (backend fixes)
- Keep removed tools' code intact (available: false)

---

## 6. Out of scope (future)

- ProductHunt / HN / Reddit launch (after Phase 10)
- Help/FAQ page
- Demo video
- Onboarding tour
- Social proof statistics
- Feedback widget
- Status page
- Re-enabling Compress PDF (needs full rewrite)
- Re-enabling AI Summary

---

## 7. Session bootstrap

1. Read this file (`CLAUDE_10.md`)
2. Read `docs/phase_10/index.md` — if doesn't exist, create tree
3. Resume at current wave's next un-done task
4. Backend fixes only in Wave 10C — Hetzner deploy needed there

---

## 8. Known good baseline (Phase 9 ended here)

- 33 tools (25 local + 8 cloud), 2-tier (anon + free)
- Lighthouse: P:91-97, A:96-100, BP:100, SEO:100
- Mobile: full-screen takeover on Edit PDF, Annotate,
  Sign PDF, Organize, Crop, Redact + 4 form tools
- 23 simple tools CSS responsive
- 12 EN landing pages
- 5 blog posts
- PWA manifest + icons
- Cookieless PostHog + privacy notice
- Branded 404, error UI, offline indicator
- LimitBadge on all tools
- BreadcrumbList + Organization schema

After Phase 10: 32 tools, all bugs fixed, launch-ready.
