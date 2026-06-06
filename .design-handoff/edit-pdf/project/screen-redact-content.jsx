// PlinyPDF — Redact Content (black boxes, search & redact, pattern auto-detect)

const REDACT_PATTERNS = [
  { id: 'email', label: 'Email', icon: 'IconMail', count: 4 },
  { id: 'phone', label: 'Phone', icon: 'IconBell', count: 2 },
  { id: 'card', label: 'Credit card', icon: 'IconFile', count: 1 },
  { id: 'ssn', label: 'SSN', icon: 'IconShield', count: 3 },
];

const RedactToolbarBtn = ({ icon: Ic, label, active, onClick }) => (
  <button onClick={onClick} title={label} style={{
    display: 'flex', alignItems: 'center', gap: 7, padding: '8px 14px', borderRadius: 9, cursor: 'pointer', fontFamily: 'inherit',
    background: active ? 'rgba(107,92,231,0.18)' : 'transparent',
    border: active ? '1px solid rgba(107,92,231,0.4)' : '1px solid transparent',
    color: active ? '#BFB5FF' : 'var(--text)', fontSize: 13, fontWeight: 500,
  }} className="pp-related">
    <Ic size={15} sw={1.7} /> {label}
  </button>
);

const RedactBox = ({ style, color = '#0F0F0F', selected, label }) => (
  <div style={{
    position: 'absolute', ...style,
    background: color,
    borderRadius: 1,
    boxShadow: selected ? '0 0 0 2px var(--indigo), 0 0 0 4px rgba(107,92,231,0.3)' : 'none',
  }}>
    {selected && ['tl', 'tr', 'bl', 'br'].map(k => {
      const m = { tl: { top: -4, left: -4 }, tr: { top: -4, right: -4 }, bl: { bottom: -4, left: -4 }, br: { bottom: -4, right: -4 } };
      return <div key={k} style={{ position: 'absolute', ...m[k], width: 8, height: 8, borderRadius: 2, background: 'white', border: '1.5px solid var(--indigo)' }} />;
    })}
    {label && (
      <span className="pp-mono" style={{ position: 'absolute', top: -18, left: 0, fontSize: 9, color: '#F87171', whiteSpace: 'nowrap' }}>{label}</span>
    )}
  </div>
);

const RedactTool = () => {
  const [tool, setTool] = React.useState('redact');
  const [color, setColor] = React.useState('#0F0F0F');
  const [patterns, setPatterns] = React.useState({ email: true, ssn: true });

  return (
    <section style={{ padding: '32px 40px 56px' }}>
      <div style={{ maxWidth: 1360, margin: '0 auto' }}>
        <Breadcrumb items={['Home', 'Tools', 'Redact Content']} />
        <ToolHeader icon="IconWhiteout" title="Redact Content" mode="local"
          subtitle="Permanently remove sensitive content — draw boxes or auto-detect patterns." />

        {/* WARNING banner */}
        <div style={{
          marginTop: 16, padding: '12px 18px',
          background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.3)', borderRadius: 12,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(244,63,94,0.16)', color: '#F87171', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <IconAlert size={17} sw={1.8} />
          </div>
          <div style={{ flex: 1, fontSize: 13.5, color: 'var(--text)' }}>
            <strong style={{ color: '#FCA5A5', fontWeight: 600 }}>Redactions are permanent.</strong>{' '}
            <span style={{ color: 'var(--text-2)' }}>The underlying text and images are removed from the file — not just hidden. This cannot be undone after download.</span>
          </div>
        </div>

        <div style={{
          marginTop: 20, background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 18, overflow: 'hidden',
          display: 'grid', gridTemplateColumns: '1fr 320px',
        }}>
          {/* Canvas column */}
          <div style={{ borderRight: '1px solid var(--line)' }}>
            {/* toolbar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '12px 18px', background: 'var(--card)', borderBottom: '1px solid var(--line)' }}>
              <RedactToolbarBtn icon={IconWhiteout} label="Redact" active={tool === 'redact'} onClick={() => setTool('redact')} />
              <RedactToolbarBtn icon={IconEraser} label="Erase" active={tool === 'erase'} onClick={() => setTool('erase')} />
              <RedactToolbarBtn icon={IconCursor} label="Select" active={tool === 'select'} onClick={() => setTool('select')} />
              <div style={{ width: 1, height: 22, background: 'var(--line)', margin: '0 4px' }} />
              <span style={{ fontSize: 12, color: 'var(--text-3)', marginRight: 4 }}>Fill</span>
              {[['#0F0F0F', 'Black'], ['#FFFFFF', 'White'], ['#6B7280', 'Gray']].map(([c, name]) => (
                <button key={c} onClick={() => setColor(c)} title={name} style={{
                  width: 26, height: 26, borderRadius: 7, background: c, cursor: 'pointer',
                  border: c === '#FFFFFF' ? '1px solid var(--line-2)' : 0,
                  boxShadow: color === c ? `0 0 0 2px var(--card), 0 0 0 4px var(--indigo)` : 'inset 0 0 0 1px rgba(255,255,255,0.08)',
                }} />
              ))}
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="pp-mono" style={{ fontSize: 11.5, color: 'var(--text-3)' }}>11 redactions</span>
                <div style={{ width: 1, height: 22, background: 'var(--line)', margin: '0 4px' }} />
                <button style={{ background: 'transparent', border: '1px solid var(--line)', borderRadius: 7, padding: 6, color: 'var(--text-2)', cursor: 'pointer', display: 'flex' }}><IconUndo size={14} /></button>
                <button style={{ background: 'transparent', border: '1px solid var(--line)', borderRadius: 7, padding: 6, color: 'var(--text-2)', cursor: 'pointer', display: 'flex' }}><IconRedo size={14} /></button>
              </div>
            </div>

            {/* canvas */}
            <div style={{ padding: 40, display: 'flex', justifyContent: 'center', background: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.012) 0 1px, transparent 1px 14px)' }}>
              <div style={{ position: 'relative' }}>
                <DocPage variant="financial" width={520} height={680} pageLabel="3 / 24" />
                {/* redaction boxes over financial doc */}
                <RedactBox style={{ top: 56, left: 56, width: 168, height: 13 }} label="email" />
                <RedactBox style={{ top: 132, left: 56, width: 120, height: 22 }} selected color="#0F0F0F" />
                <RedactBox style={{ top: 246, right: 64, width: 96, height: 13 }} label="SSN" />
                <RedactBox style={{ top: 286, right: 64, width: 96, height: 13 }} label="SSN" />
                <RedactBox style={{ bottom: 150, left: 56, width: 200, height: 13 }} color="#6B7280" />
                {/* cursor drawing hint */}
                <div style={{ position: 'absolute', top: 200, left: 200, width: 130, height: 24, border: '1.5px solid var(--indigo)', borderRadius: 1, background: 'rgba(107,92,231,0.12)' }}>
                  <span className="pp-mono" style={{ position: 'absolute', bottom: -18, left: 0, fontSize: 9.5, color: '#BFB5FF' }}>drawing…</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 22 }}>
            {/* Search & redact */}
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Search &amp; redact</div>
              <div style={{ position: 'relative', marginBottom: 10 }}>
                <IconSearch size={14} color="var(--text-3)" style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)' }} />
                <input className="pp-input" defaultValue="acme-corp.com" style={{ paddingLeft: 34 }} placeholder="Find text to redact…" />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(107,92,231,0.08)', border: '1px solid rgba(107,92,231,0.2)', borderRadius: 9 }}>
                <span style={{ fontSize: 12.5, color: 'var(--text-2)' }}><span className="pp-mono" style={{ color: '#BFB5FF' }}>7</span> matches found</span>
                <button className="pp-btn" style={{ padding: '5px 11px', fontSize: 12 }}>Redact all</button>
              </div>
            </div>

            <hr className="pp-hr" />

            {/* Common patterns */}
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Auto-detect patterns</div>
              <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 12, lineHeight: 1.5 }}>
                We scanned the document and found sensitive data. Toggle to redact.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {REDACT_PATTERNS.map(p => {
                  const Ic = window[p.icon];
                  const on = patterns[p.id];
                  return (
                    <div key={p.id} style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10,
                      background: on ? 'rgba(107,92,231,0.08)' : 'var(--card)',
                      border: `1px solid ${on ? 'rgba(107,92,231,0.24)' : 'var(--line)'}`,
                    }}>
                      <div style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--line)', color: on ? '#BFB5FF' : 'var(--text-3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Ic size={14} sw={1.7} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{p.label}</div>
                        <div className="pp-mono" style={{ fontSize: 10.5, color: 'var(--text-3)' }}>{p.count} found</div>
                      </div>
                      <Toggle on={on} onChange={v => setPatterns(s => ({ ...s, [p.id]: v }))} />
                    </div>
                  );
                })}
              </div>
            </div>

            <hr className="pp-hr" />
            <div style={{ fontSize: 11.5, color: 'var(--text-3)', display: 'flex', gap: 8, lineHeight: 1.5 }}>
              <IconShield size={14} color="#34D399" sw={1.7} style={{ flexShrink: 0, marginTop: 1 }} />
              All detection runs in your browser. The document is never uploaded.
            </div>
          </div>
        </div>

        {/* bottom action */}
        <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 13, color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <IconAlert size={15} color="#F87171" sw={1.8} />
            Review every box — once downloaded, content is gone for good.
          </div>
          <button className="pp-btn pp-btn-lg" style={{ background: '#F43F5E', boxShadow: '0 8px 20px -10px rgba(244,63,94,0.6)' }}>
            <IconWhiteout size={15} sw={1.7} /> Apply redactions &amp; download
          </button>
        </div>
      </div>
    </section>
  );
};

const RedactEmpty = () => (
  <section style={{ padding: '32px 40px 80px' }}>
    <div style={{ maxWidth: 1360, margin: '0 auto' }}>
      <Breadcrumb items={['Home', 'Tools', 'Redact Content']} />
      <ToolHeader icon="IconWhiteout" title="Redact Content" mode="local"
        subtitle="Permanently remove sensitive content — draw boxes or auto-detect patterns." />
      <div style={{
        marginTop: 16, padding: '12px 18px',
        background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.3)', borderRadius: 12,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(244,63,94,0.16)', color: '#F87171', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <IconAlert size={17} sw={1.8} />
        </div>
        <div style={{ fontSize: 13.5, color: 'var(--text-2)' }}>
          <strong style={{ color: '#FCA5A5', fontWeight: 600 }}>Redactions are permanent.</strong> Underlying content is removed from the file, not just hidden.
        </div>
      </div>
      <div style={{ marginTop: 16, background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 18 }}>
        <EmptyDrop icon="IconWhiteout" title="Drop a PDF to redact"
          sub="Draw black boxes over sensitive content, or let us auto-detect emails, phone numbers, and IDs."
          note="Detection & redaction run locally · nothing is uploaded" minHeight={480} />
      </div>
    </div>
  </section>
);

const RedactMobile = () => (
  <MobileShell height={1200}>
    <section style={{ padding: '18px 20px 100px' }}>
      <Breadcrumb items={['Tools', 'Redact']} />
      <h1 style={{ fontSize: 24, letterSpacing: '-0.025em', marginBottom: 4 }}>Redact Content</h1>
      <p style={{ fontSize: 12.5, color: 'var(--text-2)', marginBottom: 14 }}>Draw boxes · auto-detect.</p>
      <PrivacyBadge mode="local" big />

      <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.3)', borderRadius: 10, fontSize: 12, color: 'var(--text-2)', display: 'flex', gap: 8, alignItems: 'center' }}>
        <IconAlert size={15} color="#F87171" sw={1.8} style={{ flexShrink: 0 }} />
        <span><strong style={{ color: '#FCA5A5' }}>Permanent</strong> — content is removed, not hidden.</span>
      </div>

      {/* toolbar */}
      <div style={{ marginTop: 14, display: 'flex', gap: 6 }}>
        <RedactToolbarBtn icon={IconWhiteout} label="Redact" active onClick={() => {}} />
        <RedactToolbarBtn icon={IconEraser} label="Erase" onClick={() => {}} />
        <RedactToolbarBtn icon={IconCursor} label="Select" onClick={() => {}} />
      </div>

      <div style={{ marginTop: 14, background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 14, padding: 16, display: 'flex', justifyContent: 'center' }}>
        <div style={{ position: 'relative' }}>
          <DocPage variant="financial" width={300} height={390} scale={0.6} pageLabel="3 / 24" />
          <RedactBox style={{ top: 34, left: 34, width: 100, height: 9 }} />
          <RedactBox style={{ top: 78, left: 34, width: 72, height: 13 }} selected />
          <RedactBox style={{ top: 150, right: 38, width: 58, height: 9 }} />
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Auto-detected</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {REDACT_PATTERNS.map(p => (
            <span key={p.id} className="pp-badge" style={{ padding: '6px 12px', fontSize: 12.5 }}>
              {p.label} <span className="pp-mono" style={{ color: '#BFB5FF' }}>{p.count}</span>
            </span>
          ))}
        </div>
      </div>
    </section>
    <MobileCTA label="Apply redactions & download" accent="#F43F5E" note="Permanent · processed in your browser" />
  </MobileShell>
);

const RedactPage = () => <ToolPage width={1440}><RedactTool /></ToolPage>;
const RedactEmptyPage = () => <ToolPage><RedactEmpty /></ToolPage>;
const RedactLightPage = () => <ToolPage theme="light" width={1440}><RedactTool /></ToolPage>;

Object.assign(window, { RedactPage, RedactEmptyPage, RedactLightPage, RedactMobile });
