# CLAUDE_2.md — PlinyPDF Phase 2

> Read this file first at the start of every Phase 2 session.
> Phase 1 docs (`docs/index.md`, `docs/decisions.md`, `docs/architecture.md`,
> `docs/bugs.md`, `docs/log.md`) are READ-ONLY in Phase 2. Do not modify them.
> All Phase 2 memory lives under `docs/phase_2/`.

---

## 1. What this phase is

Phase 1 shipped 13 tools, auth, billing, dashboard, and an SEO/content baseline.
Phase 1 left three items deferred (domain purchase + the steps it gates,
PostHog key activation, Sentry setup) — those are completed separately when
the user buys `plinypdf.com`. **Phase 2 does not depend on the domain** and
does not block on it.

Phase 2 goal: add **15 new tools** to the existing PlinyPDF catalog in
three waves, plus the supporting localization, SEO, and navigation
changes. After Phase 2, the catalog goes from 13 → 28 tools.

User decisions locked in for Phase 2:

- AI-style cloud tools (Chat with PDF, PDF → PowerPoint, PDF → Excel) are
  OUT. Users can already get these from ChatGPT / Claude / Gemini /
  NotebookLM. We don't burn server budget on duplicates.
- Only one new cloud tool: **OCR PDF** (Tesseract — classic CV, not AI,
  not something users can get elsewhere easily).
- All other 14 new tools are **local** (browser-side, no server).
- Lemonsqueezy stays in **test mode** until launch day. Do not switch.
- Production deploy (Caddy + Vercel + DNS) stays deferred. Phase 2 ships
  to `main` and to the Hetzner backend via `git pull` only when a wave
  is fully gate-passed.

---

## 2. Tool catalog — what we're adding

### Wave 2A — High-priority local tools (8 tools)

The 8 tools competitors push hardest on. Most need real design — see
section 4 for which.

| Tool slug         | Name                | Design needed | Library |
| ----------------- | ------------------- | ------------- | ------- |
| `add-page-numbers`| Add Page Numbers    | YES           | pdf-lib |
| `organize-pages`  | Organize Pages      | YES           | pdf-lib + dnd-kit + pdfjs-dist (thumbnails) |
| `delete-pages`    | Delete Pages        | no            | pdf-lib + pdfjs-dist (thumbnails) |
| `extract-pages`   | Extract Pages       | no            | pdf-lib |
| `crop-pdf`        | Crop PDF            | YES           | pdf-lib + pdfjs-dist (canvas) |
| `header-footer`   | Header & Footer     | YES           | pdf-lib |
| `sign-pdf`        | Sign PDF            | YES           | pdf-lib + fabric.js (signature pad) |
| `redact-content`  | Redact Content      | YES           | pdf-lib + pdfjs-dist + fabric.js |

### Wave 2B — Medium-priority local tools (6 tools)

Niche but completes the catalog. All ride existing `ToolShell` patterns —
no new design needed.

| Tool slug         | Name             | Library                |
| ----------------- | ---------------- | ---------------------- |
| `text-to-pdf`     | Text → PDF       | pdf-lib                |
| `markdown-to-pdf` | Markdown → PDF   | markdown-to-jsx + pdf-lib (or browser print-to-PDF) |
| `edit-metadata`   | Edit Metadata    | pdf-lib                |
| `remove-metadata` | Remove Metadata  | pdf-lib                |
| `grayscale-pdf`   | Grayscale PDF    | pdf-lib + pdfjs-dist (re-rasterize per page) |
| `flatten-pdf`     | Flatten PDF      | pdf-lib (form.flatten) |

### Wave 2C — One cloud tool (1 tool)

| Tool slug | Name    | Where it runs                                      |
| --------- | ------- | -------------------------------------------------- |
| `ocr-pdf` | OCR PDF | Hetzner backend, Tesseract (system-installed `tesseract-ocr` package, called from Bun via `Bun.spawn`) |

OCR engine choice: install `tesseract-ocr` + language packs (eng, tur, rus)
on the Hetzner server via `apt install tesseract-ocr tesseract-ocr-eng
tesseract-ocr-tur tesseract-ocr-rus`. Backend route accepts a PDF, splits
to images with Gotenberg (already on the server), runs `tesseract` on each
page, re-embeds the text layer into the original PDF via pdf-lib, returns
the searchable PDF. The first PDF page goes back to the user with a
working text layer they can `Ctrl+F` through.

This is one new backend route, one tesseract install on Hetzner, and one
frontend tool page. Nothing AI, nothing fancy. Free tier gets 3/day, Pro
gets 100/day (reuse existing Upstash rate-limiter; new buckets keyed by
`ocr:anon:<ip>:<date>` and `ocr:user:<id>:<date>`).

---

## 3. Catalog & routing — surgical changes only

The catalog source of truth is `lib/tools.ts`. Every other place that
needs to know about tools (sitemap, tools index page, dashboard quick
links, SEO JSON-LD) reads from `lib/tools.ts` — confirm this before
adding tools and add the 15 new entries there in one place.

For each new tool, add to `lib/tools.ts`:

```ts
{
  slug: "add-page-numbers",
  category: "edit",          // organize | edit | convert | secure
  type: "local" | "cloud",
  name: { en, tr, ru },      // already the pattern
  desc: { en, tr, ru },
  icon: <lucide icon name>,
  badge: "local" | "cloud",
  free: boolean,             // free for everyone vs. Pro-only
  comingSoon: false,
}
```

After the entries land in `lib/tools.ts`, three things light up
automatically (verify this is still true — do not refactor if it works):

- `/tools` index page renders the new cards.
- `app/sitemap.ts` includes them (× 3 locales).
- Dashboard quick-tools row picks them up.

Routes — one route per tool, locale-prefixed:

```
app/[locale]/<slug>/page.tsx
```

Each new tool page follows the existing pattern: server component with
`generateMetadata()` (title, description, OG image, canonical, hreflang)
+ a client tool component imported from `components/tools/<ToolName>.tsx`.

---

## 4. Design handoff

Six tools need design from Claude Design. Nine don't.

**Need design** (Wave 2A subset):
1. Add Page Numbers
2. Organize Pages (the drag-and-drop grid is the killer interaction)
3. Crop PDF
4. Header & Footer
5. Sign PDF
6. Redact Content

**Don't need design** (use existing `ToolShell` + standard layout):
- Delete Pages, Extract Pages (Wave 2A)
- All 6 Wave 2B tools
- OCR PDF (Wave 2C — language picker + progress bar, no design needed)

### When you reach a design-needed tool

STOP and ask the user for the Claude Design handoff link for THAT tool
specifically (the user will run Claude Design with a prepared prompt and
hand you the URL). Once the user pastes the link:

1. Fetch the screens from the handoff and place under
   `.design-handoff/<tool-slug>/`. Do NOT modify Phase 1 handoff folders.
2. Build the React component from the handoff. Do not invent UI.
3. Verify mobile (375px) + dark mode renders match the handoff.

Do not start a design-needed tool without the handoff. Ask first.

---

## 5. Phase 2 memory — `docs/phase_2/`

Phase 1 `docs/*.md` files are READ-ONLY. Create a fresh tree:

```
docs/phase_2/
  index.md          # status, current wave, current tool, next steps
  decisions.md      # Phase 2 decisions only
  architecture.md   # OCR pipeline, new tool patterns, design tokens
  bugs.md           # bugs found this phase
  log.md            # one entry per wave gate-pass
  waves/
    wave_2a.md      # detailed plan + completion notes for Wave 2A
    wave_2b.md      # ... 2B
    wave_2c.md      # ... 2C
```

After every gate, append a log.md entry. After every wave, write the
wave's completion summary in `waves/wave_<id>.md`. Keep entries factual,
short, and dated. Do not duplicate Phase 1 content.

Memory token discipline: read `docs/phase_2/index.md` first at session
start, drill into other files only when needed. Phase 1 docs are
referenced by path only — do not paste their content into Phase 2 files.

---

## 6. Execution plan — wave-by-wave, gated

Each wave commits as its own logical chunk. After each wave: build green,
user verifies in browser, then `git push origin main`.

### Wave 2A — 8 high-priority local tools

Plan order (start simplest → most complex so build patterns get reused):

1. `delete-pages` (no design, simplest)
2. `extract-pages` (no design)
3. `add-page-numbers` (design required — STOP for handoff)
4. `header-footer` (design required — STOP for handoff; reuses page-numbers patterns)
5. `crop-pdf` (design required — STOP for handoff)
6. `organize-pages` (design required — STOP for handoff; the centerpiece)
7. `sign-pdf` (design required — STOP for handoff)
8. `redact-content` (design required — STOP for handoff)

For each tool:

- Add entry to `lib/tools.ts`
- Add i18n keys to `messages/{en,tr,ru}.json` (tool name, description, FAQ,
  HowTo strings — match existing pattern)
- Create `app/[locale]/<slug>/page.tsx` (server component + metadata)
- Create `components/tools/<ToolName>.tsx` (client component)
- Wire PostHog `tool_used` event at the existing success path
- Add FAQ + HowTo JSON-LD using the existing helper in `components/seo/JsonLd.tsx`
- Add to OG image generation (auto, if `lib/tools.ts` is the source of truth)

After each tool: `bun run build` must pass. After all 8 tools:

GATE 2A — user tests every Wave 2A tool in the browser. Local-tools sanity
check: a real PDF in, the correct output PDF out, no upload traffic in
DevTools Network tab. Mobile (375px) renders. Dark mode renders. /en /tr
/ru render.

Commit: `feat(tools): Wave 2A — page-numbers, organize, delete/extract, crop, header-footer, sign, redact`

### Wave 2B — 6 medium-priority local tools

No design handoffs. Each tool is one file with the existing `ToolShell`
pattern. Order:

1. `remove-metadata` (single button, simplest)
2. `edit-metadata` (form)
3. `grayscale-pdf` (single button, but requires re-rasterizing pages — heavier work)
4. `flatten-pdf` (single button)
5. `text-to-pdf` (textarea + format options)
6. `markdown-to-pdf` (split editor + preview)

Same per-tool checklist as Wave 2A. After all 6:

GATE 2B — user tests every Wave 2B tool in the browser. Same sanity check
as 2A.

Commit: `feat(tools): Wave 2B — metadata, grayscale, flatten, text/markdown to PDF`

### Wave 2C — OCR PDF (one cloud tool)

Backend changes:

1. SSH to Hetzner (49.13.119.27) and install Tesseract:
   `apt install -y tesseract-ocr tesseract-ocr-eng tesseract-ocr-tur tesseract-ocr-rus`
   Verify: `tesseract --version` and `tesseract --list-langs` shows eng/tur/rus.
2. Add `server/services/ocr.ts`: page-by-page Tesseract via `Bun.spawn`,
   re-embed text layer with pdf-lib invisible text overlay.
3. Add `server/routes/ocr.ts`: POST `/api/ocr` (multipart PDF + language),
   auth-optional, applies the same rate-limiter pattern as PDF→Word.
4. New Upstash rate keys: `ocr:anon:<ip>:<date>` (3/day) and
   `ocr:user:<id>:<date>` (free 10/day, Pro 100/day).
5. `server/index.ts`: wire the route. CORS already env-driven, no edit.

Frontend changes:

1. `lib/tools.ts`: entry with `type: "cloud"`, `badge: "cloud"`.
2. `app/[locale]/ocr-pdf/page.tsx` + `components/tools/OcrPdf.tsx`.
3. Tool UI: file dropzone + language picker (eng/tur/rus, default
   matches `useLocale()`) + progress bar (page X of Y) + result download.
4. PostHog `tool_used` event.

After build:

GATE 2C — user tests OCR with (a) a scanned PDF (image-only — text is not
selectable before, IS after), (b) a text-PDF (should pass through OCR
fine), (c) a Turkish-text scanned PDF using the `tur` language. Mobile
check. Rate-limit check (4th anon attempt blocked).

Commit: `feat(tools): Wave 2C — OCR PDF (Tesseract on Hetzner)`

---

## 7. Per-wave verification (mandatory before commit)

After every wave, run all of:

- `bun run build` — green, every locale × every route, no MISSING_MESSAGE.
- Tool sanity in `bun dev`:
  - Empty state renders.
  - Real PDF in → correct output PDF.
  - Errors show friendly messages (corrupt PDF, > 100MB, etc.).
  - Mobile (375px) renders.
  - Dark mode renders.
- For local tools: DevTools Network tab shows no upload during processing.
- For OCR: backend log shows the Tesseract subprocess, no leaked stderr to
  the response.
- Privacy claim still holds: tools index page lists each new local tool
  with the green "Local" badge.

If a verification step fails, fix it before committing. No "we'll get to
it later" partial commits.

---

## 8. After Phase 2 — domain-dependent items (NOT done in Phase 2)

These remain queued from Phase 1 and are out of scope for Phase 2. Do not
attempt them without an explicit user instruction in a future session:

- Buy `plinypdf.com`
- Cloudflare DNS for `api.plinypdf.com` (grey cloud)
- Install Caddy on Hetzner (config already in `deploy/Caddyfile`)
- Vercel deploy + custom domain
- Update Google OAuth redirect URI
- Update Lemonsqueezy webhook URL
- Activate PostHog (add `NEXT_PUBLIC_POSTHOG_KEY` to Vercel)
- Add Sentry (`@sentry/nextjs` + `SENTRY_DSN`)
- GATE 2-final: full end-to-end test on `https://plinypdf.com`
- Switch Lemonsqueezy to live mode (requires explicit user confirmation)

Full runbook lives at `deploy/README.md` ("Remaining when domain is
purchased").

---

## 9. Constraints (Karpathy — same as Phase 1, restated)

- **Simplicity first.** No new architectures, no CMS for tool config, no
  test framework, no fancy state managers. Existing patterns
  (`lib/tools.ts`, `ToolShell`, Zustand, pdf-lib, dnd-kit, fabric.js) are
  what we use. If a tool genuinely needs a new dep, install it and note
  why in `docs/phase_2/decisions.md`.
- **Surgical.** Do not refactor Phase 1 code. Do not "while I'm here"
  improve unrelated files. Don't even reformat them. Adding entries to
  `lib/tools.ts` and `messages/*.json` is the only place you touch
  existing files; everything else is additive.
- **No Phase 1 doc edits.** `docs/index.md`, `docs/decisions.md`,
  `docs/architecture.md`, `docs/bugs.md`, `docs/log.md` are read-only.
  Phase 2 memory lives only under `docs/phase_2/`.
- **Test mode billing stays.** Do not switch Lemonsqueezy to live mode.
- **Stop and ask.** Design handoff link for design-needed tools, anything
  ambiguous in tool behavior, any decision that adds a dependency.

---

## 10. Session bootstrap — what to do at the start of every Phase 2 session

1. Read this file (`CLAUDE_2.md`).
2. Read `docs/phase_2/index.md` to learn current state. If it doesn't
   exist yet, this is the first Phase 2 session — create the
   `docs/phase_2/` tree and stub all five files plus `waves/`.
3. Open `lib/tools.ts` to see which slugs already exist.
4. Resume at the current wave's next un-done tool, per the order in
   section 6.
5. If the next tool needs design and there is no handoff folder under
   `.design-handoff/<slug>/`, STOP and ask the user for the handoff link.

That's the loop. One tool at a time, in order, ending at the wave's gate,
then commit + push + update `docs/phase_2/`.
