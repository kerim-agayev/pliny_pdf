// PlinyPDF — shared chrome + data.

// ===== Tool catalog =====
const TOOLS = [
  { id: 'merge', name: 'Merge PDF', desc: 'Combine PDFs in any order, in one click.', cat: 'Organize', mode: 'local', icon: 'IconMerge', accent: '#A78BFA' },
  { id: 'split', name: 'Split PDF', desc: 'Extract pages or split a PDF into parts.', cat: 'Organize', mode: 'local', icon: 'IconSplit', accent: '#A78BFA' },
  { id: 'compress', name: 'Compress PDF', desc: 'Reduce file size while keeping quality.', cat: 'Edit', mode: 'local', icon: 'IconCompress', accent: '#F472B6' },
  { id: 'rotate', name: 'Rotate PDF', desc: 'Rotate pages — single or all at once.', cat: 'Organize', mode: 'local', icon: 'IconRotate', accent: '#A78BFA' },
  { id: 'pdf-to-jpg', name: 'PDF to JPG', desc: 'Convert each page to a JPG image.', cat: 'Convert', mode: 'local', icon: 'IconImage', accent: '#60A5FA' },
  { id: 'jpg-to-pdf', name: 'JPG to PDF', desc: 'Turn images into a single PDF.', cat: 'Convert', mode: 'local', icon: 'IconImageToPdf', accent: '#60A5FA' },
  { id: 'watermark', name: 'Add Watermark', desc: 'Stamp text or image with live preview.', cat: 'Edit', mode: 'local', icon: 'IconWatermark', accent: '#F472B6', tag: 'Live preview' },
  { id: 'protect', name: 'Password Protect', desc: 'Encrypt a PDF with a password.', cat: 'Secure', mode: 'local', icon: 'IconLock', accent: '#34D399' },
  { id: 'unlock', name: 'Remove Password', desc: 'Strip password if you own the file.', cat: 'Secure', mode: 'local', icon: 'IconUnlock', accent: '#34D399' },
  { id: 'pdf-to-word', name: 'PDF to Word', desc: 'High-fidelity DOCX with OCR support.', cat: 'Convert', mode: 'cloud', icon: 'IconWord', accent: '#60A5FA' },
  { id: 'word-to-pdf', name: 'Word to PDF', desc: 'DOCX in, perfectly formatted PDF out.', cat: 'Convert', mode: 'cloud', icon: 'IconWord', accent: '#60A5FA' },
  { id: 'summarize', name: 'AI Summary', desc: 'Outline or executive summary in seconds.', cat: 'AI', mode: 'cloud', icon: 'IconSparkle', accent: '#BFB5FF', tag: 'AI-powered' },
];

const CATEGORIES = ['All', 'Organize', 'Convert', 'Edit', 'Secure', 'AI'];

// ===== Theme toggle (sun/moon segmented) =====
const ThemeToggle = ({ theme = 'dark' }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 2, padding: 2,
    background: 'var(--card)', border: '1px solid var(--line)',
    borderRadius: 999,
  }}>
    {[{ k: 'light', icon: IconSun }, { k: 'dark', icon: IconMoon }].map(({ k, icon: Ic }) => {
      const active = theme === k;
      return (
        <button key={k} style={{
          width: 26, height: 26, borderRadius: 999, border: 0, cursor: 'pointer',
          background: active ? (k === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(107,92,231,0.14)') : 'transparent',
          color: active ? 'var(--text)' : 'var(--text-3)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background 0.15s, color 0.15s',
        }}>
          <Ic size={13} sw={1.8} />
        </button>
      );
    })}
  </div>
);

// ===== Navbar =====
const Navbar = ({ active = 'home', user = null, mobile = false, theme = 'dark', onMenu }) => {
  const navBg = theme === 'light' ? 'rgba(255,255,255,0.82)' : 'rgba(15,15,15,0.75)';
  if (mobile) {
    return (
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 20px', borderBottom: '1px solid var(--line)',
        position: 'sticky', top: 0, background: navBg,
        backdropFilter: 'blur(12px)', zIndex: 20,
      }}>
        <a style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <PlinyMark size={26} color="var(--text)" />
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, letterSpacing: '-0.02em' }}>
            PlinyPDF
          </span>
        </a>
        <button onClick={onMenu} style={{
          background: 'transparent', border: 0, padding: 8, color: 'var(--text)',
          display: 'flex', alignItems: 'center', cursor: 'pointer',
        }}>
          <IconMenu size={22} />
        </button>
      </header>
    );
  }
  return (
    <header style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '16px 40px', borderBottom: '1px solid var(--line)',
      position: 'sticky', top: 0, background: navBg,
      backdropFilter: 'blur(14px)', zIndex: 20,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 36 }}>
        <a style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <PlinyMark size={28} color="var(--text)" />
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17.5, letterSpacing: '-0.02em' }}>
            PlinyPDF
          </span>
        </a>
        <nav style={{ display: 'flex', gap: 4 }}>
          <a className="pp-nav-link" style={ active === 'tools' ? { color: 'var(--text)' } : {} }>Tools</a>
          <a className="pp-nav-link" style={ active === 'pricing' ? { color: 'var(--text)' } : {} }>Pricing</a>
          <a className="pp-nav-link">Blog</a>
          <a className="pp-nav-link" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            Docs
          </a>
        </nav>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {user ? (
          <>
            <ThemeToggle theme={theme} />
            <button className="pp-btn-ghost pp-btn" style={{ padding: '6px 10px', fontSize: 13 }}>
              <IconGlobe size={14} /> EN
            </button>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '4px 4px 4px 12px', border: '1px solid var(--line)',
              borderRadius: 999, background: 'var(--card)',
            }}>
              <span className="pp-mono" style={{
                fontSize: 10.5, letterSpacing: '0.06em',
                color: user.plan === 'PRO' ? '#BFB5FF' : 'var(--text-2)',
              }}>{user.plan}</span>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: 'linear-gradient(135deg, #6B5CE7, #EC4899)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 600, color: 'white',
              }}>{user.initials}</div>
            </div>
          </>
        ) : (
          <>
            <ThemeToggle theme={theme} />
            <a className="pp-nav-link" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <IconGlobe size={14} /> EN
            </a>
            <a className="pp-nav-link">Sign in</a>
            <button className="pp-btn">Start Free <IconArrow size={14} /></button>
          </>
        )}
      </div>
    </header>
  );
};

// ===== Tool card =====
const ToolCard = ({ tool, dotted = false, compact = false }) => {
  const Icon = window[tool.icon];
  return (
    <div className="pp-tool">
      <div className="arrow"><IconArrow size={16} /></div>
      {dotted && (
        <span style={{
          position: 'absolute', top: 18, left: 18, width: 6, height: 6, borderRadius: '50%',
          background: tool.accent, boxShadow: `0 0 8px ${tool.accent}`,
        }} />
      )}
      <div style={{
        width: 40, height: 40, borderRadius: 10,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid var(--line)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: tool.accent,
        marginBottom: compact ? 12 : 18,
        marginLeft: dotted ? 14 : 0,
      }}>
        <Icon size={20} sw={1.6} />
      </div>
      <h3 style={{ fontSize: compact ? 15 : 16, fontWeight: 600, marginBottom: 6, letterSpacing: '-0.015em' }}>
        {tool.name}
      </h3>
      <p style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--text-2)', marginBottom: 14 }}>
        {tool.desc}
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <PrivacyBadge mode={tool.mode} />
        {tool.tag && (
          <span className="pp-badge" style={{
            background: 'rgba(244,114,182,0.1)',
            borderColor: 'rgba(244,114,182,0.25)',
            color: '#F9A8D4',
          }}>
            <IconSparkle size={10} sw={2} /> {tool.tag}
          </span>
        )}
      </div>
    </div>
  );
};

// ===== Privacy badge =====
const PrivacyBadge = ({ mode = 'local', big = false }) => {
  if (big) {
    return (
      <div className={`pp-badge ${mode}`} style={{
        padding: '8px 14px', fontSize: 13, fontWeight: 500, borderRadius: 999,
      }}>
        <span className="pp-dot" style={{ width: 8, height: 8 }} />
        {mode === 'local'
          ? <>Local processing — your files never leave your browser</>
          : <>Cloud — processed securely, files deleted after 1 hour</>}
      </div>
    );
  }
  return (
    <span className={`pp-badge ${mode}`}>
      <span className="pp-dot" />
      {mode === 'local' ? 'Local' : 'Cloud'}
    </span>
  );
};

// ===== Footer =====
const Footer = () => (
  <footer style={{
    borderTop: '1px solid var(--line)',
    padding: '56px 40px 32px',
    background: 'var(--bg)',
  }}>
    <div style={{ maxWidth: 1240, margin: '0 auto' }}>
      <div style={{
        display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr 1fr', gap: 40,
        marginBottom: 48,
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <PlinyMark size={26} color="#F9FAFB" />
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16 }}>PlinyPDF</span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-2)', maxWidth: 260, lineHeight: 1.6 }}>
            Edit PDFs without uploading them. Named after Pliny the Elder, who organized human knowledge.
          </p>
        </div>
        {[
          ['Product', ['All tools', 'Pricing', 'Roadmap', 'Changelog']],
          ['Tools', ['Merge PDF', 'Compress PDF', 'PDF to Word', 'Watermark']],
          ['Company', ['About', 'Blog', 'Privacy', 'Terms']],
          ['Languages', ['English', 'Türkçe', 'Русский']],
        ].map(([t, items]) => (
          <div key={t}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 14 }}>
              {t}
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {items.map(i => (
                <li key={i}>
                  <a style={{ fontSize: 13.5, color: 'var(--text-2)' }}>{i}</a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <hr className="pp-hr" />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 24 }}>
        <div style={{ fontSize: 12.5, color: 'var(--text-3)' }}>
          © 2026 PlinyPDF · No telemetry · No trackers
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--text-3)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          Made with <IconHeart size={12} color="#F472B6" sw={2} /> for privacy
        </div>
      </div>
    </div>
  </footer>
);

// === Footer with tagline ===
// Already exists; add the Pliny the Elder tagline as a subtle subtitle.
Object.assign(window, { TOOLS, CATEGORIES, Navbar, ThemeToggle, ToolCard, PrivacyBadge, Footer });
