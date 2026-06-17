// Route-level skeleton for the tools catalog (Wave 9I). Mirrors ToolsCatalog's
// header + card grid so the layout doesn't jump when content arrives.
export default function Loading() {
  return (
    <section className="px-5 pt-16 pb-28 sm:px-10" aria-busy="true" aria-live="polite">
      <div className="mx-auto max-w-[1180px]">
        <div className="pp-skeleton mb-4 h-4 w-40 rounded" />
        <div className="pp-skeleton mb-4 h-12 w-72 rounded" />
        <div className="pp-skeleton mb-10 h-5 w-[420px] max-w-full rounded" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="pp-card p-5">
              <div className="pp-skeleton mb-4 size-10 rounded-[10px]" />
              <div className="pp-skeleton mb-2 h-4 w-32 rounded" />
              <div className="pp-skeleton h-3 w-44 rounded" />
            </div>
          ))}
        </div>
      </div>
      <span className="sr-only">Loading…</span>
    </section>
  );
}
