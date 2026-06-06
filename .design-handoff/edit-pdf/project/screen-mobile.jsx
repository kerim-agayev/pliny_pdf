// PlinyPDF — Mobile screens (homepage + merge tool)

const PhoneStatusBar = () => (
  <div style={{
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '10px 22px 6px',
    fontSize: 14, fontWeight: 600, color: 'var(--text)',
    fontFamily: 'var(--font-display)',
  }}>
    <span>9:41</span>
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
      <svg width="16" height="11" viewBox="0 0 16 11" fill="currentColor"><path d="M1 7h2v3H1zM5 5h2v5H5zM9 3h2v7H9zM13 1h2v9h-2z" /></svg>
      <svg width="14" height="10" viewBox="0 0 14 10" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M1 4a8 8 0 0 1 12 0M3 6.5a5 5 0 0 1 8 0M6 9a1 1 0 0 1 2 0" /></svg>
      <svg width="22" height="10" viewBox="0 0 22 10" fill="none">
        <rect x="0.5" y="0.5" width="19" height="9" rx="2" stroke="currentColor" opacity="0.5" />
        <rect x="2" y="2" width="14" height="6" rx="1" fill="currentColor" />
        <rect x="20" y="3" width="1.5" height="4" rx="0.5" fill="currentColor" opacity="0.5" />
      </svg>
    </span>
  </div>
);

const MobileHomepage = () => (
  <div className="pp-board" style={{ width: 390, height: 1820, fontSize: 14 }}>
    <PhoneStatusBar />
    <Navbar mobile />

    {/* Hero */}
    <section className="pp-grad-hero" style={{ padding: '36px 22px 36px' }}>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '4px 10px 4px 6px',
        background: 'rgba(255,255,255,0.04)', border: '1px solid var(--line-2)',
        borderRadius: 999, fontSize: 11, color: 'var(--text-2)',
        marginBottom: 20,
      }}>
        <span className="pp-badge local" style={{ padding: '1px 6px', fontSize: 9.5 }}>
          <span className="pp-dot" /> v2.4
        </span>
        AI summaries are here →
      </div>
      <h1 style={{
        fontSize: 38, lineHeight: 1.05, fontWeight: 700, letterSpacing: '-0.035em',
        marginBottom: 16, textWrap: 'balance',
      }}>
        Edit PDFs without{' '}
        <span style={{
          background: 'linear-gradient(90deg, #BFB5FF, #6B5CE7, #34D399)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          fontStyle: 'italic', fontWeight: 600,
        }}>uploading them.</span>
      </h1>
      <p style={{ fontSize: 15, lineHeight: 1.55, color: 'var(--text-2)', marginBottom: 24 }}>
        All processing happens in your browser. Your files never touch our servers.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
        <button className="pp-btn pp-btn-lg" style={{ justifyContent: 'center', width: '100%' }}>
          Start Free — No signup <IconArrow size={15} />
        </button>
        <button className="pp-btn pp-btn-lg pp-btn-ghost" style={{ justifyContent: 'center', width: '100%' }}>
          See all 11 tools
        </button>
      </div>
      <div style={{
        display: 'flex', justifyContent: 'center', gap: 14,
        fontSize: 11.5, color: 'var(--text-2)',
      }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <span className="pp-dot" style={{ color: '#34D399' }} /> No uploads
        </span>
        <span style={{ color: 'var(--line-2)' }}>·</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <span className="pp-mono" style={{ color: '#BFB5FF' }}>∞</span> No limits
        </span>
        <span style={{ color: 'var(--line-2)' }}>·</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <IconX size={11} color="#F43F5E" sw={2.4} /> No watermark
        </span>
      </div>
    </section>

    {/* Mini product preview */}
    <section style={{ padding: '0 22px 36px' }}>
      <div style={{
        background: 'linear-gradient(180deg, #1A1A1A, #141414)',
        border: '1px solid var(--line-2)',
        borderRadius: 16,
        padding: 14,
        boxShadow: '0 20px 50px -20px rgba(0,0,0,0.6)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 22, height: 22, borderRadius: 6, background: 'rgba(107,92,231,0.14)',
              border: '1px solid rgba(107,92,231,0.3)', color: '#BFB5FF',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <IconMerge size={12} sw={1.7} />
            </div>
            <div style={{ fontSize: 12.5, fontWeight: 600 }}>Merge PDF</div>
          </div>
          <PrivacyBadge mode="local" />
        </div>
        <div style={{ background: '#0F0F0F', border: '1px solid var(--line)', borderRadius: 10, padding: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {['invoice-q4.pdf · 124 KB', 'invoice-q3.pdf · 98 KB'].map((t, i) => (
            <div key={i} style={{ padding: '8px 10px', background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 8, fontSize: 11.5, display: 'flex', alignItems: 'center', gap: 8 }}>
              <IconGrip size={10} color="var(--text-3)" />
              <PdfThumb color="#A78BFA" />
              <span style={{ flex: 1 }}>{t}</span>
            </div>
          ))}
        </div>
        <button className="pp-btn" style={{ width: '100%', justifyContent: 'center', marginTop: 10, padding: '8px' }}>
          Merge 2 files <IconArrow size={13} />
        </button>
      </div>
    </section>

    {/* Popular tools */}
    <section style={{ padding: '20px 22px 36px', borderTop: '1px solid var(--line)' }}>
      <div className="pp-mono" style={{ fontSize: 10.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#BFB5FF', marginBottom: 10 }}>
        Popular tools
      </div>
      <h2 style={{ fontSize: 26, letterSpacing: '-0.025em', marginBottom: 20 }}>
        Six tools cover the 90%.
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
        {['merge', 'compress', 'pdf-to-word', 'watermark'].map(id => {
          const t = TOOLS.find(x => x.id === id);
          const Ic = window[t.icon];
          return (
            <div key={id} className="pp-tool" style={{ padding: 14 }}>
              <div style={{
                width: 30, height: 30, borderRadius: 8,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid var(--line)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: t.accent, marginBottom: 10,
              }}>
                <Ic size={15} sw={1.7} />
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 4 }}>{t.name}</div>
              <PrivacyBadge mode={t.mode} />
            </div>
          );
        })}
      </div>
      <button className="pp-btn pp-btn-ghost" style={{ width: '100%', justifyContent: 'center', marginTop: 14 }}>
        See all 11 tools <IconArrow size={14} />
      </button>
    </section>

    {/* Why */}
    <section style={{ padding: '36px 22px', borderTop: '1px solid var(--line)', background: 'var(--bg-2)' }}>
      <div className="pp-mono" style={{ fontSize: 10.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#BFB5FF', marginBottom: 10 }}>
        Why PlinyPDF
      </div>
      <h2 style={{ fontSize: 26, letterSpacing: '-0.025em', marginBottom: 22 }}>
        The PDF tool that <em style={{ fontStyle: 'italic', color: '#BFB5FF', fontWeight: 500 }}>respects</em> you.
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[
          { icon: 'IconShield', color: '#34D399', t: 'Privacy first', b: 'Nine of eleven tools run in your browser. Zero telemetry.' },
          { icon: 'IconSparkle', color: '#BFB5FF', t: 'AI summaries', b: 'Drop 200 pages, get the gist in seconds.' },
          { icon: 'IconGlobe', color: '#60A5FA', t: 'Multilingual', b: 'EN, TR, RU — fully localized, no AI-translated junk.' },
        ].map((c, i) => {
          const Ic = window[c.icon];
          return (
            <div key={i} className="pp-card" style={{ padding: 18, display: 'flex', gap: 14 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 9,
                background: 'rgba(255,255,255,0.04)', border: '1px solid var(--line)',
                color: c.color, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Ic size={17} sw={1.7} />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{c.t}</div>
                <div style={{ fontSize: 13, color: 'var(--text-2)' }}>{c.b}</div>
              </div>
            </div>
          );
        })}
      </div>
    </section>

    {/* Footer CTA */}
    <section style={{
      padding: '48px 22px',
      background: 'radial-gradient(80% 100% at 50% 0%, rgba(107,92,231,0.2), rgba(107,92,231,0) 70%), var(--bg)',
      borderTop: '1px solid var(--line)',
      textAlign: 'center',
    }}>
      <h2 style={{ fontSize: 30, letterSpacing: '-0.03em', marginBottom: 12, textWrap: 'balance' }}>
        Your PDFs.<br />Your machine. Always.
      </h2>
      <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 22 }}>
        Try every tool — no signup needed.
      </p>
      <button className="pp-btn pp-btn-lg" style={{ width: '100%', justifyContent: 'center' }}>
        Start Free <IconArrow size={15} />
      </button>
    </section>

    {/* Footer mini */}
    <footer style={{ padding: '32px 22px', borderTop: '1px solid var(--line)', fontSize: 12, color: 'var(--text-3)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <PlinyMark size={20} color="#F9FAFB" />
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>PlinyPDF</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 20 }}>
        {['All tools', 'Pricing', 'Privacy', 'Blog', 'Türkçe', 'Русский'].map(l => <a key={l}>{l}</a>)}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        © 2026 · Made with <IconHeart size={11} color="#F472B6" sw={2} /> for privacy
      </div>
    </footer>
  </div>
);

// ===== Mobile Merge tool =====
const MobileMerge = () => (
  <div className="pp-board" style={{ width: 390, height: 1200, fontSize: 14 }}>
    <PhoneStatusBar />
    <Navbar mobile />

    <section style={{ padding: '20px 22px 80px' }}>
      <Breadcrumb items={['Tools', 'Merge PDF']} />

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
        <div style={{
          width: 42, height: 42, borderRadius: 11,
          background: 'rgba(107,92,231,0.14)', border: '1px solid rgba(107,92,231,0.3)',
          color: '#BFB5FF',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <IconMerge size={20} sw={1.6} />
        </div>
        <div>
          <h1 style={{ fontSize: 26, letterSpacing: '-0.025em' }}>Merge PDF</h1>
          <p style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 2 }}>
            Combine PDFs into one. Reorder by drag.
          </p>
        </div>
      </div>

      <PrivacyBadge mode="local" big />

      <div className="pp-drop" style={{ marginTop: 20, padding: '32px 18px' }}>
        <div style={{
          width: 44, height: 44, borderRadius: 11,
          background: 'rgba(255,255,255,0.04)', border: '1px solid var(--line)',
          color: 'var(--text-2)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 12,
        }}>
          <IconUpload size={18} sw={1.7} />
        </div>
        <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 4, color: 'var(--text)' }}>
          Tap to browse files
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--text-2)' }}>
          PDF · multiple supported · max 200 MB total
        </div>
      </div>

      <div style={{ marginTop: 24 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 12 }}>
          <h3 style={{ fontSize: 14 }}>Files to merge</h3>
          <span className="pp-mono" style={{ fontSize: 11, color: 'var(--text-3)' }}>3 files · 32 pages</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {MOCK_FILES.slice(0, 3).map((f, i) => (
            <div key={f.id} className="pp-filerow" style={{ padding: '10px 12px' }}>
              <span className="pp-mono" style={{ fontSize: 10.5, color: 'var(--text-3)' }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <IconGrip size={14} color="var(--text-3)" />
              <PdfThumb color={f.color} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</div>
                <div className="pp-mono" style={{ fontSize: 10.5, color: 'var(--text-3)', marginTop: 1 }}>{f.size} · {f.pages}p</div>
              </div>
              <IconX size={13} color="var(--text-3)" />
            </div>
          ))}
        </div>
      </div>

      <button className="pp-btn pp-btn-lg" style={{ width: '100%', justifyContent: 'center', marginTop: 24 }}>
        Merge 3 files <IconArrow size={15} />
      </button>
      <div style={{
        marginTop: 12, fontSize: 11.5, color: 'var(--text-3)', textAlign: 'center',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      }}>
        <span className="pp-dot" style={{ color: '#34D399' }} />
        Processed in your browser
      </div>

      <div style={{ marginTop: 28 }}>
        <HowItWorks />
      </div>
    </section>
  </div>
);

Object.assign(window, { MobileHomepage, MobileMerge });
