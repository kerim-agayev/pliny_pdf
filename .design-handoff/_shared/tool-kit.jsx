// PlinyPDF — Phase 2 shared tool kit.
// Reusable header / page wrapper / realistic PDF page / empty-drop helpers
// so the six new tools stay visually identical to Merge / Watermark / Editor.

// ===== Realistic document content (varied, not lorem on every page) =====
// variant: 'report' | 'legal' | 'financial' | 'technical'
const DocBody = ({ variant = 'report', scale = 1, children }) => {
  const px = (n) => Math.round(n * scale);
  const blocks = {
    report: (
      <>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: px(11), letterSpacing: '0.18em', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: px(14) }}>
          PlinyPDF · Annual Report 2025
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: px(25), lineHeight: 1.15, color: '#0F0F0F', marginBottom: px(14), letterSpacing: '-0.02em', fontWeight: 700 }}>
          Eleven new tools, nine of them local.
        </h1>
        <div style={{ fontSize: px(11), color: '#6B7280', marginBottom: px(24) }}>
          By A. Marius · Chief product officer · 24 pages
        </div>
        <p style={{ fontFamily: 'Georgia, serif', fontSize: px(13), lineHeight: 1.75, color: '#1f1f1f', margin: `0 0 ${px(12)}px` }}>
          In 2025 we shipped eleven new tools across four categories. Of those, nine run
          entirely on the client via WebAssembly, with no upload required at any point in
          the flow. Revenue grew 247% year over year, driven by individual Pro subscriptions.
        </p>
        <div style={{ padding: `${px(13)}px ${px(16)}px`, background: '#F4F2EE', borderLeft: `3px solid #6B5CE7`, borderRadius: 3, marginBottom: px(12) }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: px(10), fontWeight: 600, color: '#6B5CE7', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: px(6) }}>Key insight</div>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: px(12.5), lineHeight: 1.65, color: '#1f1f1f' }}>
            When you remove the upload step, you also remove the only place where competitors spend money.
          </div>
        </div>
        <p style={{ fontFamily: 'Georgia, serif', fontSize: px(13), lineHeight: 1.75, color: '#1f1f1f', margin: 0 }}>
          The team remains small — twelve people, no managers, distributed across six time zones.
        </p>
      </>
    ),
    legal: (
      <>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: px(10), letterSpacing: '0.18em', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: px(6), textAlign: 'center' }}>
          Master Services Agreement
        </div>
        <div style={{ fontFamily: 'Georgia, serif', fontSize: px(13), fontWeight: 700, color: '#0F0F0F', marginBottom: px(20), textAlign: 'center', letterSpacing: '0.02em' }}>
          ARTICLE 4 — CONFIDENTIALITY
        </div>
        {[
          ['4.1', 'Each party acknowledges that it may receive Confidential Information of the other party in connection with this Agreement.'],
          ['4.2', 'The Receiving Party shall not disclose Confidential Information to any third party without the prior written consent of the Disclosing Party.'],
          ['4.3', 'Confidential Information shall not include information that is or becomes publicly available through no breach of this Agreement.'],
          ['4.4', 'Upon termination, each party shall return or destroy all Confidential Information within thirty (30) days.'],
        ].map(([n, t]) => (
          <div key={n} style={{ display: 'flex', gap: px(10), marginBottom: px(12) }}>
            <span style={{ fontFamily: 'Georgia, serif', fontSize: px(12), fontWeight: 700, color: '#1f1f1f', flexShrink: 0 }}>{n}</span>
            <p style={{ fontFamily: 'Georgia, serif', fontSize: px(12), lineHeight: 1.7, color: '#1f1f1f', margin: 0, textAlign: 'justify' }}>{t}</p>
          </div>
        ))}
      </>
    ),
    financial: (
      <>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: px(11), letterSpacing: '0.16em', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: px(6) }}>
          Q4 2025 · Statement of Operations
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: px(18), fontWeight: 700, color: '#0F0F0F', marginBottom: px(18), letterSpacing: '-0.01em' }}>
          Consolidated Financials
        </div>
        <div style={{ border: '1px solid #E5E3DE', borderRadius: 4, overflow: 'hidden' }}>
          {[
            ['Revenue', '$4,820,000', false],
            ['Cost of revenue', '($612,000)', false],
            ['Gross profit', '$4,208,000', true],
            ['Operating expenses', '($2,140,000)', false],
            ['R&D', '($890,000)', false],
            ['Operating income', '$1,178,000', true],
            ['Net income', '$1,044,000', true],
          ].map(([label, val, bold], i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between',
              padding: `${px(8)}px ${px(14)}px`,
              background: i % 2 ? '#FAFAF9' : 'white',
              borderTop: bold ? '1.5px solid #1f1f1f' : 'none',
            }}>
              <span style={{ fontFamily: 'Georgia, serif', fontSize: px(12), color: '#1f1f1f', fontWeight: bold ? 700 : 400 }}>{label}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: px(11.5), color: '#1f1f1f', fontWeight: bold ? 700 : 400 }}>{val}</span>
            </div>
          ))}
        </div>
        <p style={{ fontFamily: 'Georgia, serif', fontSize: px(10.5), lineHeight: 1.6, color: '#6B7280', marginTop: px(14), fontStyle: 'italic' }}>
          Figures are unaudited and presented in USD. See accompanying notes.
        </p>
      </>
    ),
    technical: (
      <>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: px(11), letterSpacing: '0.16em', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: px(6) }}>
          API Reference · v2.4
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: px(20), fontWeight: 700, color: '#0F0F0F', marginBottom: px(8), letterSpacing: '-0.01em' }}>
          POST /merge
        </div>
        <p style={{ fontFamily: 'Georgia, serif', fontSize: px(12.5), lineHeight: 1.7, color: '#1f1f1f', margin: `0 0 ${px(14)}px` }}>
          Combines an ordered array of PDF documents into a single file. Runs entirely client-side; no bytes leave the browser.
        </p>
        <div style={{ background: '#1A1A2E', borderRadius: 6, padding: px(14), marginBottom: px(14) }}>
          {['const merged = await pliny.merge({', '  files: [a, b, c],', '  order: "as-provided",', '});'].map((l, i) => (
            <div key={i} style={{ fontFamily: 'var(--font-mono)', fontSize: px(10.5), lineHeight: 1.7, color: i === 0 || i === 4 ? '#BFB5FF' : '#A5B4FC' }}>{l}</div>
          ))}
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: px(12), fontWeight: 600, color: '#0F0F0F', marginBottom: px(8) }}>Parameters</div>
        {[['files', 'File[]', 'Array of PDF blobs'], ['order', 'string', 'as-provided | reverse']].map(([n, t, d]) => (
          <div key={n} style={{ display: 'flex', gap: px(10), marginBottom: px(8), alignItems: 'baseline' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: px(11), color: '#6B5CE7', fontWeight: 600, minWidth: px(48) }}>{n}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: px(10), color: '#9CA3AF' }}>{t}</span>
            <span style={{ fontFamily: 'Georgia, serif', fontSize: px(11.5), color: '#1f1f1f' }}>{d}</span>
          </div>
        ))}
      </>
    ),
  };
  return (
    <div style={{ position: 'relative', height: '100%' }}>
      <div style={{ padding: `${px(52)}px ${px(56)}px` }}>{blocks[variant]}</div>
      {children}
    </div>
  );
};

// A full white PDF page surface with realistic content + page number footer
const DocPage = ({ variant = 'report', width = 480, height = 620, scale = 1, pageLabel = '1 / 24', children, footerNumber = true }) => (
  <div style={{
    position: 'relative', width, height,
    background: '#FAFAF9', borderRadius: 6,
    boxShadow: '0 30px 70px -20px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.06)',
    overflow: 'hidden', color: '#1f1f1f', flexShrink: 0,
  }}>
    <DocBody variant={variant} scale={scale} />
    {footerNumber && (
      <div style={{
        position: 'absolute', bottom: Math.round(20 * scale), left: 0, right: 0, textAlign: 'center',
        fontFamily: 'var(--font-mono)', fontSize: Math.round(9 * scale), color: '#9CA3AF',
      }}>{pageLabel}</div>
    )}
    {children}
  </div>
);

// Tiny page thumbnail (for grids / strips) with content hint + page badge
const PageThumb = ({ n, variant = 'report', w = 120, selected = false, rotated = 0, deleted = false, accent = '#6B5CE7', badge, dim = false }) => {
  const h = Math.round(w * 1.3);
  const lines = {
    report: [1, 0.7, 0.9, 0.5, 0.85, 0.6, 0.95, 0.4],
    legal: [0.5, 0.95, 0.9, 0.95, 0.85, 0.9, 0.6],
    financial: [0.4, 0.9, 0.9, 0.9, 0.9, 0.9, 0.7],
    technical: [0.6, 0.85, 0.5, 0.95, 0.9, 0.4, 0.8],
  }[variant] || [1, 0.7, 0.9, 0.5];
  return (
    <div style={{
      position: 'relative', width: w, height: h,
      transform: rotated ? `rotate(${rotated}deg)` : 'none',
      transition: 'transform 0.2s ease',
      flexShrink: 0,
    }}>
      <div style={{
        width: '100%', height: '100%',
        background: deleted ? '#1A1A1A' : '#FAFAF9',
        borderRadius: 5,
        border: selected ? `2px solid ${accent}` : '1px solid var(--line-2)',
        boxShadow: selected ? `0 0 0 4px ${accent}28, 0 12px 28px -12px rgba(0,0,0,0.6)` : '0 6px 16px -8px rgba(0,0,0,0.5)',
        opacity: deleted ? 0.5 : (dim ? 0.55 : 1),
        overflow: 'hidden', position: 'relative',
      }}>
        {!deleted && (
          <div style={{ padding: Math.round(w * 0.11), display: 'flex', flexDirection: 'column', gap: Math.round(w * 0.035) }}>
            <div style={{ height: Math.round(w * 0.05), width: '55%', background: accent, opacity: 0.55, borderRadius: 1, marginBottom: Math.round(w * 0.04) }} />
            {lines.map((ww, i) => (
              <div key={i} style={{ height: Math.max(1.5, Math.round(w * 0.018)), width: `${ww * 100}%`, background: '#9CA3AF', borderRadius: 1 }} />
            ))}
          </div>
        )}
        {deleted && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)' }}>
            <IconX size={Math.round(w * 0.22)} />
          </div>
        )}
      </div>
      {/* page number badge */}
      <div style={{
        position: 'absolute', bottom: -9, left: '50%', transform: 'translateX(-50%)',
        padding: '1px 8px', borderRadius: 999,
        background: selected ? accent : 'var(--card)',
        border: `1px solid ${selected ? accent : 'var(--line-2)'}`,
        fontFamily: 'var(--font-mono)', fontSize: 10,
        color: selected ? 'white' : 'var(--text-2)',
        whiteSpace: 'nowrap',
      }}>{n}</div>
      {badge}
    </div>
  );
};

// Tool header (icon tile + title + subtitle + privacy badge)
const ToolHeader = ({ icon, accent = '#BFB5FF', accentBg = 'rgba(107,92,231,0.14)', accentLine = 'rgba(107,92,231,0.3)', title, subtitle, mode = 'local', modeText, extraBadges }) => {
  const Ic = typeof icon === 'string' ? window[icon] : icon;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
      <div style={{
        width: 52, height: 52, borderRadius: 13,
        background: accentBg, border: `1px solid ${accentLine}`, color: accent,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Ic size={24} sw={1.6} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h1 style={{ fontSize: 34, letterSpacing: '-0.025em' }}>{title}</h1>
          {extraBadges}
        </div>
        <p style={{ fontSize: 14.5, color: 'var(--text-2)', marginTop: 2 }}>{subtitle}</p>
      </div>
      <div className={`pp-badge ${mode}`} style={{ padding: '8px 14px', fontSize: 13, borderRadius: 999, flexShrink: 0 }}>
        <span className="pp-dot" style={{ width: 8, height: 8 }} />
        {modeText || (mode === 'local' ? 'Local — processed in your browser' : 'Cloud — processed securely')}
      </div>
    </div>
  );
};

// Generic empty / upload state body (sits inside a tool's main area)
const EmptyDrop = ({ icon = 'IconUpload', accent = '#BFB5FF', title, sub, cta = 'Browse files', note = 'Processed locally · nothing is uploaded', formats = '.pdf up to 100 MB', minHeight = 420 }) => {
  const Ic = typeof icon === 'string' ? window[icon] : icon;
  return (
    <div style={{
      minHeight, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '40px 24px',
    }}>
      <div style={{
        width: 560, maxWidth: '100%',
        border: '1.5px dashed var(--line-2)', borderRadius: 18,
        padding: 52, textAlign: 'center',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0))',
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: 16,
          background: 'rgba(107,92,231,0.12)', border: '1px solid rgba(107,92,231,0.28)', color: accent,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 22,
        }}>
          <Ic size={26} sw={1.7} />
        </div>
        <h3 style={{ fontSize: 22, letterSpacing: '-0.02em', marginBottom: 8 }}>{title}</h3>
        <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 24, maxWidth: 380, marginLeft: 'auto', marginRight: 'auto' }}>{sub}</p>
        <button className="pp-btn pp-btn-lg" style={{ marginBottom: 18 }}>
          <IconFile size={15} /> {cta}
        </button>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 12, color: 'var(--text-3)' }}>
          <span className="pp-dot" style={{ color: '#34D399' }} />
          {note}
        </div>
      </div>
      <div style={{ marginTop: 26, display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, color: 'var(--text-3)' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span className="pp-mono" style={{ padding: '2px 7px', background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 4, color: 'var(--text-2)' }}>{formats}</span>
        </span>
        <span style={{ color: 'var(--line-2)' }}>·</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          Or paste <span className="pp-mono" style={{ padding: '2px 7px', background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 4, color: 'var(--text-2)' }}>⌘V</span>
        </span>
      </div>
    </div>
  );
};

// Page wrapper: pp-board + Navbar + content + Footer. theme 'dark' | 'light'.
const ToolPage = ({ theme = 'dark', width = 1440, children }) => (
  <div className={`pp-board${theme === 'light' ? ' pp-light' : ''}`} style={{ width }}>
    <Navbar active="tools" theme={theme} />
    {children}
    <Footer />
  </div>
);

// Mobile shell (375)
const MobileShell = ({ children, height = 1100 }) => (
  <div className="pp-board" style={{ width: 375, height, fontSize: 14, position: 'relative' }}>
    <StatusBar375 />
    <Navbar mobile />
    {children}
  </div>
);

// Small settings-panel section heading used across tools
const PanelTitle = ({ children }) => (
  <h3 style={{ fontSize: 14, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 22, fontFamily: 'var(--font-mono)', fontWeight: 500 }}>
    {children}
  </h3>
);

// Sticky mobile CTA bar
const MobileCTA = ({ label, note = 'Processed in your browser', accent }) => (
  <div style={{
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: '12px 16px 18px',
    background: 'linear-gradient(180deg, transparent, var(--bg) 30%)',
    backdropFilter: 'blur(8px)',
  }}>
    <button className="pp-btn pp-btn-lg" style={{
      width: '100%', justifyContent: 'center',
      background: accent || 'var(--indigo)',
      boxShadow: '0 12px 32px -12px rgba(107,92,231,0.6), 0 1px 0 rgba(255,255,255,0.12) inset',
    }}>
      {label} <IconArrow size={15} />
    </button>
    <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-3)', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
      <span className="pp-dot" style={{ color: '#34D399' }} /> {note}
    </div>
  </div>
);

Object.assign(window, { DocBody, DocPage, PageThumb, ToolHeader, EmptyDrop, ToolPage, MobileShell, PanelTitle, MobileCTA });
