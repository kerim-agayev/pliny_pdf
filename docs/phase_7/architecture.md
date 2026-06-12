# Phase 7 — Architecture Notes

## Tier System (Phase 7+)
Two visible tiers: Anon and Free. Pro tier kept in code for graceful degradation of legacy accounts (maps to free limits).

## New Tools (7B–7D) — All Local
- PDF to Text: pdfjs-dist getTextContent → .txt download
- N-up Layout: pdf-lib embed + scale pages onto single sheet
- Repeat Pages: pdf-lib copyPages
- Reverse Pages: pdf-lib page reorder
- PDF Booklet: pdf-lib reorder + 2-up layout

## Limit Architecture
- `effectivePlan(plan)` helper normalizes 'pro' → 'free'
- Per-tool constants added: MERGE_MAX_PAGES, OFFICE_MAX_MB/PAGES, REPEAT_MAX_COUNT, NUP_MAX_OUTPUT_PAGES
- Standard local limits (LOCAL_MAX_MB/PAGES) apply to PDF to Text, Reverse Pages, Booklet
