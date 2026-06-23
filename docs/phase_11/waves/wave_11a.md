# Wave 11A — Smart Background Sampling (Whiteout Fix)

**Goal:** mask behind edited text matches the real page background, not white.

## Tasks
- [x] Investigation → architecture.md
- [ ] `_sample_bg_color(page, rect)` in `pdf-editor.py` (median frame color,
      variance fallback, rotation guard)
- [ ] `_redact_rect(page, rect, fill=(1,1,1))` — fill param
- [ ] `cmd_apply` opens pristine sample doc; `_apply_edit` samples + passes fill
- [ ] self-check (`test_sample_bg.py`)
- [ ] `bun run build` green
- [ ] Deploy backend to Hetzner
- [ ] GATE 11A (zebra PDF + white + colored + gradient fallback + delete)

## Approach
Option B (backend PyMuPDF). Sample a frame band just outside the glyph bbox
from a pristine page pixmap (dpi=72), take the median RGB, fall back to white
when variance is high (gradient/image/border) or the page is rotated.

## Notes
- Fixes deleted blocks on colored rows too (redact runs before delete return).
- Find-replace path left white (dormant since 8D).
