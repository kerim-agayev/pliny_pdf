// PlinyPDF — Header & Footer (text bands top + bottom, token placeholders)

const HF_TOKENS = [
  { t: '{page}', d: 'Current page' },
  { t: '{total}', d: 'Total pages' },
  { t: '{date}', d: "Today's date" },
  { t: '{filename}', d: 'File name' },
];

const TokenChips = () => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
    {HF_TOKENS.map(tk => (
      <span key={tk.t} title={tk.d} className="pp-mono" style={{
        fontSize: 11, padding: '3px 8px', borderRadius: 6, cursor: 'pointer',
        background: 'rgba(107,92,231,0.1)', border: '1px solid rgba(107,92,231,0.24)', color: '#BFB5FF',
      }}>{tk.t}</span>
    ))}
  </div>
);

const renderHF = (text) => text
  .replace('{page}', '12').replace('{total}', '24')
  .replace('{date}', 'Jun 1, 2026').replace('{filename}', 'msa-acme-2026.pdf');

const HFBandConfig = ({ kind, cfg, set }) => (
  <div style={{ marginBottom: 8 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
      <div style={{ width: 24, height: 24, borderRadius: 6, background: 'rgba(107,92,231,0.14)', color: '#BFB5FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {kind === 'header' ? <IconChevron size={13} style={{ transform: 'rotate(-90deg)' }} /> : <IconChevron size={13} style={{ transform: 'rotate(90deg)' }} />}
      </div>
      <h4 style={{ fontSize: 15, letterSpacing: '-0.01em' }}>{kind === 'header' ? 'Header' : 'Footer'}</h4>
    </div>
    <input className="pp-input" value={cfg.text} onChange={e => set('text', e.target.value)} placeholder={kind === 'header' ? 'e.g. Confidential — {filename}' : 'e.g. Page {page} of {total}'} />
    <TokenChips />
    <div style={{ marginTop: 14 }}>
      <Segmented columns={3} value={cfg.align} onChange={v => set('align', v)} options={[
        { value: 'left', label: 'Left' },
        { value: 'center', label: 'Center' },
        { value: 'right', label: 'Right' },
      ]} />
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 14, marginTop: 14, alignItems: 'center' }}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 12.5, color: 'var(--text-2)' }}>Size</span>
          <span className="pp-mono" style={{ fontSize: 11, color: 'var(--text-2)' }}>{cfg.size}pt</span>
        </div>
        <input type="range" min="8" max="18" value={cfg.size} onChange={e => set('size', +e.target.value)} />
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        {['#0F0F0F', '#6B7280', '#6B5CE7', '#F43F5E'].map(c => (
          <button key={c} onClick={() => set('color', c)} style={{
            width: 26, height: 26, borderRadius: 7, background: c, border: 0, cursor: 'pointer',
            boxShadow: cfg.color === c ? `0 0 0 2px var(--card), 0 0 0 4px ${c}` : 'inset 0 0 0 1px rgba(255,255,255,0.08)',
          }} />
        ))}
      </div>
    </div>
  </div>
);

const HFBand = ({ cfg, where }) => {
  if (!cfg.text) return null;
  const justify = cfg.align === 'left' ? 'flex-start' : cfg.align === 'right' ? 'flex-end' : 'center';
  return (
    <div style={{
      position: 'absolute', left: 36, right: 36,
      [where]: 22,
      display: 'flex', justifyContent: justify,
    }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: cfg.size, color: cfg.color, position: 'relative' }}>
        {renderHF(cfg.text)}
        <span style={{ position: 'absolute', inset: '-4px -6px', border: '1px dashed rgba(107,92,231,0.5)', borderRadius: 4, pointerEvents: 'none' }} />
      </span>
    </div>
  );
};

const HeaderFooterTool = () => {
  const [header, setHeader] = React.useState({ text: 'CONFIDENTIAL — {filename}', align: 'left', size: 10, color: '#F43F5E' });
  const [footer, setFooter] = React.useState({ text: 'Page {page} of {total}', align: 'center', size: 10, color: '#6B7280' });
  const setH = (k, v) => setHeader(p => ({ ...p, [k]: v }));
  const setF = (k, v) => setFooter(p => ({ ...p, [k]: v }));

  return (
    <section style={{ padding: '32px 40px 80px' }}>
      <div style={{ maxWidth: 1320, margin: '0 auto' }}>
        <Breadcrumb items={['Home', 'Tools', 'Header & Footer']} />
        <ToolHeader icon="IconUnderline" title="Header & Footer" mode="local"
          subtitle="Add running text to the top and bottom of every page, with dynamic tokens." />

        <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: 32, marginTop: 36 }}>
          {/* Settings */}
          <div className="pp-card" style={{ padding: 26, alignSelf: 'start' }}>
            <PanelTitle>Header &amp; footer</PanelTitle>
            <HFBandConfig kind="header" cfg={header} set={setH} />
            <hr className="pp-hr" style={{ margin: '20px 0' }} />
            <HFBandConfig kind="footer" cfg={footer} set={setF} />
            <hr className="pp-hr" style={{ margin: '20px 0' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 500 }}>Skip first page</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Leave cover untouched</div>
              </div>
              <Toggle on={false} onChange={() => {}} />
            </div>
            <button className="pp-btn pp-btn-lg" style={{ width: '100%', justifyContent: 'center' }}>
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
            <div style={{ marginTop: 36, position: 'relative' }}>
              <DocPage variant="legal" width={500} height={650} pageLabel="" footerNumber={false}>
                <HFBand cfg={header} where="top" />
                <HFBand cfg={footer} where="bottom" />
              </DocPage>
              {/* band guide lines */}
              <div style={{ position: 'absolute', top: '7.5%', left: 0, right: 0, borderTop: '1px dashed rgba(107,92,231,0.25)' }} />
              <div style={{ position: 'absolute', bottom: '7.5%', left: 0, right: 0, borderTop: '1px dashed rgba(107,92,231,0.25)' }} />
            </div>
            <div style={{ marginTop: 22, display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: 'var(--text-3)' }}>
              <span className="pp-mono" style={{ padding: '2px 8px', background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 5 }}>{'{page}'}</span>
              and other tokens resolve per page
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const HeaderFooterEmpty = () => (
  <section style={{ padding: '32px 40px 80px' }}>
    <div style={{ maxWidth: 1320, margin: '0 auto' }}>
      <Breadcrumb items={['Home', 'Tools', 'Header & Footer']} />
      <ToolHeader icon="IconUnderline" title="Header & Footer" mode="local"
        subtitle="Add running text to the top and bottom of every page, with dynamic tokens." />
      <div style={{ marginTop: 24, background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 18 }}>
        <EmptyDrop icon="IconUnderline" title="Drop a PDF to add a header or footer"
          sub="Use tokens like {page}, {total}, {date}, and {filename} that resolve automatically per page."
          note="Bands are stamped locally · nothing is uploaded" minHeight={520} />
      </div>
    </div>
  </section>
);

const HeaderFooterMobile = () => {
  const header = { text: 'CONFIDENTIAL — {filename}', align: 'left', size: 9, color: '#F43F5E' };
  const footer = { text: 'Page {page} of {total}', align: 'center', size: 9, color: '#6B7280' };
  return (
    <MobileShell height={1280}>
      <section style={{ padding: '18px 20px 100px' }}>
        <Breadcrumb items={['Tools', 'Header & Footer']} />
        <h1 style={{ fontSize: 24, letterSpacing: '-0.025em', marginBottom: 4 }}>Header &amp; Footer</h1>
        <p style={{ fontSize: 12.5, color: 'var(--text-2)', marginBottom: 14 }}>Tokens resolve per page.</p>
        <PrivacyBadge mode="local" big />

        <div style={{ marginTop: 16, background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 14, padding: 18, display: 'flex', justifyContent: 'center' }}>
          <div style={{ position: 'relative' }}>
            <DocPage variant="legal" width={290} height={377} scale={0.6} pageLabel="" footerNumber={false}>
              <HFBand cfg={header} where="top" />
              <HFBand cfg={footer} where="bottom" />
            </DocPage>
          </div>
        </div>

        <div style={{ marginTop: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Header text</div>
          <input className="pp-input" defaultValue="CONFIDENTIAL — {filename}" />
          <TokenChips />
        </div>
        <div style={{ marginTop: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Footer text</div>
          <input className="pp-input" defaultValue="Page {page} of {total}" />
        </div>
      </section>
      <MobileCTA label="Apply to all 24 pages" />
    </MobileShell>
  );
};

const HeaderFooterPage = () => <ToolPage><HeaderFooterTool /></ToolPage>;
const HeaderFooterEmptyPage = () => <ToolPage><HeaderFooterEmpty /></ToolPage>;
const HeaderFooterLightPage = () => <ToolPage theme="light"><HeaderFooterTool /></ToolPage>;

Object.assign(window, { HeaderFooterPage, HeaderFooterEmptyPage, HeaderFooterLightPage, HeaderFooterMobile });
