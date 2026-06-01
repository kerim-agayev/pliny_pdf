// PlinyPDF — Add Page Numbers (live preview, 9-position grid)

const PAGENUM_FORMATS = [
  { id: 'plain', label: '1, 2, 3', render: (n) => `${n}` },
  { id: 'of', label: 'Page 1 of 24', render: (n, t) => `Page ${n} of ${t}` },
  { id: 'short', label: '1 of 24', render: (n, t) => `${n} of ${t}` },
  { id: 'roman', label: 'i, ii, iii', render: (n) => ['i','ii','iii','iv','v','vi','vii','viii','ix','x'][n-1] || `${n}` },
  { id: 'alpha', label: 'A, B, C', render: (n) => String.fromCharCode(64 + n) },
];

const POSITIONS = [
  ['TL','top','left'], ['TC','top','center'], ['TR','top','right'],
  ['ML','middle','left'], ['MC','middle','center'], ['MR','middle','right'],
  ['BL','bottom','left'], ['BC','bottom','center'], ['BR','bottom','right'],
];

const PositionGrid = ({ value, onChange }) => (
  <div style={{
    display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6,
    width: 132, aspectRatio: '1 / 1.3',
  }}>
    {POSITIONS.map(([id, v, h]) => {
      const active = value === id;
      return (
        <button key={id} onClick={() => onChange(id)} title={id} style={{
          borderRadius: 7, cursor: 'pointer',
          background: active ? 'rgba(107,92,231,0.18)' : 'var(--bg-2)',
          border: active ? '1px solid var(--indigo)' : '1px solid var(--line)',
          display: 'flex',
          alignItems: v === 'top' ? 'flex-start' : v === 'bottom' ? 'flex-end' : 'center',
          justifyContent: h === 'left' ? 'flex-start' : h === 'right' ? 'flex-end' : 'center',
          padding: 5,
          transition: 'all 0.12s',
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: active ? '#BFB5FF' : 'var(--text-3)',
            boxShadow: active ? '0 0 6px #BFB5FF' : 'none',
          }} />
        </button>
      );
    })}
  </div>
);

const Dropdown = ({ value, options, onChange }) => {
  const [open, setOpen] = React.useState(false);
  const cur = options.find(o => o.id === value);
  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(!open)} className="pp-input" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        cursor: 'pointer', textAlign: 'left',
      }}>
        <span>{cur?.label}</span>
        <IconChevron size={14} color="var(--text-3)" style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }} />
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, zIndex: 30,
          background: 'var(--card-hi)', border: '1px solid var(--line-2)', borderRadius: 10,
          padding: 4, boxShadow: 'var(--shadow-md)',
        }}>
          {options.map(o => (
            <button key={o.id} onClick={() => { onChange(o.id); setOpen(false); }} style={{
              width: '100%', textAlign: 'left', padding: '8px 10px', borderRadius: 7,
              background: o.id === value ? 'rgba(107,92,231,0.14)' : 'transparent',
              border: 0, color: o.id === value ? '#BFB5FF' : 'var(--text)', fontSize: 13.5, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: 'inherit',
            }}>
              {o.label}
              {o.id === value && <IconCheck size={13} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const Toggle = ({ on, onChange }) => (
  <button onClick={() => onChange(!on)} style={{
    width: 40, height: 24, borderRadius: 999, border: 0, cursor: 'pointer', padding: 3,
    background: on ? 'var(--indigo)' : 'var(--line-2)',
    display: 'flex', justifyContent: on ? 'flex-end' : 'flex-start',
    transition: 'background 0.18s',
  }}>
    <span style={{ width: 18, height: 18, borderRadius: '50%', background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.3)', transition: 'all 0.18s' }} />
  </button>
);

const PageNumColorSwatches = ['#0F0F0F', '#6B7280', '#6B5CE7', '#F43F5E', '#3B82F6', '#FFFFFF'];

const PageNumPreview = ({ cfg }) => {
  const fmt = PAGENUM_FORMATS.find(f => f.id === cfg.format);
  const pos = POSITIONS.find(p => p[0] === cfg.position);
  const [, v, h] = pos;
  const shownNum = fmt.render(cfg.previewPage, cfg.total);
  const isFirstSkipped = cfg.skipFirst && cfg.previewPage === 1;
  const m = cfg.margin;
  const align = {
    position: 'absolute',
    [v === 'top' ? 'top' : v === 'bottom' ? 'bottom' : 'top']: v === 'middle' ? '50%' : m,
    ...(h === 'left' ? { left: m } : h === 'right' ? { right: m } : { left: '50%' }),
    transform: `${h === 'center' ? 'translateX(-50%)' : ''} ${v === 'middle' ? 'translateY(-50%)' : ''}`.trim() || 'none',
    color: cfg.color,
    fontFamily: 'var(--font-mono)',
    fontSize: cfg.size,
    fontWeight: 500,
    textShadow: cfg.color === '#FFFFFF' ? '0 1px 2px rgba(0,0,0,0.4)' : 'none',
  };
  return (
    <DocPage variant="report" width={480} height={624} pageLabel="" footerNumber={false}>
      {!isFirstSkipped && (
        <div style={align}>
          {shownNum}
          <span style={{
            position: 'absolute', inset: -6, borderRadius: 4,
            border: '1px dashed rgba(107,92,231,0.6)', pointerEvents: 'none',
          }} />
        </div>
      )}
      {isFirstSkipped && (
        <div style={{
          position: 'absolute', bottom: m, left: '50%', transform: 'translateX(-50%)',
          fontSize: 10, color: '#C7C2BB', fontFamily: 'var(--font-mono)', fontStyle: 'italic',
        }}>(first page skipped)</div>
      )}
    </DocPage>
  );
};

const PageNumbersTool = () => {
  const [cfg, setCfg] = React.useState({
    position: 'BC', format: 'of', startPage: 1, startNum: 1,
    skipFirst: false, size: 11, color: '#0F0F0F', margin: 28,
    previewPage: 3, total: 24,
  });
  const set = (k, v) => setCfg(p => ({ ...p, [k]: v }));

  return (
    <section style={{ padding: '32px 40px 80px' }}>
      <div style={{ maxWidth: 1320, margin: '0 auto' }}>
        <Breadcrumb items={['Home', 'Tools', 'Add Page Numbers']} />
        <ToolHeader icon="IconType" title="Add Page Numbers" mode="local"
          subtitle="Number every page — choose format, position, and style with live preview." />

        <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 32, marginTop: 36 }}>
          {/* Settings */}
          <div className="pp-card" style={{ padding: 26, alignSelf: 'start' }}>
            <PanelTitle>Numbering settings</PanelTitle>

            <SettingsRow label="Position">
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <PositionGrid value={cfg.position} onChange={v => set('position', v)} />
                <div style={{ fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.6 }}>
                  Pick where the number sits on every page. Currently <span className="pp-mono" style={{ color: '#BFB5FF' }}>{cfg.position}</span>.
                </div>
              </div>
            </SettingsRow>

            <SettingsRow label="Format">
              <Dropdown value={cfg.format} options={PAGENUM_FORMATS} onChange={v => set('format', v)} />
            </SettingsRow>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <SettingsRow label="Start on page">
                <input className="pp-input" type="number" value={cfg.startPage} onChange={e => set('startPage', +e.target.value)} />
              </SettingsRow>
              <SettingsRow label="First number">
                <input className="pp-input" type="number" value={cfg.startNum} onChange={e => set('startNum', +e.target.value)} />
              </SettingsRow>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)', marginBottom: 22 }}>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 500 }}>Skip first page</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Useful for cover pages</div>
              </div>
              <Toggle on={cfg.skipFirst} onChange={v => set('skipFirst', v)} />
            </div>

            <SettingsRow label="Font size" value={`${cfg.size}pt`}>
              <input type="range" min="8" max="24" value={cfg.size} onChange={e => set('size', +e.target.value)} />
            </SettingsRow>

            <SettingsRow label="Color">
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {PageNumColorSwatches.map(c => (
                  <button key={c} onClick={() => set('color', c)} style={{
                    width: 30, height: 30, borderRadius: 8, background: c, border: c === '#FFFFFF' ? '1px solid var(--line-2)' : 0, cursor: 'pointer',
                    boxShadow: cfg.color === c ? `0 0 0 2px var(--card), 0 0 0 4px ${c === '#FFFFFF' ? 'var(--indigo)' : c}` : 'inset 0 0 0 1px rgba(255,255,255,0.08)',
                  }} />
                ))}
              </div>
            </SettingsRow>

            <SettingsRow label="Margin from edge" value={`${cfg.margin}px`}>
              <input type="range" min="10" max="50" value={cfg.margin} onChange={e => set('margin', +e.target.value)} />
            </SettingsRow>

            <button className="pp-btn pp-btn-lg" style={{ width: '100%', justifyContent: 'center', marginTop: 6 }}>
              <IconCheck size={15} sw={2} /> Apply to all 24 pages
            </button>
          </div>

          {/* Live preview */}
          <div style={{
            background: 'radial-gradient(70% 60% at 50% 30%, rgba(107,92,231,0.08), rgba(107,92,231,0) 70%), var(--bg-2)',
            border: '1px solid var(--line)', borderRadius: 16, padding: 36,
            display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', minHeight: 720,
          }}>
            <div style={{ position: 'absolute', top: 16, left: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="pp-mono" style={{ fontSize: 10.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-3)' }}>Live preview</span>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34D399', boxShadow: '0 0 8px #34D399', animation: 'pppulse 1.6s ease-in-out infinite' }} />
            </div>
            <div style={{ marginTop: 36 }}>
              <PageNumPreview cfg={cfg} />
            </div>
            {/* Page navigator */}
            <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 14 }}>
              <button onClick={() => set('previewPage', Math.max(1, cfg.previewPage - 1))} style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 8, padding: 8, color: 'var(--text-2)', cursor: 'pointer', display: 'flex' }}>
                <IconChevron size={14} style={{ transform: 'rotate(180deg)' }} />
              </button>
              <span className="pp-mono" style={{ fontSize: 13, color: 'var(--text)' }}>
                Page {cfg.previewPage} <span style={{ color: 'var(--text-3)' }}>/ {cfg.total}</span>
              </span>
              <button onClick={() => set('previewPage', Math.min(cfg.total, cfg.previewPage + 1))} style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 8, padding: 8, color: 'var(--text-2)', cursor: 'pointer', display: 'flex' }}>
                <IconChevron size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const PageNumbersEmpty = () => (
  <section style={{ padding: '32px 40px 80px' }}>
    <div style={{ maxWidth: 1320, margin: '0 auto' }}>
      <Breadcrumb items={['Home', 'Tools', 'Add Page Numbers']} />
      <ToolHeader icon="IconType" title="Add Page Numbers" mode="local"
        subtitle="Number every page — choose format, position, and style with live preview." />
      <div style={{ marginTop: 24, background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 18 }}>
        <EmptyDrop icon="IconType" title="Drop a PDF to number its pages"
          sub="Pick a format and position, preview live, then stamp every page in your browser."
          note="Page numbers are added locally · nothing is uploaded" minHeight={520} />
      </div>
    </div>
  </section>
);

// Mobile
const PageNumbersMobile = () => {
  const [cfg, setCfg] = React.useState({ position: 'BC', format: 'of', size: 11, color: '#0F0F0F', margin: 24, skipFirst: false, previewPage: 3, total: 24 });
  const set = (k, v) => setCfg(p => ({ ...p, [k]: v }));
  return (
    <MobileShell height={1240}>
      <section style={{ padding: '18px 20px 100px' }}>
        <Breadcrumb items={['Tools', 'Page Numbers']} />
        <h1 style={{ fontSize: 24, letterSpacing: '-0.025em', marginBottom: 4 }}>Add Page Numbers</h1>
        <p style={{ fontSize: 12.5, color: 'var(--text-2)', marginBottom: 14 }}>Format, position, live preview.</p>
        <PrivacyBadge mode="local" big />

        {/* preview first on mobile */}
        <div style={{ marginTop: 18, background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 14, padding: 18, display: 'flex', justifyContent: 'center' }}>
          <div style={{ transform: 'scale(0.62)', transformOrigin: 'top center', height: 624 * 0.62 }}>
            <PageNumPreview cfg={{ ...cfg, total: 24 }} />
          </div>
        </div>

        <div style={{ marginTop: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 10 }}>Position</div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <PositionGrid value={cfg.position} onChange={v => set('position', v)} />
          </div>
        </div>

        <div style={{ marginTop: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8 }}>Format</div>
          <Dropdown value={cfg.format} options={PAGENUM_FORMATS} onChange={v => set('format', v)} />
        </div>

        <div style={{ marginTop: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 500 }}>Font size</span>
            <span className="pp-mono" style={{ fontSize: 11.5, color: 'var(--text-2)' }}>{cfg.size}pt</span>
          </div>
          <input type="range" min="8" max="24" value={cfg.size} onChange={e => set('size', +e.target.value)} />
        </div>
      </section>
      <MobileCTA label="Apply to all 24 pages" />
    </MobileShell>
  );
};

const PageNumbersPage = () => <ToolPage><PageNumbersTool /></ToolPage>;
const PageNumbersEmptyPage = () => <ToolPage><PageNumbersEmpty /></ToolPage>;
const PageNumbersLightPage = () => <ToolPage theme="light"><PageNumbersTool /></ToolPage>;

Object.assign(window, { PageNumbersPage, PageNumbersEmptyPage, PageNumbersLightPage, PageNumbersMobile, Toggle, Dropdown, PositionGrid });
