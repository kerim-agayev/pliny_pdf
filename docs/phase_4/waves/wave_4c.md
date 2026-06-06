# Wave 4C — Burn annotations into the saved PDF — ✅ DONE (GATE 4C passed 2026-06-07)

Annotations were client-only overlays through 4B. 4C serializes them on Save and burns
them into the downloaded PDF server-side via PyMuPDF. GATE 4C passed — burn confirmed via
`journalctl` (`[pdf-editor] burn …` lines for every annotation type).

**Root cause of the first gate failure:** only `pdf-editor.py` had been redeployed; the
Bun backend (`server/routes/editor.ts` + `server/services/editor.ts`) still ran the 4B
version, which silently dropped the unknown `annotations` field (TypeBox ignores extra
props). Deploying all three backend files fixed it. Diagnostic logging was added across the
chain (browser console + backend stderr/journalctl).

## Built
- **Frontend**
  - `lib/stores/editorStore.ts`: `updateAnnotation(id, patch)`; removed `link` from the
    `Tool`/`Annotation` unions.
  - `lib/api/editor.ts`: `AnnotationChange` type; `saveEditor(sessionId, changes, annotations)`
    now posts an `annotations` array.
  - `components/tools/EditPdf/index.tsx`: `handleSave` sends `annotationList()` (maps store
    annotations, drops `id`, skips `underline`).
  - `EditorToolbar.tsx`: Comment button restored. `CommentTool.tsx`: bubble textarea edits the
    comment body via `updateAnnotation`. `EditorCanvas.tsx`: link branch removed; comment
    passes `onChangeText`.
- **Backend**
  - `server/routes/editor.ts` `/save`: body schema gains optional `annotations[]`.
  - `server/services/editor.ts` `saveSession(sessionId, edits, annotations)`: idempotent —
    drops prior `edit` + annotation changes (`highlight/strike/draw/shape/comment`), re-adds
    the current set, keeps live add-text/whiteout/find-replace.
  - `server/services/pdf-editor.py`: `import math`; helpers `_apply_highlight`
    (`draw_rect` translucent fill), `_apply_strike` (`draw_line` mid-height), `_apply_draw`
    (`_parse_path` → `draw_polyline`), `_apply_shape` (rect/oval/line + computed arrow barbs),
    `_apply_comment` (`add_text_annot` sticky note); dispatched in `cmd_apply`.

## Representations (user-approved)
- Highlight → translucent color fill (`fill_opacity≈0.35`). Comment → interactive PDF
  sticky-note. Link removed permanently. Underline skipped.

## GATE 4C (pending)
1. Deploy backend to Hetzner (`git pull` + `systemctl restart plinypdf-backend`).
2. Draw each annotation type across ≥2 pages, vary color/stroke → Save → open the downloaded
   PDF in a separate viewer; confirm presence / placement / color / size, arrow direction, and
   the comment note text.
3. Re-save twice → no duplicate annotations; text / whiteout / find-replace intact.
