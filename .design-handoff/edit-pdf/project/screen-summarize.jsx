// PlinyPDF — AI Summary tool

const SUMMARY_PARAS = [
  "PlinyPDF's 2025 annual report frames the year as a pivot from a feature-led product to a privacy-led one. Of the eleven new tools shipped, nine run entirely on the client via WebAssembly — a deliberate architectural commitment that the team argues will define the next decade of consumer software.",
  "Revenue grew 247% year-over-year, driven mostly by individual Pro subscriptions in markets where existing PDF tools require Google or Microsoft accounts. Turkish lira and Russian ruble billing was added in Q2 and now accounts for 23% of new sign-ups.",
  "The team remains small — twelve people, no managers, distributed across six time zones. The report attributes shipping velocity to a long-standing internal policy of \"no synchronous standups\" and a Pliny-the-Elder-style commitment to organizing knowledge before producing it.",
  "Looking forward, the report flags three priorities for 2026: server-side OCR with stricter retention, an open audit of the WebAssembly bundles, and a stand-alone macOS app for users who never want to open a browser again.",
];

const OUTLINE_ITEMS = [
  { lvl: 1, t: "Letter from the founder", p: 2 },
  { lvl: 2, t: "What changed in 2025", p: 4 },
  { lvl: 1, t: "Product", p: 6 },
  { lvl: 2, t: "Eleven new tools, nine of them local", p: 7 },
  { lvl: 2, t: "AI Summary: how we built it without storing data", p: 11 },
  { lvl: 2, t: "Multilingual launch (TR, RU)", p: 14 },
  { lvl: 1, t: "Business", p: 16 },
  { lvl: 2, t: "Revenue growth and retention", p: 17 },
  { lvl: 2, t: "Why we don't take VC money", p: 19 },
  { lvl: 1, t: "Team & culture", p: 21 },
  { lvl: 1, t: "Roadmap for 2026", p: 23 },
];

const AISummaryTool = () => {
  const [tab, setTab] = React.useState('executive');
  return (
    <section style={{ padding: '40px 40px 96px' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <Breadcrumb items={['Home', 'Tools', 'AI Summary']} />

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 13,
            background: 'linear-gradient(135deg, rgba(107,92,231,0.2), rgba(244,114,182,0.14))',
            border: '1px solid rgba(107,92,231,0.3)',
            color: '#BFB5FF',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <IconSparkle size={24} sw={1.6} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <h1 style={{ fontSize: 36, letterSpacing: '-0.025em' }}>AI Summary</h1>
              <span className="pp-badge" style={{
                background: 'rgba(107,92,231,0.14)', borderColor: 'rgba(107,92,231,0.3)', color: '#BFB5FF',
              }}>
                <IconSparkle size={10} sw={2} /> AI-powered
              </span>
              <PrivacyBadge mode="cloud" />
            </div>
            <p style={{ fontSize: 14.5, color: 'var(--text-2)' }}>
              Get the gist of any PDF in seconds. Outline, executive summary, or per-section.
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 32, marginTop: 32 }}>
          {/* Main */}
          <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 18 }}>
            {/* File info panel */}
            <div style={{
              background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 14,
              padding: 20, alignSelf: 'start',
            }}>
              <div style={{
                width: '100%', aspectRatio: '0.78',
                background: 'linear-gradient(180deg, #2A1B47, #1A1228)',
                border: '1px solid rgba(107,92,231,0.3)', borderRadius: 8,
                padding: 14, marginBottom: 14,
                display: 'flex', flexDirection: 'column', gap: 4,
                position: 'relative', overflow: 'hidden',
              }}>
                <div className="pp-mono" style={{ fontSize: 8.5, color: '#BFB5FF', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 6 }}>
                  PlinyPDF · 2025
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700, color: 'white', lineHeight: 1.15, marginBottom: 8, letterSpacing: '-0.01em' }}>
                  Annual Report
                </div>
                {[1, 0.9, 0.7, 0.85, 0.5].map((w, i) => (
                  <div key={i} style={{ height: 2, width: `${w * 100}%`, background: 'rgba(255,255,255,0.3)', borderRadius: 1 }} />
                ))}
                <div style={{ marginTop: 'auto' }}>
                  <div style={{ height: 16, background: 'rgba(107,92,231,0.4)', borderRadius: 2, width: '60%' }} />
                </div>
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--text)', marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                plinypdf-annual-2025.pdf
              </div>
              <div className="pp-mono" style={{ fontSize: 11.5, color: 'var(--text-3)', marginBottom: 14 }}>
                24 pages · 2.4 MB
              </div>
              <hr className="pp-hr" />
              <div style={{ marginTop: 14, fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span>Detected language</span><span className="pp-mono" style={{ color: 'var(--text)' }}>English</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span>Word count</span><span className="pp-mono" style={{ color: 'var(--text)' }}>~8,400</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Reading time</span><span className="pp-mono" style={{ color: 'var(--text)' }}>32 min</span>
                </div>
              </div>
              <button className="pp-btn pp-btn-ghost" style={{ width: '100%', justifyContent: 'center', marginTop: 16, fontSize: 12.5, padding: '8px' }}>
                <IconRefresh size={13} /> Summarize again
              </button>
            </div>

            {/* Summary panel */}
            <div className="pp-card" style={{ padding: 0, overflow: 'hidden' }}>
              {/* Tabs */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 20px', borderBottom: '1px solid var(--line)',
              }}>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[
                    { id: 'executive', label: 'Executive summary' },
                    { id: 'outline', label: 'Outline' },
                    { id: 'sections', label: 'Per section' },
                  ].map(t => {
                    const active = tab === t.id;
                    return (
                      <button key={t.id} onClick={() => setTab(t.id)} style={{
                        padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500,
                        background: active ? 'rgba(107,92,231,0.14)' : 'transparent',
                        color: active ? '#BFB5FF' : 'var(--text-2)',
                        border: active ? '1px solid rgba(107,92,231,0.3)' : '1px solid transparent',
                        cursor: 'pointer',
                      }}>{t.label}</button>
                    );
                  })}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="pp-mono" style={{ fontSize: 10.5, color: 'var(--text-3)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    Generated in 4.2s
                  </span>
                  <button style={{
                    background: 'transparent', border: '1px solid var(--line)', color: 'var(--text-2)',
                    padding: '6px 10px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                  }}>
                    <IconCopy size={13} /> Copy
                  </button>
                </div>
              </div>

              <div style={{ padding: 28 }}>
                {tab === 'executive' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 18, fontSize: 15, lineHeight: 1.7, color: 'var(--text)' }}>
                    {SUMMARY_PARAS.map((p, i) => (
                      <p key={i} style={{ color: i === 0 ? 'var(--text)' : 'var(--text-2)' }}>{p}</p>
                    ))}
                  </div>
                )}
                {tab === 'outline' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {OUTLINE_ITEMS.map((it, i) => (
                      <a key={i} style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: `8px ${it.lvl === 2 ? 28 : 12}px`,
                        borderRadius: 8,
                        fontSize: it.lvl === 1 ? 14.5 : 13.5,
                        fontWeight: it.lvl === 1 ? 500 : 400,
                        color: it.lvl === 1 ? 'var(--text)' : 'var(--text-2)',
                        transition: 'background 0.12s',
                      }} className="pp-related">
                        <span style={{ flex: 1 }}>{it.t}</span>
                        <span className="pp-mono" style={{ fontSize: 11, color: 'var(--text-3)' }}>p.{it.p}</span>
                      </a>
                    ))}
                  </div>
                )}
                {tab === 'sections' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
                    {[
                      { t: 'Letter from the founder', p: '2–5', s: 'A short manifesto on local-first software. Reaffirms the 12-person team size as a deliberate constraint, not a milestone.' },
                      { t: 'Product', p: '6–15', s: 'Eleven tools shipped; nine run client-side on WebAssembly. AI Summary launched in Q3 with strict 60-second retention. Turkish and Russian UI complete.' },
                      { t: 'Business', p: '16–20', s: 'Revenue +247% YoY. No VC funding raised in 2025 — explicitly off the table. Pro plan now supports SEPA, iDEAL, and local TR/RU currencies.' },
                      { t: 'Roadmap 2026', p: '23–24', s: 'Three priorities: server-side OCR with audit, public verification of WebAssembly bundles, stand-alone macOS app.' },
                    ].map((s, i) => (
                      <div key={i}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{s.t}</div>
                          <span className="pp-mono" style={{ fontSize: 11, color: 'var(--text-3)' }}>p. {s.p}</span>
                        </div>
                        <p style={{ fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.6 }}>{s.s}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Free-tier nudge */}
              <div style={{
                padding: '14px 20px', borderTop: '1px solid var(--line)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'rgba(255,255,255,0.015)',
              }}>
                <div style={{ fontSize: 12.5, color: 'var(--text-2)' }}>
                  <span className="pp-mono" style={{ color: 'var(--text)' }}>1</span> of 2 free summaries used this month
                </div>
                <a style={{ fontSize: 12.5, color: '#BFB5FF', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  Upgrade for unlimited <IconArrow size={11} />
                </a>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <aside style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <HowItWorks />
            <div style={{
              padding: 18,
              background: 'rgba(59,130,246,0.06)',
              border: '1px solid rgba(59,130,246,0.2)',
              borderRadius: 14,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <IconShield size={15} color="#60A5FA" sw={1.7} />
                <div style={{ fontSize: 13.5, fontWeight: 600, color: '#93C5FD' }}>How we handle your text</div>
              </div>
              <p style={{ fontSize: 12.5, lineHeight: 1.55, color: 'var(--text-2)' }}>
                Text is sent to our AI for summarization — never stored in a database, never used to train models. Deleted within 60 seconds.
              </p>
            </div>
            <RelatedTools />
          </aside>
        </div>
      </div>
    </section>
  );
};

const SummarizePage = () => (
  <div className="pp-board" style={{ width: 1440 }}>
    <Navbar active="tools" />
    <AISummaryTool />
    <Footer />
  </div>
);

Object.assign(window, { SummarizePage, AISummaryTool });
