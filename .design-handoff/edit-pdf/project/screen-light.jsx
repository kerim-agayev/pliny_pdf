// PlinyPDF — Light mode wrappers
// These reuse the existing screen components but apply the pp-light class
// on the .pp-board root. That triggers the CSS overrides in brand.css.
//
// We also pass theme="light" to Navbar so the sun/moon toggle renders correctly.

const HomepageLight = () => (
  <div className="pp-board pp-light" style={{ width: 1440 }}>
    <Navbar active="home" theme="light" />
    <Hero />
    <PopularTools />
    <Footer />
  </div>
);

const MergePageLight = () => (
  <div className="pp-board pp-light" style={{ width: 1440 }}>
    <Navbar active="tools" theme="light" />
    <MergeTool />
    <Footer />
  </div>
);

const PricingPageLight = () => {
  const [yearly, setYearly] = React.useState(true);
  const [openFAQ, setOpenFAQ] = React.useState(0);
  return (
    <div className="pp-board pp-light" style={{ width: 1440 }}>
      <Navbar active="pricing" theme="light" />
      <section style={{ padding: '88px 40px 48px', textAlign: 'center' }}>
        <div className="pp-mono" style={{ fontSize: 11.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#4F3FCB', marginBottom: 14 }}>
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
          <div className="pp-mono" style={{ fontSize: 11.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#4F3FCB', marginBottom: 14 }}>
            FAQ
          </div>
          <h2 style={{ fontSize: 36, letterSpacing: '-0.025em', marginBottom: 36 }}>
            The questions everyone asks.
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {FAQ_ITEMS.slice(0, 4).map((item, i) => (
              <FAQItem key={i} item={item} open={openFAQ === i} onClick={() => setOpenFAQ(openFAQ === i ? -1 : i)} />
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

Object.assign(window, { HomepageLight, MergePageLight, PricingPageLight });
