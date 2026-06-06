// PlinyPDF — Homepage (desktop)

const Hero = () => (
  <section className="pp-grad-hero" style={{ position: 'relative', overflow: 'hidden' }}>
    {/* subtle grid */}
    <div style={{
      position: 'absolute', inset: 0,
      backgroundImage:
        'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
      backgroundSize: '60px 60px',
      maskImage: 'radial-gradient(ellipse 70% 60% at 50% 30%, black 30%, transparent 80%)',
      pointerEvents: 'none',
    }} />
    <div style={{
      position: 'relative', maxWidth: 1100, margin: '0 auto',
      padding: '88px 40px 96px', textAlign: 'center',
    }}>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '6px 12px 6px 8px',
        background: 'rgba(255,255,255,0.04)', border: '1px solid var(--line-2)',
        borderRadius: 999, fontSize: 12.5, color: 'var(--text-2)',
        marginBottom: 28,
      }}>
        <span className="pp-badge local" style={{ padding: '2px 8px', fontSize: 10.5 }}>
          <span className="pp-dot" /> v2.4
        </span>
        AI summaries are now available · <span style={{ color: '#BFB5FF' }}>Read more <IconArrow size={11} /></span>
      </div>
      <h1 style={{
        fontSize: 76, lineHeight: 1.02, fontWeight: 700, letterSpacing: '-0.035em',
        marginBottom: 24, textWrap: 'balance',
      }}>
        Edit PDFs without<br />
        <span style={{
          background: 'linear-gradient(90deg, #BFB5FF 0%, #6B5CE7 60%, #34D399 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          fontStyle: 'italic', fontWeight: 600,
        }}>uploading them.</span>
      </h1>
      <p style={{
        fontSize: 19, lineHeight: 1.55, color: 'var(--text-2)', maxWidth: 620,
        margin: '0 auto 36px', textWrap: 'pretty',
      }}>
        All processing happens in your browser. Your files never touch our servers, our analytics, or our database.
      </p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 40 }}>
        <button className="pp-btn pp-btn-lg">Start Free — No signup <IconArrow size={16} /></button>
        <button className="pp-btn pp-btn-lg pp-btn-ghost">See all tools <IconArrow size={16} /></button>
      </div>
      <div style={{
        display: 'inline-flex', gap: 24, padding: '10px 6px',
        fontSize: 13.5, color: 'var(--text-2)',
      }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <span className="pp-dot" style={{ color: '#34D399' }} /> No uploads
        </span>
        <span style={{ color: 'var(--line-2)' }}>·</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <span className="pp-mono" style={{ color: '#BFB5FF' }}>∞</span> No limits
        </span>
        <span style={{ color: 'var(--line-2)' }}>·</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <IconX size={13} color="#F43F5E" sw={2} /> No watermark
        </span>
      </div>
    </div>
    {/* Floating product card */}
    <div style={{
      position: 'relative', maxWidth: 980, margin: '0 auto', padding: '0 40px 80px',
    }}>
      <HeroProductPreview />
    </div>
  </section>
);

// A glassy product card mimicking the merge tool to anchor the hero
const HeroProductPreview = () => (
  <div style={{
    position: 'relative',
    background: 'linear-gradient(180deg, #1A1A1A, #141414)',
    border: '1px solid var(--line-2)',
    borderRadius: 18,
    padding: 20,
    boxShadow: '0 40px 80px -30px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.04)',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8, background: 'rgba(107,92,231,0.14)',
          border: '1px solid rgba(107,92,231,0.3)', color: '#BFB5FF',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <IconMerge size={15} sw={1.7} />
        </div>
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 600 }}>Merge PDF</div>
          <div className="pp-mono" style={{ fontSize: 11, color: 'var(--text-3)' }}>plinypdf.com/merge</div>
        </div>
      </div>
      <PrivacyBadge mode="local" />
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>
      {/* file stack */}
      <div style={{
        background: '#0F0F0F', border: '1px solid var(--line)', borderRadius: 12, padding: 14,
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        {[
          { name: 'invoice-q4.pdf', size: '124 KB', pages: 2 },
          { name: 'invoice-q3.pdf', size: '98 KB', pages: 1 },
          { name: 'invoice-q2.pdf', size: '142 KB', pages: 3 },
        ].map((f, i) => (
          <div key={i} className="pp-filerow" style={{ padding: '10px 12px' }}>
            <IconGrip size={14} color="var(--text-3)" />
            <div style={{
              width: 28, height: 32, borderRadius: 4,
              background: 'linear-gradient(180deg, #2A1B47, #1A1228)',
              border: '1px solid rgba(107,92,231,0.3)',
              flexShrink: 0,
              display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
              paddingBottom: 3,
            }}>
              <span className="pp-mono" style={{ fontSize: 7, color: '#BFB5FF' }}>PDF</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</div>
              <div className="pp-mono" style={{ fontSize: 10.5, color: 'var(--text-3)' }}>{f.size} · {f.pages} pages</div>
            </div>
            <IconX size={13} color="var(--text-3)" />
          </div>
        ))}
        <div style={{
          marginTop: 4, padding: '10px 12px', border: '1.5px dashed var(--line-2)',
          borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8,
          justifyContent: 'center', color: 'var(--text-3)', fontSize: 12.5,
        }}>
          <IconPlus size={13} /> Drop more PDFs
        </div>
      </div>
      {/* CTA + result */}
      <div style={{
        background: '#0F0F0F', border: '1px solid var(--line)', borderRadius: 12, padding: 14,
        display: 'flex', flexDirection: 'column', gap: 12,
      }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)' }}>
          Output
        </div>
        <div style={{
          flex: 1, borderRadius: 8,
          background: 'linear-gradient(180deg, rgba(107,92,231,0.16), rgba(107,92,231,0.02))',
          border: '1px solid rgba(107,92,231,0.3)',
          padding: 12, display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="pp-check"><IconCheck size={11} /></span>
            <div style={{ fontSize: 12.5, fontWeight: 500 }}>merged.pdf</div>
          </div>
          <div className="pp-mono" style={{ fontSize: 10.5, color: 'var(--text-3)' }}>
            6 pages · 364 KB · 0.4 s
          </div>
          <div style={{ flex: 1 }} />
          <button className="pp-btn" style={{ width: '100%', justifyContent: 'center', padding: '9px' }}>
            <IconDownload size={14} /> Download
          </button>
        </div>
        <div className="pp-mono" style={{
          fontSize: 10.5, color: 'var(--text-3)',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <span className="pp-dot" style={{ color: '#34D399' }} /> Processed in your browser
        </div>
      </div>
    </div>
  </div>
);

const SectionLabel = ({ children, kicker }) => (
  <div style={{ marginBottom: 36 }}>
    {kicker && (
      <div className="pp-mono" style={{ fontSize: 11.5, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#BFB5FF', marginBottom: 12 }}>
        {kicker}
      </div>
    )}
    {children}
  </div>
);

const PopularTools = () => {
  const popular = ['merge', 'compress', 'pdf-to-word', 'watermark', 'split', 'protect'];
  const items = popular.map(id => TOOLS.find(t => t.id === id));
  return (
    <section style={{ padding: '96px 40px', borderTop: '1px solid var(--line)' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 44, gap: 40 }}>
          <SectionLabel kicker="Popular tools">
            <h2 style={{ fontSize: 40, letterSpacing: '-0.025em' }}>
              Six tools cover the&nbsp;90%.
            </h2>
          </SectionLabel>
          <a style={{ fontSize: 14, color: 'var(--text-2)', display: 'inline-flex', alignItems: 'center', gap: 6, paddingBottom: 8, flexShrink: 0 }}>
            See all 11 tools <IconArrow size={14} />
          </a>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {items.map(t => <ToolCard key={t.id} tool={t} />)}
        </div>
      </div>
    </section>
  );
};

const WhySection = () => (
  <section style={{ padding: '96px 40px', borderTop: '1px solid var(--line)', background: 'var(--bg-2)' }}>
    <div style={{ maxWidth: 1180, margin: '0 auto' }}>
      <SectionLabel kicker="Why PlinyPDF">
        <h2 style={{ fontSize: 40, letterSpacing: '-0.025em', maxWidth: 700 }}>
          The PDF tool that <em style={{ fontStyle: 'italic', color: '#BFB5FF', fontWeight: 500 }}>respects</em> you.
        </h2>
      </SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginTop: 32 }}>
        {[
          {
            icon: 'IconShield', accent: '#34D399',
            title: 'Privacy first',
            body: 'Nine of eleven tools run entirely in your browser via WebAssembly. The server tools delete files within an hour. We collect zero analytics.',
            sub: 'No uploads · No tracking · No cookies',
          },
          {
            icon: 'IconSparkle', accent: '#BFB5FF',
            title: 'AI-powered summaries',
            body: 'Drop a 200-page report and get the gist in seconds. Outline mode, executive summary, or per-section. Runs on your prompt, not on your data.',
            sub: '2 free per month · Unlimited on Pro',
          },
          {
            icon: 'IconGlobe', accent: '#60A5FA',
            title: 'Multilingual UI',
            body: 'Full interface in English, Türkçe, and Русский — with localized error messages, date formats, and document conventions baked in.',
            sub: 'EN · TR · RU',
          },
        ].map((c, i) => {
          const Ic = window[c.icon];
          return (
            <div key={i} className="pp-card" style={{ padding: 28 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 11,
                background: 'rgba(255,255,255,0.04)', border: '1px solid var(--line)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: c.accent, marginBottom: 20,
              }}>
                <Ic size={22} sw={1.6} />
              </div>
              <h3 style={{ fontSize: 19, marginBottom: 10, letterSpacing: '-0.02em' }}>{c.title}</h3>
              <p style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 18 }}>{c.body}</p>
              <div className="pp-mono" style={{ fontSize: 11.5, color: 'var(--text-3)', borderTop: '1px solid var(--line)', paddingTop: 14 }}>
                {c.sub}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  </section>
);

const PricingPreview = () => (
  <section style={{ padding: '96px 40px', borderTop: '1px solid var(--line)' }}>
    <div style={{ maxWidth: 1180, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 44, gap: 40 }}>
        <SectionLabel kicker="Pricing">
          <h2 style={{ fontSize: 40, letterSpacing: '-0.025em' }}>
            Free is generous. Pro is&nbsp;cheap.
          </h2>
        </SectionLabel>
        <a style={{ fontSize: 14, color: 'var(--text-2)', display: 'inline-flex', alignItems: 'center', gap: 6, paddingBottom: 8 }}>
          See full comparison <IconArrow size={14} />
        </a>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <PlanCard plan="free" compact />
        <PlanCard plan="pro" compact />
      </div>
    </div>
  </section>
);

const FooterCTA = () => (
  <section style={{
    padding: '120px 40px',
    background:
      'radial-gradient(60% 100% at 50% 0%, rgba(107,92,231,0.22) 0%, rgba(107,92,231,0) 70%), var(--bg)',
    borderTop: '1px solid var(--line)',
    textAlign: 'center',
  }}>
    <h2 style={{ fontSize: 56, letterSpacing: '-0.03em', marginBottom: 20, textWrap: 'balance' }}>
      Your PDFs.<br />Your machine. Always.
    </h2>
    <p style={{ fontSize: 17, color: 'var(--text-2)', maxWidth: 520, margin: '0 auto 32px' }}>
      Try every tool, no signup required. Pro unlocks server-side conversion and unlimited AI.
    </p>
    <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
      <button className="pp-btn pp-btn-lg">Start Free <IconArrow size={16} /></button>
      <button className="pp-btn pp-btn-lg pp-btn-ghost">View pricing</button>
    </div>
  </section>
);

const Homepage = () => (
  <div className="pp-board" style={{ width: 1440 }}>
    <Navbar active="home" />
    <Hero />
    <PopularTools />
    <WhySection />
    <PricingPreview />
    <FooterCTA />
    <Footer />
  </div>
);

Object.assign(window, { Homepage, HeroProductPreview, PopularTools });
