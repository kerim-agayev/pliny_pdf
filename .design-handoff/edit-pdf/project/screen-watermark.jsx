// PlinyPDF — Add Watermark tool with LIVE PREVIEW

const COLOR_SWATCHES = ['#F9FAFB', '#6B5CE7', '#F43F5E', '#10B981', '#F59E0B', '#3B82F6'];

const PdfPagePreview = ({ watermark }) => {
  const W = 480, H = 620;
  const { text, size, opacity, position, color, applyTo } = watermark;

  // position mapping
  let style = {
    position: 'absolute', color, opacity,
    fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: size,
    pointerEvents: 'none', whiteSpace: 'nowrap',
    textShadow: '0 1px 3px rgba(0,0,0,0.3)',
    letterSpacing: '-0.01em',
  };
  if (position === 'center') {
    Object.assign(style, { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' });
  } else if (position === 'diagonal') {
    Object.assign(style, { top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-32deg)' });
  } else if (position === 'top') {
    Object.assign(style, { top: 40, left: '50%', transform: 'translate(-50%, 0)' });
  } else if (position === 'bottom') {
    Object.assign(style, { bottom: 40, left: '50%', transform: 'translate(-50%, 0)' });
  }

  return (
    <div style={{
      position: 'relative', width: W, height: H,
      background: '#FAFAF9',
      borderRadius: 6,
      boxShadow: '0 30px 70px -20px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.08)',
      overflow: 'hidden',
      color: '#1f1f1f',
    }}>
      {/* Page content mock — looks like an actual document */}
      <div style={{ padding: '52px 56px', fontFamily: 'Georgia, serif' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: 14 }}>
          PlinyPDF · Annual Report 2025
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, lineHeight: 1.15, color: '#0F0F0F', marginBottom: 16, letterSpacing: '-0.02em', fontWeight: 700 }}>
          On the organization of knowledge in a privacy-first decade.
        </h1>
        <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 28 }}>
          By A. Marius · published 14 March 2026 · 12 min read
        </div>
        {/* paragraphs — rendered as fake text lines so preview reads as a doc */}
        {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
          <div key={i} style={{
            height: i === 4 ? 0 : 7, marginBottom: i === 4 ? 18 : 9,
            background: i === 4 ? 'transparent' : `linear-gradient(90deg, #1f1f1f 0%, #1f1f1f ${85 + (i % 3) * 4}%, transparent ${85 + (i % 3) * 4}%)`,
            opacity: 0.78, borderRadius: 1,
          }} />
        ))}
        <div style={{ marginTop: 20, padding: '14px 16px', background: '#F4F2EE', borderLeft: '3px solid #6B5CE7', borderRadius: 3 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: '#6B5CE7', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Key insight</div>
          <div style={{ height: 6, background: '#1f1f1f', opacity: 0.8, borderRadius: 1, marginBottom: 6 }} />
          <div style={{ height: 6, background: '#1f1f1f', opacity: 0.8, borderRadius: 1, width: '78%' }} />
        </div>
        {[0, 1, 2, 3].map(i => (
          <div key={'b' + i} style={{
            marginTop: i === 0 ? 18 : 9,
            height: 7,
            background: `linear-gradient(90deg, #1f1f1f 0%, #1f1f1f ${82 + i * 3}%, transparent ${82 + i * 3}%)`,
            opacity: 0.78, borderRadius: 1,
          }} />
        ))}
      </div>
      {/* Page number */}
      <div style={{
        position: 'absolute', bottom: 22, left: '50%', transform: 'translateX(-50%)',
        fontFamily: 'var(--font-mono)', fontSize: 9, color: '#9CA3AF',
      }}>1 / {applyTo === 'all' ? 24 : 6}</div>

      {/* Watermark — the actual layer */}
      <div style={style}>{text}</div>
    </div>
  );
};

const SettingsRow = ({ label, value, children }) => (
  <div style={{ marginBottom: 22 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
      <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{label}</label>
      {value !== undefined && (
        <span className="pp-mono" style={{ fontSize: 11.5, color: 'var(--text-2)', padding: '2px 8px', background: 'var(--bg-2)', borderRadius: 6, border: '1px solid var(--line)' }}>
          {value}
        </span>
      )}
    </div>
    {children}
  </div>
);

const Segmented = ({ options, value, onChange, columns }) => (
  <div style={{
    display: 'grid', gridTemplateColumns: `repeat(${columns || options.length}, 1fr)`, gap: 4, padding: 4,
    background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 10,
  }}>
    {options.map(opt => {
      const active = opt.value === value;
      return (
        <button key={opt.value} onClick={() => onChange(opt.value)} style={{
          padding: '8px', borderRadius: 7, fontSize: 12.5, fontWeight: 500,
          background: active ? 'rgba(107,92,231,0.18)' : 'transparent',
          color: active ? '#BFB5FF' : 'var(--text-2)',
          border: active ? '1px solid rgba(107,92,231,0.3)' : '1px solid transparent',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>
          {opt.icon && opt.icon}
          {opt.label}
        </button>
      );
    })}
  </div>
);

const PositionIcon = ({ kind, active }) => {
  const stroke = active ? '#BFB5FF' : 'var(--text-3)';
  return (
    <svg width="20" height="14" viewBox="0 0 20 14" fill="none">
      <rect x="1" y="1" width="18" height="12" rx="1.5" stroke={stroke} strokeWidth="1.2" />
      {kind === 'center' && <rect x="6" y="5.5" width="8" height="3" rx="0.5" fill={stroke} />}
      {kind === 'diagonal' && <line x1="3" y1="11" x2="17" y2="3" stroke={stroke} strokeWidth="1.2" strokeLinecap="round" />}
      {kind === 'top' && <rect x="6" y="2.5" width="8" height="2.5" rx="0.5" fill={stroke} />}
      {kind === 'bottom' && <rect x="6" y="9" width="8" height="2.5" rx="0.5" fill={stroke} />}
    </svg>
  );
};

const WatermarkTool = () => {
  const [w, setW] = React.useState({
    text: 'CONFIDENTIAL',
    size: 56,
    opacity: 0.32,
    position: 'diagonal',
    color: '#F43F5E',
    applyTo: 'all',
    pageRange: '1-12, 18',
  });
  const update = (k, v) => setW(prev => ({ ...prev, [k]: v }));

  return (
    <section style={{ padding: '32px 40px 80px' }}>
      <div style={{ maxWidth: 1320, margin: '0 auto' }}>
        <Breadcrumb items={['Home', 'Tools', 'Add Watermark']} />

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 13,
            background: 'rgba(244,114,182,0.14)', border: '1px solid rgba(244,114,182,0.3)',
            color: '#F472B6',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <IconWatermark size={24} sw={1.6} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <h1 style={{ fontSize: 34, letterSpacing: '-0.025em' }}>Add Watermark</h1>
              <span className="pp-badge" style={{ background: 'rgba(244,114,182,0.1)', borderColor: 'rgba(244,114,182,0.25)', color: '#F9A8D4' }}>
                <IconSparkle size={10} sw={2} /> Live preview
              </span>
            </div>
            <p style={{ fontSize: 14.5, color: 'var(--text-2)' }}>
              Stamp text on every page — watch it update as you type. No upload, no waiting.
            </p>
          </div>
          <PrivacyBadge mode="local" big />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 32, marginTop: 36 }}>
          {/* Settings panel */}
          <div className="pp-card" style={{ padding: 26, alignSelf: 'start' }}>
            <h3 style={{ fontSize: 14, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 22, fontFamily: 'var(--font-mono)', fontWeight: 500 }}>
              Watermark settings
            </h3>

            <SettingsRow label="Watermark text">
              <input className="pp-input" value={w.text} onChange={e => update('text', e.target.value)} />
            </SettingsRow>

            <SettingsRow label="Font size" value={`${w.size}px`}>
              <input type="range" min="12" max="120" value={w.size} onChange={e => update('size', Number(e.target.value))} />
            </SettingsRow>

            <SettingsRow label="Opacity" value={`${Math.round(w.opacity * 100)}%`}>
              <input type="range" min="0.05" max="1" step="0.01" value={w.opacity} onChange={e => update('opacity', Number(e.target.value))} />
            </SettingsRow>

            <SettingsRow label="Position">
              <Segmented
                columns={4}
                value={w.position}
                onChange={v => update('position', v)}
                options={[
                  { value: 'center', label: 'Center', icon: <PositionIcon kind="center" active={w.position === 'center'} /> },
                  { value: 'diagonal', label: 'Diagonal', icon: <PositionIcon kind="diagonal" active={w.position === 'diagonal'} /> },
                  { value: 'top', label: 'Top', icon: <PositionIcon kind="top" active={w.position === 'top'} /> },
                  { value: 'bottom', label: 'Bottom', icon: <PositionIcon kind="bottom" active={w.position === 'bottom'} /> },
                ]}
              />
            </SettingsRow>

            <SettingsRow label="Color">
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {COLOR_SWATCHES.map(c => (
                  <button key={c} onClick={() => update('color', c)} style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: c, border: 0, cursor: 'pointer',
                    boxShadow: w.color === c
                      ? `0 0 0 2px var(--bg), 0 0 0 4px ${c}`
                      : 'inset 0 0 0 1px rgba(255,255,255,0.1)',
                    transition: 'box-shadow 0.15s',
                  }} />
                ))}
                <div className="pp-mono" style={{ marginLeft: 4, fontSize: 11.5, color: 'var(--text-3)' }}>
                  {w.color.toUpperCase()}
                </div>
              </div>
            </SettingsRow>

            <SettingsRow label="Apply to pages">
              <Segmented
                columns={2}
                value={w.applyTo}
                onChange={v => update('applyTo', v)}
                options={[
                  { value: 'all', label: 'All pages' },
                  { value: 'custom', label: 'Custom range' },
                ]}
              />
              {w.applyTo === 'custom' && (
                <input className="pp-input" style={{ marginTop: 10 }} value={w.pageRange} onChange={e => update('pageRange', e.target.value)} placeholder="e.g. 1-3, 7, 9-12" />
              )}
            </SettingsRow>

            <hr className="pp-hr" style={{ margin: '24px 0 22px' }} />

            <button className="pp-btn pp-btn-lg" style={{ width: '100%', justifyContent: 'center' }}>
              <IconWatermark size={15} sw={1.7} /> Apply Watermark
            </button>
            <div style={{
              marginTop: 12, fontSize: 11.5, color: 'var(--text-3)', textAlign: 'center',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
              <span className="pp-dot" style={{ color: '#34D399' }} />
              Rendered locally — no upload happens
            </div>
          </div>

          {/* Live preview */}
          <div style={{
            background:
              'radial-gradient(70% 60% at 50% 30%, rgba(107,92,231,0.08), rgba(107,92,231,0) 70%), var(--bg-2)',
            border: '1px solid var(--line)',
            borderRadius: 16,
            padding: 36,
            minHeight: 680,
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            position: 'relative',
          }}>
            {/* preview chrome */}
            <div style={{
              position: 'absolute', top: 16, left: 20, right: 20,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              fontSize: 12, color: 'var(--text-3)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="pp-mono" style={{ fontSize: 10.5, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Live preview</span>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34D399', boxShadow: '0 0 8px #34D399', animation: 'pppulse 1.6s ease-in-out infinite' }} />
              </div>
              <div className="pp-mono" style={{ fontSize: 11 }}>
                annual-report-2025.pdf · page 1 of 24
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button style={{ background: 'transparent', border: '1px solid var(--line)', borderRadius: 6, padding: 4, color: 'var(--text-2)', cursor: 'pointer' }}>
                  <IconChevron size={12} style={{ transform: 'rotate(180deg)' }} />
                </button>
                <button style={{ background: 'transparent', border: '1px solid var(--line)', borderRadius: 6, padding: 4, color: 'var(--text-2)', cursor: 'pointer' }}>
                  <IconChevron size={12} />
                </button>
              </div>
            </div>
            <div style={{ marginTop: 40 }}>
              <PdfPagePreview watermark={w} />
            </div>
            <div style={{ marginTop: 24, display: 'flex', gap: 12, alignItems: 'center' }}>
              <button className="pp-btn pp-btn-ghost" style={{ padding: '8px 14px', fontSize: 13 }}>
                <IconImage size={14} /> Use image instead
              </button>
              <button className="pp-btn pp-btn-ghost" style={{ padding: '8px 14px', fontSize: 13 }}>
                <IconFolder size={14} /> Save as preset
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const WatermarkPage = () => (
  <div className="pp-board" style={{ width: 1440 }}>
    <Navbar active="tools" />
    <WatermarkTool />
    <Footer />
  </div>
);

Object.assign(window, { WatermarkPage });
