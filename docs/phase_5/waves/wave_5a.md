# Wave 5A — Global fixes + limit enforcement

Goal: foundation for Phase 5. No cloud migration (5B) or tool internals (5C) here.

## Tasks
- [x] **5A-1** Download filename fix — `lib/format.ts` (`types` on picker + anchor ext safety net; .pdf/.jpg/.zip/.docx)
- [x] **5A-2** Local limits — `lib/limits.ts` tiered `LOCAL_MAX_MB` + `LOCAL_MAX_PAGES`;
      `localMaxMB/localMaxBytes/localMaxPages`; `FileDropzone` plan-aware badge + `checkPages`;
      opt-in `checkPages` on 17 local PDF tools
- [x] **5A-3** Cloud limits — `CLOUD_MAX_MB` {25,100,250}, `CLOUD_MAX_PAGES` {50,300,1000},
      `cloudMaxPages`; `ratelimit.ts` `userServer` 10→15
- [x] **i18n** — `tooManyPagesLocal` in en/tr/ru
- [x] **GATE 5A** — `bun run build` green (141/141, no MISSING_MESSAGE)

## Limit table (target Phase-5 state — confirmed with user)
- **Local** (Split, Rotate, Delete/Extract/Organize Pages, Page Numbers, Header/Footer,
  Crop, Sign, Redact, Remove/Edit Metadata, Flatten, Watermark, Password Protect/Remove,
  Annotate, Text→PDF\*, Markdown→PDF\*, JPG→PDF\*\*):
  anon 10 MB/50 pg · free 25 MB/150 pg · pro 50 MB/300 pg · no daily cap.
  \* size only (no PDF page input). \*\* image-count limit in 5C.
- **Cloud — migrated 5B** (Compress, Grayscale, PDF→JPG, Merge) + **existing** (PDF→Word,
  Word→PDF, OCR): anon 25 MB/50 pg/3·day · free 100 MB/300 pg/15·day · pro 250 MB/1000 pg/∞.
  *(In 5A the 4 migrated tools still run locally under the local row.)*
- **AI Summary:** same size limits; quota 2/month free, ∞ pro (no page limit).
- **Edit PDF (unchanged):** anon 15 MB/20 pg · free 50 MB/100 pg · pro 200 MB/500 pg;
  timeout 15/30/60 min; daily anon 3 · free 15\* · pro ∞ (\*was 10; shared limiter).
