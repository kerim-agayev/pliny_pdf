# Wave 3G — Performance

(Stub — planned, not started.)

- Web Workers: `lib/workers/pdf.worker.ts` for Merge/Split/Compress/Grayscale/Crop/Organize/Redact,
  fall back to main thread if unavailable.
- Lazy-load tool components via `next/dynamic` + `ToolSkeleton` (all 28).
- Streaming download for >10MB via File System Access API, fallback to Blob URL.
