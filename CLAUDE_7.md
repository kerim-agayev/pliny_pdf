# CLAUDE_7.md — PlinyPDF Phase 7: Pro Removal, Limit Optimization & New Tools

> Read this file first at the start of every Phase 7 session.
> Phase 1-6 docs are READ-ONLY.
> All Phase 7 memory lives under `docs/phase_7/`.

---

## 1. What this phase does

Phase 7 is three things:

1. **Remove Pro tier** — UI only. Lemonsqueezy code stays (future use).
   Only Anon and Free tiers remain. Pricing page → About page.
2. **Optimize limits** — realistic MB + page limits so no tool exceeds
   30 seconds. All limits revised for 2-tier system (Anon/Free).
3. **5 new local tools** — replace AI Summary (removed from UI).
   Total tools: 29 - 1 (AI Summary) + 5 new = **33 tools**.
4. **AI Summary removed from UI** — code stays, just hidden.

---

## 2. Complete Limit Table — Phase 7 (FINAL)

### Local Tools — 25 tools (20 existing + 5 new)

All run in browser. No daily limit. No server upload.

| | Anonim | Free |
|---|---|---|
| Dosya boyutu | 10 MB | 25 MB |
| Sayfa sayısı | 30 | 100 |
| Günlük | ∞ | ∞ |
| Beklenen süre | <5 sn | <10 sn |

**Applies to (25 tools):**
Split, Rotate, Delete Pages, Extract Pages, Add Page Numbers,
Header & Footer, Crop, Organize Pages, Sign, Redact Content,
Remove Metadata, Edit Metadata, Flatten, Add Watermark,
Password Protect, Remove Password, Annotate PDF,
JPG to PDF*, Text to PDF**, Markdown to PDF**,
PDF to Text (NEW), N-up Layout (NEW), Repeat Pages (NEW),
Reverse Pages (NEW), PDF Booklet (NEW)

\* JPG to PDF: uses image count limit (anon 50 / free 100 images)
\*\* Text/Markdown to PDF: no PDF input — no file/page limit

**Special limits for new tools:**

| Tool | Special Limit | Anon | Free |
|---|---|---|---|
| **Repeat Pages** | Max output pages | 150 | 500 |
| **N-up Layout** | Max output pages | 100 | 300 |
| **PDF to Text** | Standard local | 30 pg | 100 pg |
| **Reverse Pages** | Standard local | 30 pg | 100 pg |
| **PDF Booklet** | Standard local | 30 pg | 100 pg |

### Cloud Tools — 8 tools (was 9, AI Summary removed from UI)

| Tool | Anon MB | Anon Pg | Anon Daily | Free MB | Free Pg | Free Daily |
|---|---|---|---|---|---|---|
| **Compress** | 20 | 50 | 3/day | 75 | 200 | 10/day |
| **Grayscale** | 20 | 50 | 3/day | 75 | 200 | 10/day |
| **PDF→JPG** | 20 | 15 | 3/day | 75 | 50 | 10/day |
| **Merge** | 20 | 100 | 3/day | 75 | 300 | 10/day |
| **PDF→Word** | 15 | 25 | 3/day | 50 | 75 | 10/day |
| **Word→PDF** | 15 | 25 | 3/day | 50 | 75 | 10/day |
| **OCR PDF** | 15 | 25 | 3/day | 50 | 75 | 10/day |
| **Edit PDF** | 10 | 15 | 3/day | 30 | 50 | 10/day |

Edit PDF additional: session timeout anon 15 min / free 30 min.

### Removed from UI
| Tool | Status |
|---|---|
| AI Summary | Code stays, UI hidden. checkAi limiter stays. |

---

## 3. Pro Tier Removal — UI Changes

### What stays (code, not visible):
- Lemonsqueezy integration code in lib/
- Pro plan type in lib/ratelimit.ts
- Pro values in lib/limits.ts (can stay as dead code)
- Better Auth pro plan field
- checkAi function (AI Summary code)

### What changes in UI:

**Navigation:**
- Header: `Tools | Pricing | Privacy` → `Tools | About | Privacy`
- Footer: remove "Pricing" link, add "About" link
- Route: `/pricing` page deleted or redirected to `/about`
- `/about` page already exists in footer — move to header too

**Homepage (`app/[locale]/page.tsx`):**
- Remove: "Pro unlocks server-side conversion and unlimited AI"
- Remove: "View pricing" CTA button
- New hero text (all 3 locales):
  EN: "33 PDF tools, all free. Edit, convert, sign — without
       leaving your browser."
  TR: "33 PDF aracı, hepsi ücretsiz. Düzenle, dönüştür, imzala —
       tarayıcınızdan ayrılmadan."
  RU: "33 инструмента для PDF, все бесплатно. Редактируйте,
       конвертируйте, подписывайте — прямо в браузере."
- Keep: "Start Free" button (→ /tools)
- Change: "View pricing" → "Explore Tools" (→ /tools)

**Privacy page:**
- Remove: "Lemonsqueezy — payment processor and Merchant of Record;
  handles all billing and VAT."
- Remove: "File metadata for cloud tools — filename, size, and
  timestamp of conversions you run while signed in. The file
  contents are deleted within 24 hours; the metadata row is kept
  7 days (Free) or 30 days (Pro), then purged."
- Change: "Data retention" section →
  "Cloud-tool files: deleted within 24 hours. Account data: kept
  until you ask us to delete it."
- All 3 locales (EN/TR/RU)

**Terms page:**
- Remove entire "Billing & refunds" section (Lemonsqueezy,
  14-day money-back, auto-renewal text)
- All 3 locales

**Support page:**
- Remove "Refunds" section (14-day money-back, order email,
  Lemonsqueezy order number)
- All 3 locales

**Dashboard:**
- Remove Pro badge
- Remove Pro-related labels/text
- Remove upgrade CTA buttons
- Tool limits show anon/free only

**lib/limits.ts:**
- Remove pro tier from all limit objects:
  LOCAL_MAX_MB: { anon: 10, free: 25 } (remove pro: 50)
  LOCAL_MAX_PAGES: { anon: 30, free: 100 } (remove pro: 300)
  CLOUD_MAX_MB: { anon: 20, free: 75 } (changed values)
  CLOUD_MAX_PAGES: { anon: 50, free: 200 } (changed values)
  etc.
- Keep Plan type = "free" | "pro" but pro paths return free values
  (so existing pro accounts get free limits — graceful degradation)

**lib/ratelimit.ts:**
- Daily: anon 3/day, free 10/day (was 15)
- Remove pro unlimited bypass? NO — keep it. If someone has a pro
  account from before, don't break them. Just make UI not sell it.

**deploy/LAUNCH.md:**
- Update tool count: 29 → 33
- Update cloud count: 9 → 8
- Update local count: 20 → 25

---

## 4. AI Summary — Remove from UI

- `lib/tools.ts`: set `available: false` or remove from TOOLS array
- Remove from `/tools` page rendering
- Remove AI Summary card from tools catalog
- Keep `server/routes/ai.ts` (code stays)
- Keep `checkAi` in ratelimit.ts
- Remove AI-related i18n keys from tools section (or leave, harmless)

---

## 5. New Tools (5 local tools)

Design handoff is ready. When starting each tool's wave,
ask the user for the Claude Design handoff link.

### Tool 30: PDF to Text
- Extract all text from PDF into .txt file
- Uses pdf.js text extraction (page.getTextContent)
- Options: page range, layout preservation
- Very fast: 100 pages <5 seconds
- Component: `components/tools/PdfToText.tsx`
- Lib: `lib/pdf/pdfToText.ts`

### Tool 31: N-up Layout (2/4/6/9 in 1)
- Place multiple pages on single sheet
- Uses pdf-lib: create new page, embed existing pages scaled
- Layout options: 2-up, 4-up, 6-up, 9-up
- Paper size: A4, Letter
- Orientation: Portrait/Landscape
- Component: `components/tools/NupLayout.tsx`
- Lib: `lib/pdf/nupLayout.ts`

### Tool 32: Repeat Pages
- Duplicate selected pages N times
- Uses pdf-lib: copyPages
- Options: page selection, repeat count (max anon 50 / free 200)
- Arrangement: sequential or interleaved
- Component: `components/tools/RepeatPages.tsx`
- Lib: `lib/pdf/repeatPages.ts`

### Tool 33: Reverse Pages
- Reverse page order (last→first)
- Uses pdf-lib: reorder pages
- Simplest tool — minimal UI
- Very fast: <3 seconds
- Component: `components/tools/ReversePages.tsx`
- Lib: `lib/pdf/reversePages.ts`

### Tool 34: PDF Booklet
- Reorder pages for booklet printing (saddle stitch)
- Uses pdf-lib: reorder + N-up (2 pages per sheet)
- Print instructions shown after generation
- Component: `components/tools/PdfBooklet.tsx`
- Lib: `lib/pdf/pdfBooklet.ts`

---

## 6. Waves

### Wave 7A — Pro Removal + Limit Revision

1. Update `lib/limits.ts` — new 2-tier limits (all values from §2)
2. Update `lib/ratelimit.ts` — daily 15→10 for free
3. Remove Pro from UI:
   - Header navigation
   - Homepage hero text
   - Privacy page cleanup
   - Terms page cleanup
   - Support page cleanup
   - Dashboard Pro badges
   - Pricing page → About in header
4. Remove AI Summary from tools UI
5. All changes in EN/TR/RU (3 locales)
6. `deploy/LAUNCH.md` — tool counts updated

GATE 7A: bun run build green, no Pro mentions in UI,
limits correct, AI Summary hidden, About in header.

### Wave 7B — PDF to Text + Reverse Pages

Build the 2 simplest new tools first.

1. PDF to Text — component, lib, route, i18n, SEO, tests
2. Reverse Pages — component, lib, route, i18n, SEO, tests
3. Add to `lib/tools.ts`, `lib/seo.ts`, `lib/structured-data.ts`
4. Add to `messages/{en,tr,ru}.json`

Before starting: ask user for Claude Design handoff link.
Fetch and save design screens.

GATE 7B: both tools work, correct limits, build green.

### Wave 7C — N-up Layout

1. N-up Layout — component, lib, route, i18n, SEO
2. Layout options: 2-up, 4-up (at minimum)
3. Paper size + orientation
4. Live preview

Before starting: use design handoff from 7B (same link).

GATE 7C: N-up works with 2-up and 4-up, correct PDF output.

### Wave 7D — Repeat Pages + PDF Booklet

1. Repeat Pages — component, lib, route, i18n, SEO
2. PDF Booklet — component, lib, route, i18n, SEO
3. Repeat count limits enforced

GATE 7D: both tools work, limits enforced, build green.

### Wave 7E — Final QA + Launch Polish

1. All 33 tools tested
2. Homepage shows "33 PDF tools"
3. /tools page: 25 local + 8 cloud, all rendering
4. Mobile responsive for all 5 new tools
5. Dark mode for all 5 new tools
6. EN/TR/RU complete
7. Performance: all new tools <10 seconds
8. No broken links, no missing images
9. About page in header works
10. Sitemap updated

GATE 7E: comprehensive QA pass. Phase 7 complete.

---

## 7. Phase 7 memory — `docs/phase_7/`

Phase 1-6 docs are READ-ONLY. Create:

```
docs/phase_7/
  index.md
  decisions.md
  architecture.md
  bugs.md
  log.md
  waves/
    wave_7a.md
    wave_7b.md
    wave_7c.md
    wave_7d.md
    wave_7e.md
```

---

## 8. Constraints

- Do NOT delete Lemonsqueezy/Pro code — just hide from UI
- Do NOT delete AI Summary backend — just hide from UI
- Do NOT touch Phase 1-6 docs
- Do NOT touch existing tool logic (Edit PDF, Annotate PDF, etc.)
- All 3 locales (EN/TR/RU) for every text change
- bun run build after each sub-task
- Do NOT commit until gate confirmed by user
- Hetzner deploy only for backend changes (Wave 7A limits)
- Design handoff: ask user for link when starting tool waves

---

## 9. Session bootstrap

1. Read this file (`CLAUDE_7.md`)
2. Read `docs/phase_7/index.md` — if doesn't exist, create tree
3. Resume at current wave's next un-done task
4. For new tools (7B-7D): ask user for design handoff link first

---

## 10. Known tool count

After Phase 7:
- Local tools: 25 (20 existing + 5 new)
- Cloud tools: 8 (9 existing - 1 AI Summary)
- Total: 33 tools
- AI Summary: hidden but code intact

---

## 11. Out of scope

- Lemonsqueezy live mode / real payments
- Pro tier re-launch
- New cloud tools
- Edit PDF changes (Phase 6 complete)
- Annotate PDF changes
- Any Phase 1-6 doc edits
- Image editing in PDF
- Form filling
