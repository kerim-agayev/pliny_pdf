# Wave 10C — Backend Bug Fixes

Issues: 2 (PDF→Word slide-deck 500), 5 (PDF→JPG font block characters). Hetzner deploy needed.

## Tasks
- [ ] PDF→Word slide-deck 500 — check `journalctl -u plinypdf-backend`, Gotenberg/LibreOffice;
      fix or show a friendly "format not supported" error instead of generic 500
- [ ] PDF→JPG font rendering — `server/services/pdf-tools.py` `pdf_to_jpg`; font substitution /
      PyMuPDF flags for non-embedded / CID-encoded fonts
- [ ] Deploy to Hetzner

## GATE 10C
- [ ] PDF→Word: slide-deck PDF converts or shows friendly error
- [ ] PDF→JPG: test PDF renders text correctly
- [ ] `bun run build` green
- [ ] Hetzner deployed
