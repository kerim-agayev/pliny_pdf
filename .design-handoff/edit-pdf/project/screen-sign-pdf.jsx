// PlinyPDF — Sign PDF (signature pad: draw / type / upload, then place)

// A handwritten-looking signature path (the "drawn" signature)
const SignatureGlyph = ({ color = '#1E3A8A', w = 220, strokeW = 2.5 }) => (
  <svg width={w} height={w * 0.42} viewBox="0 0 220 92" fill="none" style={{ display: 'block' }}>
    <path d="M8 64 C 20 30, 30 28, 34 52 C 37 70, 30 74, 26 66 C 22 58, 34 44, 48 46 C 58 47, 52 64, 60 64 C 70 64, 70 36, 78 36 C 84 36, 80 62, 88 62 C 98 62, 100 30, 112 30 C 120 30, 110 66, 122 64 C 134 62, 132 38, 144 40"
      stroke={color} strokeWidth={strokeW} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M150 48 C 168 44, 182 46, 196 40 C 206 36, 210 30, 212 24"
      stroke={color} strokeWidth={strokeW} strokeLinecap="round" />
    <path d="M120 72 C 150 70, 180 70, 208 70" stroke={color} strokeWidth={strokeW * 0.7} strokeLinecap="round" opacity="0.85" />
  </svg>
);

const SIG_FONTS = [
  { id: 'f1', label: 'Alex Brush', family: "'Brush Script MT', cursive", style: { fontStyle: 'italic' } },
  { id: 'f2', label: 'Dancing', family: "'Segoe Script', cursive", style: {} },
  { id: 'f3', label: 'Formal', family: "'Snell Roundhand', 'Apple Chancery', cursive", style: { fontStyle: 'italic' } },
  { id: 'f4', label: 'Mono', family: "'Courier New', monospace", style: { letterSpacing: '0.04em' } },
];

const SigTab = ({ active, label, icon: Ic, onClick }) => (
  <button onClick={onClick} style={{
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
    padding: '10px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
    background: active ? 'rgba(107,92,231,0.16)' : 'transparent',
    color: active ? '#BFB5FF' : 'var(--text-2)',
    border: active ? '1px solid rgba(107,92,231,0.3)' : '1px solid transparent',
  }}>
    <Ic size={15} sw={1.7} /> {label}
  </button>
);

const SignTool = () => {
  const [tab, setTab] = React.useState('draw');
  const [color, setColor] = React.useState('#1E3A8A');
  const [font, setFont] = React.useState('f1');

  return (
    <section style={{ padding: '32px 40px 80px' }}>
      <div style={{ maxWidth: 1320, margin: '0 auto' }}>
        <Breadcrumb items={['Home', 'Tools', 'Sign PDF']} />
        <ToolHeader icon="IconPen" title="Sign PDF" mode="local"
          subtitle="Create a signature, then drag it onto the page. Nothing is uploaded." />

        <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: 32, marginTop: 36 }}>
          {/* Step 1 — create signature */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignSelf: 'start' }}>
            <div className="pp-card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <span style={{ width: 22, height: 22, borderRadius: 6, background: 'var(--indigo)', color: 'white', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>1</span>
                <h3 style={{ fontSize: 15 }}>Create your signature</h3>
              </div>

              {/* tabs */}
              <div style={{ display: 'flex', gap: 4, padding: 4, background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 10, marginBottom: 16 }}>
                <SigTab active={tab === 'draw'} label="Draw" icon={IconPen} onClick={() => setTab('draw')} />
                <SigTab active={tab === 'type'} label="Type" icon={IconType} onClick={() => setTab('type')} />
                <SigTab active={tab === 'upload'} label="Upload" icon={IconImage} onClick={() => setTab('upload')} />
              </div>

              {/* pad */}
              <div style={{
                height: 180, borderRadius: 12, background: '#FAFAF9',
                border: '1px solid var(--line-2)', position: 'relative', overflow: 'hidden',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {/* baseline */}
                <div style={{ position: 'absolute', left: 24, right: 24, bottom: 52, borderTop: '1px dashed #C7C2BB' }} />
                <span style={{ position: 'absolute', left: 24, bottom: 56, fontSize: 18, color: '#C7C2BB' }}>✕</span>

                {tab === 'draw' && <div style={{ marginBottom: 18 }}><SignatureGlyph color={color} w={240} /></div>}
                {tab === 'type' && (
                  <span style={{ fontFamily: SIG_FONTS.find(f => f.id === font).family, fontSize: 46, color, marginBottom: 16, ...SIG_FONTS.find(f => f.id === font).style }}>
                    A. Marius
                  </span>
                )}
                {tab === 'upload' && (
                  <div style={{ textAlign: 'center', color: 'var(--text-3)' }}>
                    <IconUpload size={24} sw={1.6} color="#9CA3AF" />
                    <div style={{ fontSize: 12.5, color: '#6B7280', marginTop: 8 }}>Drop a PNG with transparent background</div>
                  </div>
                )}

                <div style={{ position: 'absolute', top: 10, right: 12 }}>
                  <button style={{ background: 'white', border: '1px solid var(--line-2)', borderRadius: 7, padding: '4px 10px', fontSize: 11.5, color: '#6B7280', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <IconX size={12} /> Clear
                  </button>
                </div>
              </div>

              {/* type fonts */}
              {tab === 'type' && (
                <div style={{ marginTop: 14 }}>
                  <input className="pp-input" defaultValue="A. Marius" style={{ marginBottom: 10 }} />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {SIG_FONTS.map(f => (
                      <button key={f.id} onClick={() => setFont(f.id)} style={{
                        padding: '8px 10px', borderRadius: 9, cursor: 'pointer',
                        background: font === f.id ? 'rgba(107,92,231,0.1)' : 'var(--bg-2)',
                        border: font === f.id ? '1px solid var(--indigo)' : '1px solid var(--line)',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                      }}>
                        <span style={{ fontFamily: f.family, fontSize: 20, color: 'var(--text)', ...f.style }}>A. Marius</span>
                        {font === f.id && <IconCheck size={13} color="#BFB5FF" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* color + actions */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12.5, color: 'var(--text-2)' }}>Ink</span>
                  {['#1E3A8A', '#0F0F0F', '#1f1f1f', '#7C2D12'].map(c => (
                    <button key={c} onClick={() => setColor(c)} style={{
                      width: 24, height: 24, borderRadius: '50%', background: c, border: 0, cursor: 'pointer',
                      boxShadow: color === c ? `0 0 0 2px var(--card), 0 0 0 4px ${c}` : 'inset 0 0 0 1px rgba(255,255,255,0.12)',
                    }} />
                  ))}
                </div>
                <button className="pp-btn" style={{ padding: '8px 14px', fontSize: 13 }}>
                  <IconCheck size={14} sw={2} /> Save signature
                </button>
              </div>
            </div>

            {/* saved signatures */}
            <div className="pp-card" style={{ padding: 20 }}>
              <div style={{ fontSize: 12.5, color: 'var(--text-2)', marginBottom: 12, display: 'flex', justifyContent: 'space-between' }}>
                <span>Saved signatures</span>
                <span className="pp-mono" style={{ color: 'var(--text-3)' }}>local only</span>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                {['#1E3A8A', '#0F0F0F'].map((c, i) => (
                  <div key={i} style={{
                    flex: 1, height: 64, borderRadius: 10, background: '#FAFAF9',
                    border: i === 0 ? '2px solid var(--indigo)' : '1px solid var(--line-2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  }}>
                    <SignatureGlyph color={c} w={120} strokeW={2} />
                  </div>
                ))}
                <button style={{
                  width: 64, height: 64, borderRadius: 10, background: 'var(--bg-2)',
                  border: '1px dashed var(--line-2)', color: 'var(--text-3)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <IconPlus size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Step 2 — place on PDF */}
          <div style={{
            background: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.012) 0 1px, transparent 1px 14px), var(--bg-2)',
            border: '1px solid var(--line)', borderRadius: 16, padding: 40,
            display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', minHeight: 760,
          }}>
            <div style={{ position: 'absolute', top: 16, left: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 20, height: 20, borderRadius: 6, background: 'var(--indigo)', color: 'white', fontSize: 10.5, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>2</span>
              <span className="pp-mono" style={{ fontSize: 10.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-3)' }}>Drag signature onto the page</span>
            </div>

            <div style={{ position: 'relative', marginTop: 28 }}>
              <DocPage variant="legal" width={520} height={680} pageLabel="24 / 24" />
              {/* signature placed on signature line */}
              <div style={{ position: 'absolute', left: 70, bottom: 150, width: 200 }}>
                <div style={{ position: 'relative', padding: 6, border: '1.5px dashed var(--indigo)', borderRadius: 6, background: 'rgba(107,92,231,0.04)' }}>
                  <SignatureGlyph color="#1E3A8A" w={180} strokeW={2.2} />
                  {/* resize handles */}
                  {[['tl', { top: -5, left: -5 }], ['tr', { top: -5, right: -5 }], ['bl', { bottom: -5, left: -5 }], ['br', { bottom: -5, right: -5 }]].map(([k, st]) => (
                    <div key={k} style={{ position: 'absolute', ...st, width: 10, height: 10, borderRadius: 2, background: 'white', border: '2px solid var(--indigo)' }} />
                  ))}
                  {/* move chip */}
                  <div style={{ position: 'absolute', top: -26, left: 0, display: 'flex', alignItems: 'center', gap: 5, padding: '2px 8px', background: 'var(--indigo)', borderRadius: 5, fontSize: 10.5, color: 'white', fontFamily: 'var(--font-mono)' }}>
                    <IconGrip size={11} /> Signature
                  </div>
                </div>
                {/* the printed sign line under it */}
                <div style={{ marginTop: 4, borderTop: '1px solid #1f1f1f', paddingTop: 4, fontSize: 9, color: '#6B7280', fontFamily: 'Georgia, serif' }}>
                  Authorized signatory · A. Marius
                </div>
              </div>
            </div>

            {/* apply scope + nav */}
            <div style={{ marginTop: 28, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ display: 'flex', gap: 2, padding: 4, background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 10 }}>
                <button style={{ padding: '7px 14px', borderRadius: 7, fontSize: 12.5, border: 0, cursor: 'pointer', background: 'rgba(107,92,231,0.16)', color: '#BFB5FF', fontWeight: 500 }}>Just this page</button>
                <button style={{ padding: '7px 14px', borderRadius: 7, fontSize: 12.5, border: 0, cursor: 'pointer', background: 'transparent', color: 'var(--text-2)' }}>All pages</button>
              </div>
              <button className="pp-btn pp-btn-lg">
                <IconDownload size={15} /> Sign and download
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const SignEmpty = () => (
  <section style={{ padding: '32px 40px 80px' }}>
    <div style={{ maxWidth: 1320, margin: '0 auto' }}>
      <Breadcrumb items={['Home', 'Tools', 'Sign PDF']} />
      <ToolHeader icon="IconPen" title="Sign PDF" mode="local"
        subtitle="Create a signature, then drag it onto the page. Nothing is uploaded." />
      <div style={{ marginTop: 24, background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 18 }}>
        <EmptyDrop icon="IconPen" title="Drop a PDF to sign"
          sub="Draw, type, or upload a signature — then place it anywhere on the document."
          note="Signatures are applied locally · nothing is uploaded" minHeight={520} />
      </div>
    </div>
  </section>
);

const SignMobile = () => {
  const [tab, setTab] = React.useState('draw');
  return (
    <MobileShell height={1320}>
      <section style={{ padding: '18px 20px 100px' }}>
        <Breadcrumb items={['Tools', 'Sign PDF']} />
        <h1 style={{ fontSize: 24, letterSpacing: '-0.025em', marginBottom: 4 }}>Sign PDF</h1>
        <p style={{ fontSize: 12.5, color: 'var(--text-2)', marginBottom: 14 }}>Create, then tap to place.</p>
        <PrivacyBadge mode="local" big />

        <div style={{ marginTop: 16, display: 'flex', gap: 4, padding: 4, background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 10 }}>
          <SigTab active={tab === 'draw'} label="Draw" icon={IconPen} onClick={() => setTab('draw')} />
          <SigTab active={tab === 'type'} label="Type" icon={IconType} onClick={() => setTab('type')} />
          <SigTab active={tab === 'upload'} label="Upload" icon={IconImage} onClick={() => setTab('upload')} />
        </div>
        <div style={{ marginTop: 12, height: 150, borderRadius: 12, background: '#FAFAF9', border: '1px solid var(--line-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          <div style={{ position: 'absolute', left: 20, right: 20, bottom: 44, borderTop: '1px dashed #C7C2BB' }} />
          {tab === 'type'
            ? <span style={{ fontFamily: "'Brush Script MT', cursive", fontSize: 40, color: '#1E3A8A', fontStyle: 'italic', marginBottom: 14 }}>A. Marius</span>
            : <div style={{ marginBottom: 14 }}><SignatureGlyph color="#1E3A8A" w={200} /></div>}
        </div>

        <div style={{ marginTop: 16, background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 14, padding: 16, display: 'flex', justifyContent: 'center' }}>
          <div style={{ position: 'relative' }}>
            <DocPage variant="legal" width={300} height={390} scale={0.62} pageLabel="24 / 24" />
            <div style={{ position: 'absolute', left: 40, bottom: 80, padding: 4, border: '1.5px dashed var(--indigo)', borderRadius: 5 }}>
              <SignatureGlyph color="#1E3A8A" w={120} strokeW={2} />
            </div>
          </div>
        </div>
      </section>
      <MobileCTA label="Sign and download" />
    </MobileShell>
  );
};

const SignPage = () => <ToolPage><SignTool /></ToolPage>;
const SignEmptyPage = () => <ToolPage><SignEmpty /></ToolPage>;
const SignLightPage = () => <ToolPage theme="light"><SignTool /></ToolPage>;

Object.assign(window, { SignPage, SignEmptyPage, SignLightPage, SignMobile, SignatureGlyph });
