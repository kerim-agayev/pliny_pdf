// PlinyPDF — Pricing page + PlanCard (shared with Homepage)

const PlanCard = ({ plan, yearly = false, compact = false }) => {
  const isPro = plan === 'pro';
  const price = isPro ? (yearly ? 39 : 4.99) : 0;
  const unit = isPro ? (yearly ? '/year' : '/month') : 'forever';

  const features = isPro ? [
    'Everything in Free',
    'Unlimited server tools (Word, OCR)',
    'Unlimited AI summaries',
    '30-day file history',
    'Priority processing queue',
    'Email support, 24h response',
    'Early access to new tools',
  ] : [
    'All local tools — unlimited',
    'Server tools · 10 per day',
    'AI summary · 2 per month',
    'No watermark, no ads',
    'No signup required',
    'Full EN / TR / RU UI',
  ];

  return (
    <div className="pp-card" style={{
      position: 'relative',
      padding: compact ? 28 : 36,
      borderColor: isPro ? 'var(--indigo-line)' : 'var(--line)',
      background: isPro
        ? 'linear-gradient(180deg, rgba(107,92,231,0.08), rgba(107,92,231,0) 60%), var(--card)'
        : 'var(--card)',
      boxShadow: isPro ? '0 0 0 1px var(--indigo-line), 0 20px 60px -30px rgba(107,92,231,0.4)' : 'none',
    }}>
      {isPro && (
        <div style={{
          position: 'absolute', top: -1, right: 20,
          padding: '4px 10px',
          background: 'var(--indigo)', borderRadius: '0 0 8px 8px',
          fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'white',
        }}>
          Most popular
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
        <h3 style={{ fontSize: 22, letterSpacing: '-0.02em' }}>
          {isPro ? 'Pro' : 'Free'}
        </h3>
        {isPro && yearly && (
          <span className="pp-badge" style={{ background: 'rgba(16,185,129,0.12)', borderColor: 'rgba(16,185,129,0.28)', color: '#6EE7B7' }}>
            Save 35%
          </span>
        )}
      </div>
      <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 22 }}>
        {isPro ? 'For frequent users who need server tools.' : 'For most people, for almost everything.'}
      </p>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 24 }}>
        <div style={{ fontSize: 48, fontWeight: 700, letterSpacing: '-0.04em', fontFamily: 'var(--font-display)' }}>
          ${price}
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-2)' }}>{unit}</div>
      </div>
      <button className="pp-btn" style={{
        width: '100%', justifyContent: 'center', padding: '12px',
        background: isPro ? 'var(--indigo)' : 'transparent',
        color: isPro ? 'white' : 'var(--text)',
        border: isPro ? 'none' : '1px solid var(--line-2)',
        boxShadow: isPro ? '0 1px 0 rgba(255,255,255,0.12) inset, 0 8px 20px -10px rgba(107,92,231,0.6)' : 'none',
      }}>
        {isPro ? 'Upgrade to Pro' : 'Start Free — No signup needed'}
      </button>
      <hr className="pp-hr" style={{ margin: '24px 0' }} />
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {features.map((f, i) => (
          <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, color: 'var(--text)' }}>
            <span className="pp-check" style={{ marginTop: 1 }}><IconCheck size={11} /></span>
            <span style={{ color: i === 0 && isPro ? 'var(--text-2)' : 'var(--text)' }}>{f}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

const PricingToggle = ({ yearly, setYearly }) => (
  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
    <div style={{
      display: 'flex', gap: 4, padding: 4,
      background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 999,
    }}>
      {['Monthly', 'Yearly'].map((label, i) => {
        const active = (i === 1) === yearly;
        return (
          <button key={label} onClick={() => setYearly(i === 1)} style={{
            padding: '7px 16px', borderRadius: 999, fontSize: 13, fontWeight: 500,
            border: 0, background: active ? 'rgba(255,255,255,0.08)' : 'transparent',
            color: active ? 'var(--text)' : 'var(--text-2)',
          }}>{label}</button>
        );
      })}
    </div>
    <span className="pp-badge" style={{ background: 'rgba(16,185,129,0.12)', borderColor: 'rgba(16,185,129,0.28)', color: '#6EE7B7' }}>
      Save 35% on yearly
    </span>
  </div>
);

const FAQ_ITEMS = [
  {
    q: 'How can processing really be local?',
    a: "We compile mature open-source libraries (qpdf, pdf.js, pdf-lib) to WebAssembly. They run inside your browser tab, which means the bytes of your PDF never travel over a network. You can verify this in your browser's DevTools → Network panel.",
  },
  {
    q: 'Why are some tools "Cloud"?',
    a: 'PDF → Word with OCR realistically needs a few GB of model weights and a real GPU. We do that server-side, delete the file within an hour, and never train on your documents.',
  },
  {
    q: 'Can I cancel any time?',
    a: 'Yes — one click in the dashboard. We bill through Paddle, so the cancellation is irreversible from our side (good thing). No reactivation emails, no win-back popups.',
  },
  {
    q: 'Do you offer team plans?',
    a: 'Not yet. We are a small team and want to nail the individual product first. If you need invoices for your company, the Pro plan supports VAT-compliant receipts.',
  },
  {
    q: 'What payment methods are supported?',
    a: 'All major cards, Apple Pay, Google Pay, SEPA, and iDEAL through Paddle. Turkish lira and Russian ruble are available with local pricing.',
  },
];

const FAQItem = ({ item, open, onClick }) => (
  <div className="pp-card" style={{ padding: 0, overflow: 'hidden' }}>
    <button onClick={onClick} style={{
      width: '100%', padding: '20px 24px', textAlign: 'left',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: 'transparent', border: 0, color: 'var(--text)',
      fontSize: 16, fontWeight: 500, letterSpacing: '-0.01em',
    }}>
      {item.q}
      <IconChevron size={16} color="var(--text-2)" style={{
        transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
        transition: 'transform 0.18s ease',
      }} />
    </button>
    {open && (
      <div style={{ padding: '0 24px 22px', color: 'var(--text-2)', fontSize: 14, lineHeight: 1.65, maxWidth: 720 }}>
        {item.a}
      </div>
    )}
  </div>
);

const PricingPage = () => {
  const [yearly, setYearly] = React.useState(true);
  const [openFAQ, setOpenFAQ] = React.useState(0);
  return (
    <div className="pp-board" style={{ width: 1440 }}>
      <Navbar active="pricing" />
      <section style={{ padding: '88px 40px 48px', textAlign: 'center' }}>
        <div className="pp-mono" style={{ fontSize: 11.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#BFB5FF', marginBottom: 14 }}>
          Pricing
        </div>
        <h1 style={{ fontSize: 64, letterSpacing: '-0.035em', marginBottom: 18, textWrap: 'balance' }}>
          Honest pricing.<br />
          <span style={{ color: 'var(--text-2)', fontWeight: 500 }}>One tier when you need more.</span>
        </h1>
        <p style={{ fontSize: 18, color: 'var(--text-2)', maxWidth: 520, margin: '0 auto 36px' }}>
          Free is enough for most people. Pro is for when you live in PDFs.
        </p>
        <PricingToggle yearly={yearly} setYearly={setYearly} />
      </section>

      <section style={{ padding: '24px 40px 96px' }}>
        <div style={{ maxWidth: 920, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <PlanCard plan="free" yearly={yearly} />
          <PlanCard plan="pro" yearly={yearly} />
        </div>
        <div style={{
          maxWidth: 920, margin: '24px auto 0',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20,
          fontSize: 13, color: 'var(--text-3)',
        }}>
          <span>Cancel anytime · No questions asked</span>
          <span>·</span>
          <span>Powered by Paddle · VAT-compliant invoices</span>
          <span>·</span>
          <span>14-day money back</span>
        </div>
      </section>

      <section style={{ padding: '64px 40px 120px', borderTop: '1px solid var(--line)' }}>
        <div style={{ maxWidth: 920, margin: '0 auto' }}>
          <div className="pp-mono" style={{ fontSize: 11.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#BFB5FF', marginBottom: 14 }}>
            FAQ
          </div>
          <h2 style={{ fontSize: 36, letterSpacing: '-0.025em', marginBottom: 36 }}>
            The questions everyone asks.
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {FAQ_ITEMS.map((item, i) => (
              <FAQItem key={i} item={item} open={openFAQ === i} onClick={() => setOpenFAQ(openFAQ === i ? -1 : i)} />
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

Object.assign(window, { PlanCard, PricingPage });
