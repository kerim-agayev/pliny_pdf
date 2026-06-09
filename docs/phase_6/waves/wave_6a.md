# Wave 6A — Text & Movement Improvements

## Task Checklist

- [x] docs/phase_6/ tree created
- [ ] Bug A — shape drag preview fix
- [ ] Bug B — text overflow fix (overflow: hidden in TextBlock)
- [ ] Bug C — verified already fixed
- [ ] Text Move — store blockPositions + moveBlock
- [ ] Text Move — TextBlock drag gesture + pos prop
- [ ] Text Move — EditorCanvas onMove wiring
- [ ] Text Move — BlockChange x/y
- [ ] Text Move — save route x/y passthrough
- [ ] Text Move — saveSession reconcile x/y/bold/italic for add-text
- [ ] Text Move — Python geo map text+baseline_offset, _apply_edit override
- [ ] Text Duplicate — duplicateBlock function + Ctrl+D
- [ ] Text Duplicate — toolbar button
- [ ] Fonts — download NotoSerif to Hetzner
- [ ] Fonts — FONTS array 3→6 in EditorToolbar
- [ ] Fonts — cssFont() mapping for Noto fonts
- [ ] Fonts — Python _insert_text Noto routing
- [ ] Bold/Italic addText — extend API, route, service
- [ ] bun run build
- [ ] GATE 6A verification

## Gate Verification Checklist

1. [ ] bun run build — zero errors, zero MISSING_MESSAGE
2. [ ] Bug A: arrow/circle/line drag previews are correct shapes
3. [ ] Bug B: text clips within border after resize
4. [ ] Bug C: confirmed min-width 50, min-height 20 (no-op — already correct)
5. [ ] Text Move: existing PDF block dragged → new position in PNG
6. [ ] Text Duplicate: Ctrl+D → offset copy, auto-selected
7. [ ] Fonts: Noto Sans/Serif/Mono render in downloaded PDF
8. [ ] Bold/Italic: toggle bold on existing block → text is bold in saved PDF (not erased)
9. [ ] Duplicate bold: duplicated bold block stays bold in PDF
10. [ ] No regressions on whiteout, highlight, find/replace, undo/redo
