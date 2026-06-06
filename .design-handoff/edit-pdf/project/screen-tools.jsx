// PlinyPDF — All Tools page

const ToolsCatalog = () => {
  const [filter, setFilter] = React.useState('All');
  const filtered = filter === 'All' ? TOOLS : TOOLS.filter(t => t.cat === filter);

  return (
    <section style={{ padding: '64px 40px 120px' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <div className="pp-mono" style={{ fontSize: 11.5, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#BFB5FF', marginBottom: 14 }}>
          Tools · 11
        </div>
        <h1 style={{ fontSize: 56, letterSpacing: '-0.03em', marginBottom: 16 }}>
          All PDF tools.
        </h1>
        <p style={{ fontSize: 18, color: 'var(--text-2)', maxWidth: 580, marginBottom: 40 }}>
          Local-first by default. Cloud only where it materially improves the result — and then with the shortest retention we can offer.
        </p>

        {/* legend + filter */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
          <div style={{
            display: 'flex', gap: 4, padding: 4,
            background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 999,
          }}>
            {CATEGORIES.map(c => {
              const active = filter === c;
              return (
                <button key={c} onClick={() => setFilter(c)} style={{
                  padding: '7px 14px', borderRadius: 999, fontSize: 13, fontWeight: 500,
                  border: 0, background: active ? 'rgba(255,255,255,0.08)' : 'transparent',
                  color: active ? 'var(--text)' : 'var(--text-2)',
                  transition: 'background 0.15s, color 0.15s',
                }}>{c}</button>
              );
            })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 13, color: 'var(--text-2)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span className="pp-dot" style={{ color: '#34D399' }} /> Local — runs in browser
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span className="pp-dot" style={{ color: '#60A5FA' }} /> Cloud — server-assisted
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {filtered.map(t => <ToolCard key={t.id} tool={t} dotted />)}
        </div>

        {/* Empty AI tab — show the upcoming */}
        {filter === 'AI' && (
          <div style={{
            marginTop: 24, padding: 36, textAlign: 'center',
            border: '1px dashed var(--line-2)', borderRadius: 16,
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12, margin: '0 auto 16px',
              background: 'rgba(107,92,231,0.14)', border: '1px solid rgba(107,92,231,0.3)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#BFB5FF',
            }}>
              <IconSparkle size={22} sw={1.7} />
            </div>
            <h3 style={{ fontSize: 20, marginBottom: 8 }}>AI Summary · coming this month</h3>
            <p style={{ fontSize: 14, color: 'var(--text-2)', maxWidth: 420, margin: '0 auto' }}>
              Outline, executive, and per-section summaries of any PDF up to 400 pages. Join the waitlist to get early access.
            </p>
          </div>
        )}

        {/* CTA strip */}
        <div style={{
          marginTop: 56, padding: '28px 32px',
          background: 'linear-gradient(90deg, rgba(107,92,231,0.12), rgba(107,92,231,0.04))',
          border: '1px solid rgba(107,92,231,0.24)',
          borderRadius: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24,
        }}>
          <div>
            <h3 style={{ fontSize: 20, marginBottom: 6 }}>Missing a tool?</h3>
            <p style={{ fontSize: 14, color: 'var(--text-2)' }}>Tell us what you'd use most and we'll ship it next sprint.</p>
          </div>
          <button className="pp-btn pp-btn-ghost">Request a tool</button>
        </div>
      </div>
    </section>
  );
};

const ToolsPage = () => (
  <div className="pp-board" style={{ width: 1440 }}>
    <Navbar active="tools" />
    <ToolsCatalog />
    <Footer />
  </div>
);

Object.assign(window, { ToolsPage });
