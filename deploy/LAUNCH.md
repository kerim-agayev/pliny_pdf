# PlinyPDF — Launch Materials

Drafts for the soft launch. Copy-edit before posting. Launch only after the domain is
live and GATE 2 (full e2e on https://plinypdf.com) passes — see `deploy/README.md`.

---

## ProductHunt

**Tagline** (≤60 chars):
> Edit PDFs without uploading them

**Description** (≤260 chars):
> A privacy-first PDF toolkit. 25 of 33 tools run entirely in your browser — files never
> touch a server (verify in DevTools): merge, split, organize, sign, redact, crop, watermark,
> edit. Plus server-side convert & OCR. No ads, no tracking, real free tier.

**Topics:** Productivity · Privacy · Design Tools · Developer Tools

**Maker's first comment:**
> Hi PH 👋 I built PlinyPDF because every "free online PDF tool" quietly uploads your
> files to a server you don't control — contracts, IDs, medical records and all. PlinyPDF
> does the opposite: 25 of 33 tools run in your browser via WebAssembly. Open DevTools →
> Network and you'll see zero upload traffic. The few things that genuinely need a server
> (PDF↔Word, OCR, Compress, Grayscale, Merge, Edit PDF, PDF↔JPG) are clearly marked, encrypted
> in transit, deleted within 24h. All 33 tools are free — no watermark, no daily cap on local
> tools. Would love your feedback — especially on the live watermark preview, the drag-and-drop
> page organizer, and the in-browser editor.

**Gallery shot list** (1270×760 or 16:9):
1. **Homepage hero** — headline "33 PDF tools, all free." + tool grid (33 tools).
2. **Watermark live preview** — settings panel left, real-time PDF preview right (the hero shot).
3. **Organize Pages** — the drag-and-drop page grid mid-drag (strong new hero candidate).
4. **Sign PDF** — a drawn/typed signature placed on a page (Draw/Type/Upload tabs visible).
5. **Redact Content** — black redaction boxes on a page + "permanent" messaging (privacy story).
6. **Annotate PDF** — a PDF with highlights, a sticky note, and freehand annotation visible.
6b. **Edit PDF (cloud)** — clicking real PDF text to edit it inline, with the cloud badge visible.
7. **Tools page** — full 33-tool grid with local/cloud badges visible.
8. **Dashboard** — usage stats and recent cloud-tool history.
9. **DevTools proof** — a tool mid-run with the Network tab open showing no upload (the
   credibility shot for the privacy claim).

**Demo GIF** (≤3 MB, ~30s): the Watermark tool — type text, drag opacity/size sliders, watch
the preview update live, then download. This is the single most "show, don't tell" moment.

---

## Show HN

**Title:**
> Show HN: PlinyPDF – Edit PDFs without uploading them (in-browser, WASM)

**Body:**
> Most online PDF tools upload your file to a server to do things that don't need a server —
> merging, rotating, compressing, watermarking. I wanted one that just… didn't.
>
> PlinyPDF runs 25 of its 33 tools entirely in the browser using WebAssembly (pdf-lib +
> pdf.js). Your file never leaves the tab — you can confirm it in DevTools → Network: no
> upload request, no matter the file size. The 8 tools that genuinely need server compute
> (PDF→Word via LibreOffice, Word→PDF, OCR, Compress, Grayscale, Merge, Edit PDF, PDF↔JPG) are
> labeled as such, sent over TLS, deleted within 24 hours, and never used to train anything.
>
> Stack: Next.js (App Router) on the frontend, a small Bun/Elysia service for the cloud tools,
> Gotenberg/LibreOffice in Docker for Office conversion, Postgres for accounts. Full UI in
> English, Turkish, and Russian.
>
> No ads, no trackers, no "free to edit, pay to download" nonsense. Free tier has no watermark
> and no daily limit on local tools.
>
> Honest open question for HN: where's the line for you between "acceptable to upload" and
> "should be local"? And is the DevTools-Network check a convincing proof, or do people want
> something stronger (e.g. published source, SRI, a reproducible build)?

*HN tone notes:* no marketing adjectives, lead with the technical "why," invite real critique,
respond fast in the thread. Post Tue–Thu, ~8–10am ET.

---

## Reddit

### r/privacy
**Title:** I built a PDF toolkit that processes files in your browser — verify "no upload" yourself in DevTools

> Every time you use an online PDF tool, your document is usually uploaded to a server. For
> a contract or an ID scan, that's a real exposure. PlinyPDF keeps 25 of its 33 tools
> (merge/split/organize/sign/redact/crop/watermark/password/edit) entirely in the browser via
> WebAssembly — nothing is transmitted. Redaction even re-rasterizes the page so removed text
> is truly gone, not just covered. You don't have to trust me: open DevTools → Network, run a
> tool, and watch for zero upload traffic. The few server-side features (Office conversion,
> OCR, AI summary) are clearly flagged, deleted within 24h, and never used for training. No ads, no trackers, one session cookie only if you sign in. Feedback on the
> privacy model welcome — what would make the "local" claim more verifiable for you?

### r/selfhosted
**Title:** Privacy-first PDF toolkit — in-browser WASM for local tools, small Bun/Gotenberg backend for the rest

> Sharing a project that might interest this crowd: PlinyPDF. 25 of 33 PDF ops (merge, split,
> organize, sign, redact, crop, watermark, password, annotate) run client-side in WebAssembly —
> no server round-trip. The only server piece is a small Bun/Elysia service + Gotenberg
> (LibreOffice in Docker) for PDF↔Word, ocrmypdf for OCR, plus Postgres for accounts. It's designed so the backend is minimal
> and the heavy/private work stays on the user's machine. Curious what self-hosters think of
> the split, and whether a fully self-hostable bundle (compose file for the backend + static
> frontend) would be useful to you.

### r/InternetIsBeautiful
**Title:** A PDF editor with a live watermark preview that never uploads your file

> [plinypdf.com] — merge, edit, watermark and convert PDFs with a clean UI. The watermark tool
> shows a real-time preview as you tweak text/opacity/position, and almost everything runs
> right in your browser so your files stay on your device. Free, no ads, no watermark on output.

*Reddit notes:* each sub has different self-promo rules — read them first, engage genuinely,
don't cross-post the identical text the same day. Lead with the demo, not the pitch.

---

## Launch-day checklist
- [ ] Domain live, GATE 2 passed (signup, PDF→Word, watermark, test-card upgrade → Pro).
- [ ] Lemonsqueezy still in **test mode**? Decide go-live before accepting real payments.
- [ ] PostHog key set (Vercel env) so launch traffic is measured.
- [ ] OG images render (`/api/og`) — check the link preview on Twitter/Slack before posting.
- [ ] Gallery screenshots + demo GIF captured at the final UI.
- [ ] Post order: ProductHunt 12:01am PT → Show HN morning ET → Reddit spread across the day.
