/**
 * Placeholder shown while a tool's client component chunk is fetched (Wave 3G-1,
 * lazy-loading). Roughly matches the FileDropzone footprint so the layout doesn't
 * jump when the real tool mounts. Pure presentational — no hooks, no client deps.
 */
export function ToolSkeleton() {
  return (
    <div className="pp-drop pp-skeleton-wrap" aria-busy="true" aria-live="polite">
      <div className="pp-skeleton mb-4 size-14 rounded-[14px]" />
      <div className="pp-skeleton mb-2 h-4 w-44 rounded" />
      <div className="pp-skeleton h-3 w-60 rounded" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
