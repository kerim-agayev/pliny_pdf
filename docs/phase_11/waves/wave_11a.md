# Wave 11A — Smart Background Sampling (Whiteout Fix) — DONE ✅

**Goal:** mask behind edited text matches the real page background, not white.

**GATE 11A passed 2026-06-23 (user-confirmed).**

## Tasks
- [x] Investigation → architecture.md
- [x] `_sample_bg_color(page, rect)` in `pdf-editor.py` (median frame color,
      variance fallback, rotation guard)
- [x] `_redact_rect(page, rect, fill=(1,1,1))` — fill param
- [x] `cmd_apply` opens pristine sample doc; `_apply_edit` samples + passes fill
- [x] self-check (`test_sample_bg.py`)
- [x] `bun run build` green
- [x] Deploy backend to Hetzner
- [x] Live-editor mask tint (`bgColor` per block in parse → `TextBlock` mask)
- [x] Move fix — gray stays at old spot (root div transparent when moved)
- [x] Delete fix — no empty placeholder (deleted block = mask only) + keyboard
      Delete/Backspace on selected block
- [x] GATE 11A (zebra PDF + white + colored + gradient fallback + delete + move)

## Approach
Option B (backend PyMuPDF). Sample a frame band just outside the glyph bbox
from a pristine page pixmap (dpi=72), take the median RGB, fall back to white
when variance is high (gradient/image/border) or the page is rotated. Same
`bgColor` reused for the live-editor mask so preview == saved output.

## Commits
`a66bc80` backend sampling · `338dca3` live-mask tint · `59a014d` move fix ·
`4334ec2` delete fix + keyboard delete.

## Notes
- Fixes deleted blocks on colored rows too (redact runs before delete return).
- Find-replace path left white (dormant since 8D).
- Deferred to 11B: manual color picker/eyedropper, font matching, AZ/TR/RU
  characters; newly-added text on a colored row still gets a white mask.
