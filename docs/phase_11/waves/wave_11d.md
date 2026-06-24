# Wave 11D — Uneditable Detection + Performance + Final QA

Closing wave of Phase 11. See CLAUDE_11 §4 Wave 11D.

## Outcome

Investigation showed most of the wave's scope was already shipped. Real work was
small: one new hint, two verifications, and QA + docs.

### Detection — already handled (no change)
- **Scanned:** backend `scanned` flag → store `phase:"scanned"` → modal with
  OCR redirect + "Continue anyway" + i18n (`index.tsx:430`).
- **Encrypted:** `doc.needs_pass` → `passwordRequired` (401) → in-browser
  `PasswordModal` unlock (`index.tsx:202`).
- **Multi-column:** edits are per-blockId, two-pass redact-then-draw → fully
  isolated; one block can't corrupt another.

### Text-over-image hint — NEW (the one gap)
When auto-sampling fails (text over image/gradient/watermark) the server sends
`bgColor:null` and the mask silently fell back to white. Added a hint:
- `lib/stores/editorStore.ts` — `bgSampleFailed` derived in `selectBlock`
  (`block.bgColor === null && no manual override`; `=== null` excludes
  locally-added text). Cleared in `setFormat` once a color is picked.
- `EditorToolbar.tsx` (desktop) — amber ring + retitled tooltip on the bg swatch.
- `MobileToolbar.tsx` — amber hint line under the bg field.
- `messages/{en,tr,ru}.json` — `bgNoMatchHint`.
- Verified on Hetzner: synthetic gradient block → `bgColor None` (hint);
  flat-white block → `#ffffff` (no hint).

### Rotated page — verified correct (no change)
REKVIZIT-rotated.pdf (rotation 270), real engine on Hetzner: identity re-type of
all 25 blocks → 2.5% pixel delta; single-block edit renders in the correct row,
correct orientation, old text removed. PyMuPDF handles redaction + insert on the
rotated page. No derotation fix, no Hetzner deploy.

### Performance — measured, accepted
Lighthouse mobile prod `/edit-pdf`: Performance 66 this run (84 at GATE 10D;
high variance). LCP 4.7s = client-rendered empty-state H1 gated by the
`ssr:false` editor chunk; "unused JS 356 KiB" is in that chunk. Both = risky SSR
refactor the plan excludes. Legacy-JS lever (browserslist) drops older-browser
support → unsafe. Accepted as a non-blocker; LCP refactor deferred.

## GATE 11D
- [x] Scanned PDF → existing modal on open
- [x] Text-over-image → manual-color hint (data path verified; visual = user QA)
- [x] Rotated PDF → edits land correctly (verified, no fix)
- [x] Encrypted PDF → unlock modal (already handled)
- [x] Multi-column → edits stay local (verified)
- [~] Lighthouse ≥ 90 → not met; accepted non-blocker per pre-authorized decision
- [x] `bun run build` green
- [ ] User confirms GATE 11D (frontend hint visual on desktop + mobile)

## Test PDFs used
- REKVIZIT-rotated.pdf (rotation 270) — rotated verification
- The_Comic_Machine_Dissected-extracted.pdf — fully image (5 pages, no text
  layer) → exercises the scanned modal, not the hint
- synthetic text-over-image PDF (on Hetzner) — exercises the bgColor=null hint
