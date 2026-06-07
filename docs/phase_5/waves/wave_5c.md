# Wave 5C — Local tool optimizations (stub)

Fix slow local tools without moving to cloud. See CLAUDE_5.md §4 Wave 5C.

- 5C-1: Header/Footer — single-page preview (apply-to-all on download)
- 5C-2: Extract Pages — remove live preview, use text input ("1, 3, 5-10")
- 5C-3: Sign PDF — render only the selected signature page
- 5C-4: Thumbnail lazy loading (Delete/Organize Pages) — IntersectionObserver, batch 10, 72 DPI
- 5C-5: Web Worker (Rotate, Crop, Redact, Page Numbers) — reuse Wave 3G worker, real progress bar
- 5C-6: JPG→PDF — image count limit (anon 50 / free 100 / pro 200), "0 / 50 images"

GATE 5C: slow tools optimized; Rotate 300-page <15s, UI responsive, progress bar.
