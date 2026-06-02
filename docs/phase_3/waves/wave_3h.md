# Wave 3H — PDF→Word patience UI (final wave)

Decision: **Option B** (patience UI, keep Gotenberg) — see decisions.md. No hard page cap.

## 3H — Patience UI ✅ (built, awaiting gate)
- `components/tools/CloudConvertTool.tsx` (shared by pdf-to-word + word-to-pdf): the existing
  "uploading" box now shows, while the conversion runs:
  - a live **mm:ss elapsed timer** (`performance.now()` + 1s interval, cleared on done/error),
  - an **indeterminate progress bar** (`.pp-progress[data-indeterminate]`, reduced-motion safe),
  - a **patience message** that escalates after `PATIENCE_THRESHOLD` (45s): `cloudPatience`
    → `cloudPatienceLong` ("still converting… almost there, don't close the tab"),
  - the existing secure-delete note retained.
- i18n: `ToolUI.cloudPatience` + `cloudPatienceLong` en/tr/ru.
- Gotenberg flow, endpoints, size limits unchanged. No page cap added (Option A held in reserve).
- Verify: build green (exit 0), no MISSING_MESSAGE. Timer/escalation needs browser gate.
