// PlinyPDF — Dashboard (logged-in user)

const RECENT_FILES = [
  { name: 'Q4-financial-report-merged.pdf', tool: 'Merge PDF', icon: 'IconMerge', accent: '#A78BFA', mode: 'local', size: '7.2 MB', when: '2 min ago' },
  { name: 'investor-deck-2026.pdf', tool: 'Compress PDF', icon: 'IconCompress', accent: '#F472B6', mode: 'local', size: '4.8 → 1.9 MB', when: '1h ago' },
  { name: 'contract-signed.pdf', tool: 'Add Watermark', icon: 'IconWatermark', accent: '#F472B6', mode: 'local', size: '892 KB', when: 'Yesterday' },
  { name: 'meeting-notes.docx', tool: 'PDF to Word', icon: 'IconWord', accent: '#60A5FA', mode: 'cloud', size: '124 KB', when: 'Yesterday' },
  { name: 'scanned-receipts.pdf', tool: 'PDF to JPG', icon: 'IconImage', accent: '#60A5FA', mode: 'local', size: '12 images', when: '2 days ago' },
];

const QUICK_TOOLS = ['merge', 'compress', 'watermark', 'pdf-to-word', 'split', 'protect'];

const SidebarItem = ({ icon, label, count, active }) => {
  const Ic = icon ? window[icon] : null;
  return (
    <a style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '8px 12px', borderRadius: 8,
      background: active ? 'rgba(255,255,255,0.05)' : 'transparent',
      color: active ? 'var(--text)' : 'var(--text-2)',
      fontSize: 13.5,
      transition: 'background 0.12s',
      cursor: 'pointer',
    }}>
      {Ic && <Ic size={15} sw={1.7} color={active ? '#BFB5FF' : 'currentColor'} />}
      <span style={{ flex: 1 }}>{label}</span>
      {count !== undefined && (
        <span className="pp-mono" style={{ fontSize: 11, color: 'var(--text-3)' }}>{count}</span>
      )}
    </a>
  );
};

const Sidebar = () => (
  <aside style={{
    width: 240,
    borderRight: '1px solid var(--line)',
    padding: '28px 16px',
    display: 'flex', flexDirection: 'column', gap: 28,
  }}>
    <div>
      <div className="pp-mono" style={{ fontSize: 10.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-3)', padding: '0 12px', marginBottom: 8 }}>
        Library
      </div>
      <SidebarItem icon="IconClock" label="Recent" count={12} active />
      <SidebarItem icon="IconStar" label="Favorites" count={3} />
      <SidebarItem icon="IconFolder" label="History" count={47} />
    </div>
    <div>
      <div className="pp-mono" style={{ fontSize: 10.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-3)', padding: '0 12px', marginBottom: 8 }}>
        Tools
      </div>
      {['Organize', 'Convert', 'Edit', 'Secure'].map(cat => (
        <SidebarItem key={cat} label={cat} />
      ))}
    </div>
    <div style={{ marginTop: 'auto' }}>
      <SidebarItem icon="IconSettings" label="Settings" />
    </div>
  </aside>
);

const UsageCard = ({ label, used, total, color, sub }) => (
  <div className="pp-card" style={{ padding: 18 }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
      <div style={{ fontSize: 13, color: 'var(--text-2)' }}>{label}</div>
      <div className="pp-mono" style={{ fontSize: 12, color: 'var(--text)' }}>
        <span style={{ color }}>{used}</span>
        <span style={{ color: 'var(--text-3)' }}> / {total}</span>
      </div>
    </div>
    <div className="pp-progress">
      <span style={{ width: `${(used / total) * 100}%`, background: `linear-gradient(90deg, ${color}, ${color}99)` }} />
    </div>
    <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 10 }}>{sub}</div>
  </div>
);

const RecentRow = ({ f }) => {
  const Ic = window[f.icon];
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 16,
      padding: '14px 16px',
      borderRadius: 12,
      transition: 'background 0.12s',
    }} className="pp-related">
      <div style={{
        width: 36, height: 36, borderRadius: 9,
        background: 'rgba(255,255,255,0.04)', border: '1px solid var(--line)',
        color: f.accent,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Ic size={17} sw={1.7} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {f.name}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>{f.tool}</span>
          <span>·</span>
          <span className="pp-mono">{f.size}</span>
        </div>
      </div>
      <PrivacyBadge mode={f.mode} />
      <div className="pp-mono" style={{ fontSize: 12, color: 'var(--text-3)', width: 88, textAlign: 'right' }}>
        {f.when}
      </div>
      <button style={{
        width: 30, height: 30, borderRadius: 8, background: 'transparent',
        border: '1px solid var(--line)', color: 'var(--text-2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
      }}>
        <IconDownload size={13} />
      </button>
    </div>
  );
};

const QuickToolButton = ({ id }) => {
  const t = TOOLS.find(x => x.id === id);
  const Ic = window[t.icon];
  return (
    <button style={{
      background: 'var(--card)',
      border: '1px solid var(--line)',
      borderRadius: 14,
      padding: '20px 14px',
      display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 14,
      cursor: 'pointer',
      transition: 'transform 0.15s, border-color 0.15s, background 0.15s',
      textAlign: 'left',
    }} className="pp-quick">
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: 'rgba(255,255,255,0.04)', border: '1px solid var(--line)',
        color: t.accent,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Ic size={17} sw={1.7} />
      </div>
      <div>
        <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--text)' }}>{t.name}</div>
        <div className="pp-mono" style={{ fontSize: 10.5, color: 'var(--text-3)', marginTop: 4, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          {t.mode}
        </div>
      </div>
    </button>
  );
};

const DashboardMain = () => (
  <main style={{ flex: 1, padding: '36px 40px 80px', overflow: 'hidden' }}>
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 32 }}>
      <div>
        <div className="pp-mono" style={{ fontSize: 11.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 8 }}>
          Tuesday · 21 May 2026
        </div>
        <h1 style={{ fontSize: 32, letterSpacing: '-0.025em' }}>
          Good morning, Aslan.
        </h1>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button className="pp-btn pp-btn-ghost">
          <IconSearch size={14} /> Search files
          <span className="pp-mono" style={{ fontSize: 10.5, padding: '1px 6px', background: 'rgba(255,255,255,0.06)', borderRadius: 4, marginLeft: 6 }}>⌘K</span>
        </button>
        <button className="pp-btn">
          <IconPlus size={14} /> New
        </button>
      </div>
    </div>

    {/* Quick tools */}
    <section style={{ marginBottom: 36 }}>
      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-2)', marginBottom: 14 }}>Most used</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12 }}>
        {QUICK_TOOLS.map(id => <QuickToolButton key={id} id={id} />)}
      </div>
    </section>

    {/* Recent + Usage */}
    <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 1fr', gap: 24 }}>
      <section>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
          <h2 style={{ fontSize: 18, letterSpacing: '-0.015em' }}>Recent activity</h2>
          <a style={{ fontSize: 13, color: 'var(--text-2)' }}>View all <IconArrow size={12} /></a>
        </div>
        <div className="pp-card" style={{ padding: 6 }}>
          {RECENT_FILES.map((f, i) => (
            <React.Fragment key={i}>
              <RecentRow f={f} />
              {i < RECENT_FILES.length - 1 && <hr className="pp-hr" style={{ margin: '0 16px' }} />}
            </React.Fragment>
          ))}
        </div>
      </section>

      <aside style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <h2 style={{ fontSize: 18, letterSpacing: '-0.015em', marginBottom: 0 }}>Your usage</h2>
        <UsageCard
          label="Server tools today"
          used={7} total={10} color="#6B5CE7"
          sub="Resets at midnight UTC · 3 left"
        />
        <UsageCard
          label="AI summaries this month"
          used={1} total={2} color="#F472B6"
          sub="Resets on 1 June · 1 left"
        />
        {/* Subtle upgrade */}
        <div style={{
          marginTop: 8,
          padding: 20,
          background: 'linear-gradient(180deg, rgba(107,92,231,0.1), rgba(107,92,231,0.02))',
          border: '1px solid rgba(107,92,231,0.22)',
          borderRadius: 14,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <IconBolt size={14} color="#BFB5FF" sw={1.7} />
            <div style={{ fontSize: 13, fontWeight: 600, color: '#BFB5FF', letterSpacing: '-0.01em' }}>
              Unlock unlimited
            </div>
          </div>
          <p style={{ fontSize: 12.5, lineHeight: 1.55, color: 'var(--text-2)', marginBottom: 12 }}>
            Pro removes daily caps on server tools and gives you unlimited AI summaries. $4.99/month.
          </p>
          <a style={{ fontSize: 12.5, color: '#BFB5FF', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            Upgrade to Pro <IconArrow size={11} />
          </a>
        </div>
      </aside>
    </div>
  </main>
);

const DashboardPage = () => (
  <div className="pp-board" style={{ width: 1440 }}>
    <Navbar active="dashboard" user={{ plan: 'FREE', initials: 'AM' }} />
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <DashboardMain />
    </div>
  </div>
);

// quick hover style
if (!document.getElementById('pp-dash-anim')) {
  const s = document.createElement('style');
  s.id = 'pp-dash-anim';
  s.textContent = `
    .pp-quick:hover { transform: translateY(-1px); border-color: var(--line-2) !important; background: var(--card-hi) !important; }
  `;
  document.head.appendChild(s);
}

Object.assign(window, { DashboardPage });
