// PlinyPDF — Compress PDF tool (settings + result states)

const COMPRESS_PRESETS = [
  {
    id: 'screen',
    name: 'Screen',
    desc: 'Optimized for digital viewing — perfect for email and web.',
    pct: 70, ratio: 0.30,
    dpi: '72 DPI', quality: 'Good for screens',
  },
  {
    id: 'balanced',
    name: 'Balanced',
    desc: 'Good quality, smaller size. The right default for most PDFs.',
    pct: 50, ratio: 0.50,
    dpi: '150 DPI', quality: 'Recommended',
  },
  {
    id: 'maximum',
    name: 'Maximum',
    desc: 'Smallest possible file. Some visual quality loss on images.',
    pct: 80, ratio: 0.20,
    dpi: '72 DPI · low', quality: 'Compact',
  },
];

const formatSize = (mb) => mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.round(mb * 1024)} KB`;

const CompressPresetCard = ({ preset, active, onSelect }) => (
  <button onClick={onSelect} style={{
    textAlign: 'left',
    padding: 20,
    borderRadius: 14,
    cursor: 'pointer',
    background: active ? 'rgba(107,92,231,0.08)' : 'var(--card)',
    border: active ? '1px solid var(--indigo)' : '1px solid var(--line)',
    boxShadow: active ? '0 0 0 3px var(--indigo-dim)' : 'none',
    transition: 'all 0.15s ease',
    color: 'var(--text)',
    fontFamily: 'inherit',
    position: 'relative',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 22, height: 22, borderRadius: '50%',
          border: active ? '6px solid var(--indigo)' : '1.5px solid var(--line-2)',
          background: active ? 'var(--bg)' : 'transparent',
          transition: 'border 0.15s ease',
        }} />
        <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.015em' }}>{preset.name}</div>
      </div>
      {preset.id === 'balanced' && (
        <span className="pp-badge pro" style={{ fontSize: 10.5, padding: '2px 8px' }}>Recommended</span>
      )}
    </div>
    <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5, marginBottom: 14, minHeight: 40 }}>
      {preset.desc}
    </p>
    <div className="pp-mono" style={{ fontSize: 11.5, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 8 }}>
      <span>~{preset.pct}% smaller</span>
      <span>·</span>
      <span>{preset.dpi}</span>
    </div>
  </button>
);

const CompressTool = ({ initialState = 'settings' }) => {
  const [state, setState] = React.useState(initialState); // 'idle' | 'settings' | 'processing' | 'done'
  const [preset, setPreset] = React.useState('balanced');
  const fileMB = 4.8;
  const cur = COMPRESS_PRESETS.find(p => p.id === preset);
  const outMB = fileMB * cur.ratio;
  const finalOutMB = 1.3;
  const savedPct = Math.round((1 - finalOutMB / fileMB) * 100);

  return (
    <section style={{ padding: '40px 40px 96px' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <Breadcrumb items={['Home', 'Tools', 'Compress PDF']} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 13,
            background: 'rgba(244,114,182,0.14)', border: '1px solid rgba(244,114,182,0.3)',
            color: '#F472B6',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <IconCompress size={24} sw={1.6} />
          </div>
          <div>
            <h1 style={{ fontSize: 36, letterSpacing: '-0.025em' }}>Compress PDF</h1>
            <p style={{ fontSize: 14.5, color: 'var(--text-2)', marginTop: 2 }}>
              Reduce file size while keeping the document readable.
            </p>
          </div>
        </div>

        <PrivacyBadge mode="local" big />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 32, marginTop: 32 }}>
          <div>
            {/* File row */}
            <div style={{
              padding: '18px 20px',
              background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 14,
              display: 'flex', alignItems: 'center', gap: 16,
              marginBottom: 24,
            }}>
              <PdfThumb color="#60A5FA" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)' }}>
                  investor-deck-2026.pdf
                </div>
                <div className="pp-mono" style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 3 }}>
                  {formatSize(fileMB)} · 42 pages · Image-heavy
                </div>
              </div>
              <button style={{
                background: 'transparent', border: '1px solid var(--line)',
                color: 'var(--text-2)', padding: '6px 12px', borderRadius: 8, fontSize: 12.5, cursor: 'pointer',
              }}>Replace file</button>
            </div>

            {state !== 'done' && (
              <>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
                  <h3 style={{ fontSize: 15 }}>Compression preset</h3>
                  <span className="pp-mono" style={{ fontSize: 11.5, color: 'var(--text-3)' }}>
                    Lower = smaller file, less quality
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                  {COMPRESS_PRESETS.map(p => (
                    <CompressPresetCard key={p.id} preset={p} active={preset === p.id} onSelect={() => setPreset(p.id)} />
                  ))}
                </div>

                {/* Estimated size preview */}
                <div style={{
                  marginTop: 24, padding: '20px 24px',
                  background: 'linear-gradient(180deg, rgba(107,92,231,0.06), rgba(107,92,231,0.01))',
                  border: '1px solid rgba(107,92,231,0.2)',
                  borderRadius: 14,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                    <div className="pp-mono" style={{ fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                      Estimated output
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <span className="pp-mono" style={{ fontSize: 18, color: 'var(--text-3)', textDecoration: 'line-through' }}>
                        {formatSize(fileMB)}
                      </span>
                      <IconArrow size={16} color="var(--text-3)" />
                      <span className="pp-mono" style={{ fontSize: 22, fontWeight: 600, color: '#BFB5FF' }}>
                        ~{formatSize(outMB)}
                      </span>
                    </div>
                  </div>
                  <span className="pp-badge local" style={{ padding: '4px 12px' }}>
                    Save ~{cur.pct}%
                  </span>
                </div>

                <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button className="pp-btn pp-btn-ghost pp-btn-lg">Cancel</button>
                  {state === 'processing' ? (
                    <button className="pp-btn pp-btn-lg" disabled style={{ minWidth: 200, justifyContent: 'center' }}>
                      <Spinner /> Compressing…
                    </button>
                  ) : (
                    <button className="pp-btn pp-btn-lg" style={{ minWidth: 200, justifyContent: 'center' }}
                            onClick={() => { setState('processing'); setTimeout(() => setState('done'), 1800); }}>
                      <IconCompress size={15} sw={1.7} /> Compress PDF
                    </button>
                  )}
                </div>
              </>
            )}

            {state === 'done' && (
              <div style={{
                padding: 32,
                background: 'linear-gradient(180deg, rgba(16,185,129,0.08), rgba(16,185,129,0.02))',
                border: '1px solid rgba(16,185,129,0.24)',
                borderRadius: 18,
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18, marginBottom: 22 }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: 13,
                    background: 'rgba(16,185,129,0.18)', color: '#34D399',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <IconCheck size={24} sw={2.4} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: 22, letterSpacing: '-0.015em', marginBottom: 6 }}>
                      Compressed. Saved {savedPct}%.
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 14 }}>
                      <span className="pp-mono" style={{ color: 'var(--text-3)', textDecoration: 'line-through' }}>
                        {formatSize(fileMB)}
                      </span>
                      <IconArrow size={14} color="var(--text-3)" />
                      <span className="pp-mono" style={{ color: 'var(--text)', fontWeight: 600 }}>
                        {formatSize(finalOutMB)}
                      </span>
                      <span className="pp-badge local" style={{ marginLeft: 6 }}>−{savedPct}%</span>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="pp-btn pp-btn-lg" style={{ flex: 1, justifyContent: 'center', background: 'var(--emerald)', boxShadow: '0 8px 20px -10px rgba(16,185,129,0.6)' }}>
                    <IconDownload size={15} /> Download compressed PDF
                  </button>
                  <button className="pp-btn pp-btn-ghost pp-btn-lg" onClick={() => setState('settings')}>
                    Compress another
                  </button>
                </div>
                <div className="pp-mono" style={{ marginTop: 14, fontSize: 11.5, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="pp-dot" style={{ color: '#34D399' }} />
                  Processed locally in 1.6 s · zero network requests
                </div>
              </div>
            )}
          </div>

          <aside style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <HowItWorks />
            <SecurityNote />
            <RelatedTools />
          </aside>
        </div>
      </div>
    </section>
  );
};

const CompressPage = () => (
  <div className="pp-board" style={{ width: 1440 }}>
    <Navbar active="tools" />
    <CompressTool initialState="settings" />
    <Footer />
  </div>
);

const CompressPageDone = () => (
  <div className="pp-board" style={{ width: 1440 }}>
    <Navbar active="tools" />
    <CompressTool initialState="done" />
    <Footer />
  </div>
);

Object.assign(window, { CompressPage, CompressPageDone, CompressTool });
