// PlinyPDF — Mobile screens at 375px (homepage, merge, pricing)

const StatusBar375 = () => (
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

// ===== Homepage 375 =====
const Mobile375Home = () => (
  <div className="pp-board" style={{ width: 375, height: 1760, fontSize: 14 }}>
    <StatusBar375 />
    <Navbar mobile />

    <section className="pp-grad-hero" style={{ padding: '32px 20px 32px' }}>
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
        fontSize: 36, lineHeight: 1.05, fontWeight: 700, letterSpacing: '-0.035em',
        marginBottom: 14, textWrap: 'balance',
      }}>
        Edit PDFs without{' '}
        <span style={{
          background: 'linear-gradient(90deg, #BFB5FF, #6B5CE7, #34D399)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          fontStyle: 'italic', fontWeight: 600,
        }}>uploading them.</span>
      </h1>
      <p style={{ fontSize: 14.5, lineHeight: 1.55, color: 'var(--text-2)', marginBottom: 22 }}>
        All processing happens in your browser. Your files never touch our servers.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 22 }}>
        <button className="pp-btn pp-btn-lg" style={{ justifyContent: 'center', width: '100%' }}>
          Start Free — No signup <IconArrow size={15} />
        </button>
        <button className="pp-btn pp-btn-lg pp-btn-ghost" style={{ justifyContent: 'center', width: '100%' }}>
          See all 11 tools
        </button>
      </div>
      <div style={{
        display: 'flex', justifyContent: 'center', gap: 12,
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

    {/* product preview */}
    <section style={{ padding: '0 20px 32px' }}>
      <div style={{
        background: 'linear-gradient(180deg, #1A1A1A, #141414)',
        border: '1px solid var(--line-2)',
        borderRadius: 14,
        padding: 12,
        boxShadow: '0 20px 50px -20px rgba(0,0,0,0.6)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 20, height: 20, borderRadius: 6, background: 'rgba(107,92,231,0.14)',
              border: '1px solid rgba(107,92,231,0.3)', color: '#BFB5FF',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <IconMerge size={11} sw={1.7} />
            </div>
            <div style={{ fontSize: 12, fontWeight: 600 }}>Merge PDF</div>
          </div>
          <PrivacyBadge mode="local" />
        </div>
        <div style={{ background: '#0F0F0F', border: '1px solid var(--line)', borderRadius: 10, padding: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {['invoice-q4.pdf · 124 KB', 'invoice-q3.pdf · 98 KB'].map((t, i) => (
            <div key={i} style={{ padding: '8px 10px', background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 8, fontSize: 11, display: 'flex', alignItems: 'center', gap: 8 }}>
              <IconGrip size={10} color="var(--text-3)" />
              <PdfThumb color="#A78BFA" />
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t}</span>
            </div>
          ))}
        </div>
        <button className="pp-btn" style={{ width: '100%', justifyContent: 'center', marginTop: 10, padding: '8px' }}>
          Merge 2 files <IconArrow size={13} />
        </button>
      </div>
    </section>

    {/* Popular tools — 2 per row */}
    <section style={{ padding: '20px 20px 32px', borderTop: '1px solid var(--line)' }}>
      <div className="pp-mono" style={{ fontSize: 10.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#BFB5FF', marginBottom: 10 }}>
        Popular tools
      </div>
      <h2 style={{ fontSize: 24, letterSpacing: '-0.025em', marginBottom: 18 }}>
        Six tools cover the 90%.
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {['merge', 'compress', 'pdf-to-word', 'watermark', 'split', 'protect'].map(id => {
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
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, letterSpacing: '-0.01em' }}>{t.name}</div>
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
    <section style={{ padding: '32px 20px', borderTop: '1px solid var(--line)', background: 'var(--bg-2)' }}>
      <div className="pp-mono" style={{ fontSize: 10.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#BFB5FF', marginBottom: 10 }}>
        Why PlinyPDF
      </div>
      <h2 style={{ fontSize: 24, letterSpacing: '-0.025em', marginBottom: 20 }}>
        The PDF tool that <em style={{ fontStyle: 'italic', color: '#BFB5FF', fontWeight: 500 }}>respects</em> you.
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[
          { icon: 'IconShield', color: '#34D399', t: 'Privacy first', b: 'Nine of eleven tools run in your browser. Zero telemetry.' },
          { icon: 'IconSparkle', color: '#BFB5FF', t: 'AI summaries', b: 'Drop 200 pages, get the gist in seconds.' },
          { icon: 'IconGlobe', color: '#60A5FA', t: 'Multilingual', b: 'EN, TR, RU — fully localized, not machine-translated.' },
        ].map((c, i) => {
          const Ic = window[c.icon];
          return (
            <div key={i} className="pp-card" style={{ padding: 16, display: 'flex', gap: 12 }}>
              <div style={{
                width: 34, height: 34, borderRadius: 9,
                background: 'rgba(255,255,255,0.04)', border: '1px solid var(--line)',
                color: c.color, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Ic size={16} sw={1.7} />
              </div>
              <div>
                <div style={{ fontSize: 14.5, fontWeight: 600, marginBottom: 3, letterSpacing: '-0.015em' }}>{c.t}</div>
                <div style={{ fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.5 }}>{c.b}</div>
              </div>
            </div>
          );
        })}
      </div>
    </section>

    <section style={{
      padding: '40px 20px',
      background: 'radial-gradient(80% 100% at 50% 0%, rgba(107,92,231,0.2), rgba(107,92,231,0) 70%), var(--bg)',
      borderTop: '1px solid var(--line)',
      textAlign: 'center',
    }}>
      <h2 style={{ fontSize: 28, letterSpacing: '-0.03em', marginBottom: 10, textWrap: 'balance' }}>
        Your PDFs.<br />Your machine. Always.
      </h2>
      <p style={{ fontSize: 13.5, color: 'var(--text-2)', marginBottom: 20 }}>
        Try every tool — no signup needed.
      </p>
      <button className="pp-btn pp-btn-lg" style={{ width: '100%', justifyContent: 'center' }}>
        Start Free <IconArrow size={15} />
      </button>
    </section>

    <footer style={{ padding: '28px 20px', borderTop: '1px solid var(--line)', fontSize: 12, color: 'var(--text-3)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <PlinyMark size={20} color="var(--text)" />
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>PlinyPDF</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 16 }}>
        {['All tools', 'Pricing', 'Privacy', 'Blog', 'Türkçe', 'Русский'].map(l => <a key={l}>{l}</a>)}
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-3)', lineHeight: 1.5 }}>
        Named after Pliny the Elder, who organized human knowledge.
      </div>
    </footer>
  </div>
);

// ===== Merge 375 =====
const Mobile375Merge = () => (
  <div className="pp-board" style={{ width: 375, height: 1080, fontSize: 14, position: 'relative' }}>
    <StatusBar375 />
    <Navbar mobile />

    <section style={{ padding: '20px 20px 110px' }}>
      <Breadcrumb items={['Tools', 'Merge PDF']} />

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
        <div style={{
          width: 42, height: 42, borderRadius: 11,
          background: 'rgba(107,92,231,0.14)', border: '1px solid rgba(107,92,231,0.3)',
          color: '#BFB5FF',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <IconMerge size={20} sw={1.6} />
        </div>
        <div>
          <h1 style={{ fontSize: 24, letterSpacing: '-0.025em' }}>Merge PDF</h1>
          <p style={{ fontSize: 12.5, color: 'var(--text-2)', marginTop: 2 }}>
            Combine PDFs into one. Reorder by drag.
          </p>
        </div>
      </div>

      <PrivacyBadge mode="local" big />

      <div className="pp-drop" style={{ marginTop: 18, padding: '28px 16px' }}>
        <div style={{
          width: 42, height: 42, borderRadius: 11,
          background: 'rgba(255,255,255,0.04)', border: '1px solid var(--line)',
          color: 'var(--text-2)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 12,
        }}>
          <IconUpload size={18} sw={1.7} />
        </div>
        <div style={{ fontSize: 14.5, fontWeight: 500, marginBottom: 4, color: 'var(--text)' }}>
          Tap to browse files
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-2)' }}>
          PDF · multiple supported
        </div>
      </div>

      <div style={{ marginTop: 22 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 10 }}>
          <h3 style={{ fontSize: 13.5 }}>Files to merge</h3>
          <span className="pp-mono" style={{ fontSize: 11, color: 'var(--text-3)' }}>3 files · 78 p</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {MOCK_FILES.slice(0, 3).map((f, i) => (
            <div key={f.id} className="pp-filerow" style={{ padding: '10px 10px' }}>
              <span className="pp-mono" style={{ fontSize: 10.5, color: 'var(--text-3)' }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <IconGrip size={13} color="var(--text-3)" />
              <PdfThumb color={f.color} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</div>
                <div className="pp-mono" style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 1 }}>{f.size} · {f.pages}p</div>
              </div>
              <IconX size={12} color="var(--text-3)" />
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 24 }}>
        <details style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 12, overflow: 'hidden' }}>
          <summary style={{ padding: '14px 16px', cursor: 'pointer', fontSize: 13.5, fontWeight: 500, listStyle: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            How it works
            <IconChevron size={14} color="var(--text-2)" />
          </summary>
          <div style={{ padding: '0 16px 14px', fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.55 }}>
            Drop files → pdf-lib stitches them in your browser → download. No upload happens.
          </div>
        </details>
      </div>
    </section>

    {/* Sticky bottom CTA */}
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      padding: '12px 16px 18px',
      background: 'linear-gradient(180deg, transparent, var(--bg) 30%)',
      backdropFilter: 'blur(8px)',
    }}>
      <button className="pp-btn pp-btn-lg" style={{
        width: '100%', justifyContent: 'center',
        boxShadow: '0 12px 32px -12px rgba(107,92,231,0.6), 0 1px 0 rgba(255,255,255,0.12) inset',
      }}>
        Merge 3 files <IconArrow size={15} />
      </button>
      <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-3)', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
        <span className="pp-dot" style={{ color: '#34D399' }} />
        Processed in your browser
      </div>
    </div>
  </div>
);

// ===== Pricing 375 =====
const Mobile375Pricing = () => {
  const [yearly, setYearly] = React.useState(true);
  return (
    <div className="pp-board" style={{ width: 375, height: 1640, fontSize: 14 }}>
      <StatusBar375 />
      <Navbar mobile />
      <section style={{ padding: '32px 20px 20px', textAlign: 'center' }}>
        <div className="pp-mono" style={{ fontSize: 10.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#BFB5FF', marginBottom: 12 }}>
          Pricing
        </div>
        <h1 style={{ fontSize: 38, letterSpacing: '-0.035em', marginBottom: 12, lineHeight: 1.05, textWrap: 'balance' }}>
          Honest pricing.<br />
          <span style={{ color: 'var(--text-2)', fontWeight: 500 }}>One tier when you need more.</span>
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 22 }}>
          Free is enough for most people.
        </p>
        <div style={{ display: 'inline-flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          <PricingToggle yearly={yearly} setYearly={setYearly} />
        </div>
      </section>

      <section style={{ padding: '12px 20px 40px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <PlanCard plan="free" yearly={yearly} compact />
        <PlanCard plan="pro" yearly={yearly} compact />
        <div style={{ fontSize: 11.5, color: 'var(--text-3)', textAlign: 'center', marginTop: 6 }}>
          Cancel anytime · 14-day money back · Paddle billing
        </div>
      </section>

      <section style={{ padding: '32px 20px 60px', borderTop: '1px solid var(--line)' }}>
        <div className="pp-mono" style={{ fontSize: 10.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#BFB5FF', marginBottom: 10 }}>FAQ</div>
        <h2 style={{ fontSize: 24, letterSpacing: '-0.025em', marginBottom: 18 }}>The questions everyone asks.</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {FAQ_ITEMS.slice(0, 4).map((item, i) => (
            <details key={i} className="pp-card" style={{ padding: 0, overflow: 'hidden' }}>
              <summary style={{ padding: '16px 18px', cursor: 'pointer', fontSize: 14, fontWeight: 500, listStyle: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                {item.q}
                <IconChevron size={13} color="var(--text-2)" />
              </summary>
              <div style={{ padding: '0 18px 16px', fontSize: 13, color: 'var(--text-2)', lineHeight: 1.55 }}>
                {item.a}
              </div>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
};

Object.assign(window, { Mobile375Home, Mobile375Merge, Mobile375Pricing });
