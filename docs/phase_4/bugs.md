# Phase 4 — Bugs & Known Costs

## Known costs / limitations (by design, document don't hide)
- **`apply` re-renders affected pages each call.** Full-document replay on every
  mutation is simple and correct but costs render time on large PDFs. Future:
  render only pages touched by the change set delta.
- **Font matching is approximate** (base14 / Noto substitution) — text may shift
  slightly. Same limitation as Acrobat (CLAUDE_4 §8).
- **No layout reflow** — added text can overflow the original block (matches Sejda).
- **find-replace caseSensitive/wholeWord are best-effort** — `search_for` is
  case-insensitive; case/word-boundary are filtered post-hoc.
- **Scanned PDFs** have no text blocks; `open` returns `scanned: true` so the UI
  can point users to OCR first.

## Bugs
_(none yet)_
