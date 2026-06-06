// PlinyPDF — Pro Dashboard variant

const PRO_RECENT = [
  { name: 'Q4-financial-report-merged.pdf', tool: 'Merge PDF', icon: 'IconMerge', accent: '#A78BFA', mode: 'local', size: '7.2 MB', when: '2 min ago' },
  { name: 'investor-deck-2026.pdf', tool: 'Compress PDF', icon: 'IconCompress', accent: '#F472B6', mode: 'local', size: '4.8 → 1.9 MB', when: '1h ago' },
  { name: 'plinypdf-annual-2025.pdf', tool: 'AI Summary', icon: 'IconSparkle', accent: '#BFB5FF', mode: 'cloud', size: '24 pages', when: '3h ago' },
  { name: 'contract-signed.pdf', tool: 'Add Watermark', icon: 'IconWatermark', accent: '#F472B6', mode: 'local', size: '892 KB', when: 'Yesterday' },
  { name: 'meeting-notes.docx', tool: 'PDF to Word', icon: 'IconWord', accent: '#60A5FA', mode: 'cloud', size: '124 KB', when: 'Yesterday' },
  { name: 'scanned-receipts.pdf', tool: 'PDF to JPG', icon: 'IconImage', accent: '#60A5FA', mode: 'local', size: '12 images', when: '2 days ago' },
  { name: 'tax-2024-bundle.pdf', tool: 'Merge PDF', icon: 'IconMerge', accent: '#A78BFA', mode: 'local', size: '3.4 MB', when: '5 days ago' },
  { name: 'lease-agreement.pdf', tool: 'Password Protect', icon: 'IconLock', accent: '#34D399', mode: 'local', size: '480 KB', when: '12 days ago' },
];

const ProSidebar = () => (
  <aside style={{
    width: 240,
    borderRight: '1px solid var(--line)',
    padding: '28px 16px',
    display: 'flex', flexDirection: 'column', gap: 24,
  }}>
    {/* Pro status pill */}
    <div style={{
      padding: '10px 12px', borderRadius: 10,
      background: 'rgba(16,185,129,0.08)',
      border: '1px solid rgba(16,185,129,0.22)',
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#34D399', boxShadow: '0 0 8px #34D399' }} />
      <div>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: '#6EE7B7' }}>Pro — unlimited</div>
        <div className="pp-mono" style={{ fontSize: 10.5, color: 'var(--text-3)', marginTop: 1 }}>
          Renews 1 Jun 2026
        </div>
      </div>
    </div>

    <div>
      <div className="pp-mono" style={{ fontSize: 10.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-3)', padding: '0 12px', marginBottom: 8 }}>
        Library
      </div>
      <SidebarItem icon="IconClock" label="Recent" count={47} active />
      <SidebarItem icon="IconStar" label="Favorites" count={9} />
      <SidebarItem icon="IconFolder" label="History · 30 days" count={186} />
    </div>
    <div>
      <div className="pp-mono" style={{ fontSize: 10.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-3)', padding: '0 12px', marginBottom: 8 }}>
        Tools
      </div>
      {['Organize', 'Convert', 'Edit', 'Secure', 'AI'].map(cat => (
        <SidebarItem key={cat} label={cat} />
      ))}
    </div>
    <div style={{ marginTop: 'auto' }}>
      <SidebarItem icon="IconSettings" label="Settings" />
    </div>
  </aside>
);

const ProQuickTools = ['summarize', 'merge', 'compress', 'watermark', 'pdf-to-word', 'split', 'protect'];

const ProDashboardMain = () => (
  <main style={{ flex: 1, padding: '36px 40px 80px' }}>
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

    {/* Quick tools — first one is AI Summary w/ Early access */}
    <section style={{ marginBottom: 36 }}>
      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-2)', marginBottom: 14 }}>Most used</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 10 }}>
        {ProQuickTools.map(id => {
          const t = TOOLS.find(x => x.id === id);
          const Ic = window[t.icon];
          const isNew = id === 'summarize';
          return (
            <button key={id} style={{
              background: isNew
                ? 'linear-gradient(180deg, rgba(107,92,231,0.08), rgba(107,92,231,0.02))'
                : 'var(--card)',
              border: `1px solid ${isNew ? 'rgba(107,92,231,0.3)' : 'var(--line)'}`,
              borderRadius: 14,
              padding: '18px 12px',
              display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 12,
              cursor: 'pointer',
              textAlign: 'left',
              position: 'relative',
              transition: 'transform 0.15s, border-color 0.15s, background 0.15s',
            }} className="pp-quick">
              {isNew && (
                <span style={{
                  position: 'absolute', top: 8, right: 8,
                  fontSize: 9.5, fontWeight: 600, color: '#BFB5FF',
                  padding: '2px 6px', borderRadius: 999,
                  background: 'rgba(107,92,231,0.18)',
                  border: '1px solid rgba(107,92,231,0.3)',
                  letterSpacing: '0.06em', textTransform: 'uppercase',
                }}>Early access</span>
              )}
              <div style={{
                width: 34, height: 34, borderRadius: 9,
                background: 'rgba(255,255,255,0.04)', border: '1px solid var(--line)',
                color: t.accent,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Ic size={16} sw={1.7} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{t.name}</div>
                <div className="pp-mono" style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 3, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  {t.mode}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>

    {/* Recent + stats (no usage caps, instead stats card) */}
    <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 1fr', gap: 24 }}>
      <section>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <h2 style={{ fontSize: 18, letterSpacing: '-0.015em' }}>Recent activity</h2>
            <span className="pp-mono" style={{ fontSize: 11.5, color: 'var(--text-3)' }}>Last 30 days · 186 files</span>
          </div>
          <a style={{ fontSize: 13, color: 'var(--text-2)' }}>View history <IconArrow size={12} /></a>
        </div>
        <div className="pp-card" style={{ padding: 6 }}>
          {PRO_RECENT.map((f, i) => (
            <React.Fragment key={i}>
              <RecentRow f={f} />
              {i < PRO_RECENT.length - 1 && <hr className="pp-hr" style={{ margin: '0 16px' }} />}
            </React.Fragment>
          ))}
        </div>
      </section>

      <aside style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <h2 style={{ fontSize: 18, letterSpacing: '-0.015em' }}>This month</h2>
        <div className="pp-card" style={{ padding: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>
            {[
              { l: 'Files processed', v: '142', s: '+28% vs last' },
              { l: 'AI summaries', v: '17', s: 'Unlimited' },
              { l: 'Cloud minutes', v: '36', s: 'Unlimited' },
              { l: 'Storage saved', v: '2.1 GB', s: 'Through compress' },
            ].map((s, i) => (
              <div key={i}>
                <div className="pp-mono" style={{ fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 6 }}>
                  {s.l}
                </div>
                <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--text)', fontFamily: 'var(--font-display)' }}>
                  {s.v}
                </div>
                <div className="pp-mono" style={{ fontSize: 10.5, color: '#6EE7B7', marginTop: 2 }}>
                  {s.s}
                </div>
              </div>
            ))}
          </div>
          <hr className="pp-hr" />
          <div style={{ marginTop: 14, fontSize: 12.5, color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <IconBolt size={13} color="#BFB5FF" sw={1.7} />
            You're in the top <span style={{ color: 'var(--text)', fontWeight: 500 }}>3%</span> of Pro users this month.
          </div>
        </div>

        <div className="pp-card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14, marginBottom: 14, letterSpacing: '-0.015em' }}>Just shipped</h3>
          {[
            { t: 'AI Summary v2', s: '60s deletion · 3 modes' },
            { t: 'Watermark presets', s: 'Save your favorite stamps' },
            { t: 'Bulk compress', s: 'Drop a folder' },
          ].map((it, i) => (
            <a key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 0', borderBottom: i < 2 ? '1px solid var(--line)' : 'none',
              fontSize: 13,
            }}>
              <span className="pp-badge pro" style={{ padding: '1px 7px', fontSize: 10 }}>NEW</span>
              <div style={{ flex: 1 }}>
                <div style={{ color: 'var(--text)' }}>{it.t}</div>
                <div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{it.s}</div>
              </div>
              <IconArrow size={12} color="var(--text-3)" />
            </a>
          ))}
        </div>
      </aside>
    </div>
  </main>
);

const ProDashboardPage = () => (
  <div className="pp-board" style={{ width: 1440 }}>
    <Navbar active="dashboard" user={{ plan: 'PRO', initials: 'AM' }} />
    <div style={{ display: 'flex' }}>
      <ProSidebar />
      <ProDashboardMain />
    </div>
  </div>
);

Object.assign(window, { ProDashboardPage });
