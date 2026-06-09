# PlinyPDF — Phase 6 Index

## Current Status

- Phase: 6 (Edit PDF Final Polish & Features)
- Active wave: Wave 6A — Text & Movement Improvements
- Next step: Implement Step 1 (Bug A fix) through Step 6 (bold/italic on addText)

## Wave Status

| Wave | Title | Status |
|---|---|---|
| 6A | Text & Movement | 🔧 In Progress |
| 6B | Images & Stamps | pending |
| 6C | Links & Whiteout Improvements | pending |
| 6D | Annotation & Shape Fixes | pending |
| 6E | Comprehensive QA & Performance | pending |

## Wave 6A Tasks

1. ✅ docs/phase_6/ tree created
2. 🔧 Bug A — shape drag preview fix (EditorCanvas.tsx)
3. 🔧 Bug B — text overflow fix (TextBlock.tsx)
4. 🔧 Bug C — resize min-width/height verify
5. 🔧 Text Move (drag-and-drop)
6. 🔧 Text Duplicate (Ctrl+D)
7. 🔧 More fonts (3 → 6: +Noto Sans, Noto Serif, Noto Sans Mono)
8. 🔧 Bold/Italic on addText (needed for duplicate + 6A-5)
9. 🔧 bun run build gate
10. 🔧 GATE 6A verification

## Key Files

- `components/tools/EditPdf/EditorCanvas.tsx` — main editing surface
- `components/tools/EditPdf/TextBlock.tsx` — single editable text block
- `components/tools/EditPdf/EditorToolbar.tsx` — toolbar (tools + formatting)
- `lib/stores/editorStore.ts` — Zustand store
- `lib/api/editor.ts` — typed HTTP client
- `server/routes/editor.ts` — Elysia routes
- `server/services/editor.ts` — session lifecycle + save logic
- `server/services/pdf-editor.py` — PyMuPDF engine
- `public/fonts/` — Noto font TTFs
