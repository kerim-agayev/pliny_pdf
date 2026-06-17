// Route-level skeleton for the dashboard (Wave 9I). The page does an auth check,
// a history purge/query, and a rate-limit read before rendering, so a loading.tsx
// keeps the shell visible during that work. Mirrors the sidebar + main layout.
export default function Loading() {
  return (
    <div className="flex" aria-busy="true" aria-live="polite">
      <aside
        className="hidden w-60 flex-col gap-7 px-4 py-7 lg:flex"
        style={{ borderRight: "1px solid var(--line)", minHeight: "calc(100vh - 64px)" }}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="pp-skeleton h-7 w-full rounded" />
        ))}
      </aside>
      <main className="flex-1 px-5 pt-9 pb-20 sm:px-10">
        <div className="pp-skeleton mb-3 h-9 w-56 rounded" />
        <div className="pp-skeleton mb-10 h-5 w-72 rounded" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="pp-quick h-28" />
          ))}
        </div>
        <div className="pp-skeleton mt-12 h-6 w-40 rounded" />
        <div className="mt-4 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="pp-filerow">
              <div className="pp-skeleton size-9 rounded" />
              <div className="flex-1">
                <div className="pp-skeleton mb-1.5 h-4 w-40 rounded" />
                <div className="pp-skeleton h-3 w-24 rounded" />
              </div>
            </div>
          ))}
        </div>
      </main>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
