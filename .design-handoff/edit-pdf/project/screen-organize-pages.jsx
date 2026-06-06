// PlinyPDF — Organize Pages (drag-reorder grid, multi-select, floating toolbar)

const ORGANIZE_PAGES = [
  { id: 'p1', variant: 'report', rot: 0 },
  { id: 'p2', variant: 'report', rot: 0 },
  { id: 'p3', variant: 'legal', rot: 0 },
  { id: 'p4', variant: 'legal', rot: 0 },
  { id: 'p5', variant: 'financial', rot: 0 },
  { id: 'p6', variant: 'financial', rot: 0 },
  { id: 'p7', variant: 'technical', rot: 0 },
  { id: 'p8', variant: 'technical', rot: 0 },
  { id: 'p9', variant: 'report', rot: 0 },
  { id: 'p10', variant: 'legal', rot: 0 },
  { id: 'p11', variant: 'financial', rot: 0 },
  { id: 'p12', variant: 'technical', rot: 0 },
];

const FloatingToolbar = ({ count, onAction }) => (
  <div style={{
    position: 'sticky', top: 84, zIndex: 15,
    margin: '0 auto 20px', width: 'fit-content',
    display: 'flex', alignItems: 'center', gap: 4,
    padding: 6,
    background: 'var(--card-hi)', border: '1px solid var(--line-2)', borderRadius: 14,
    boxShadow: '0 16px 40px -16px rgba(0,0,0,0.6), 0 0 0 1px rgba(107,92,231,0.2)',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px 0 8px' }}>
      <span style={{
        width: 22, height: 22, borderRadius: 6, background: 'var(--indigo)', color: 'white',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 600,
      }}>{count}</span>
      <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>selected</span>
    </div>
    <div style={{ width: 1, height: 22, background: 'var(--line)' }} />
    {[
      { icon: IconCopy, label: 'Duplicate', k: 'dup' },
      { icon: IconRotate, label: 'Rotate', k: 'rot' },
    ].map(b => (
      <button key={b.k} onClick={() => onAction?.(b.k)} style={{
        display: 'flex', alignItems: 'center', gap: 7, padding: '7px 12px', borderRadius: 8,
        background: 'transparent', border: 0, color: 'var(--text)', fontSize: 13, cursor: 'pointer',
        fontFamily: 'inherit',
      }} className="pp-related">
        <b.icon size={15} sw={1.7} /> {b.label}
      </button>
    ))}
    {/* Move to dropdown-ish */}
    <button style={{
      display: 'flex', alignItems: 'center', gap: 7, padding: '7px 12px', borderRadius: 8,
      background: 'transparent', border: 0, color: 'var(--text)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
    }} className="pp-related">
      Move to <IconChevron size={12} color="var(--text-3)" />
    </button>
    <div style={{ width: 1, height: 22, background: 'var(--line)' }} />
    <button onClick={() => onAction?.('del')} style={{
      display: 'flex', alignItems: 'center', gap: 7, padding: '7px 12px', borderRadius: 8,
      background: 'transparent', border: 0, color: '#F87171', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
    }} className="pp-related-danger">
      <IconX size={14} sw={2} /> Delete
    </button>
  </div>
);

const OrganizeTool = () => {
  // selection demo: pages 3,4 selected; page 6 rotated; page 9 deleted (shown), page 2 duplicated
  const [selected, setSelected] = React.useState(['p3', 'p4']);
  const display = [
    { ...ORGANIZE_PAGES[0], n: 1 },
    { ...ORGANIZE_PAGES[1], n: 2 },
    { id: 'p2-copy', variant: 'report', n: 3, dup: true },
    { ...ORGANIZE_PAGES[2], n: 4 },
    { ...ORGANIZE_PAGES[3], n: 5 },
    { ...ORGANIZE_PAGES[4], n: 6, rot: 90 },
    { ...ORGANIZE_PAGES[5], n: 7 },
    { ...ORGANIZE_PAGES[6], n: 8 },
    { ...ORGANIZE_PAGES[7], n: 9, deleted: true },
    { ...ORGANIZE_PAGES[8], n: 10 },
    { ...ORGANIZE_PAGES[9], n: 11 },
    { ...ORGANIZE_PAGES[10], n: 12 },
  ];
  const selSet = { p3: true, p4: true };

  return (
    <section style={{ padding: '32px 40px 96px' }}>
      <div style={{ maxWidth: 1320, margin: '0 auto' }}>
        <Breadcrumb items={['Home', 'Tools', 'Organize Pages']} />
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24 }}>
          <ToolHeader icon="IconFolder" title="Organize Pages" mode="local"
            subtitle="Reorder, rotate, duplicate, and delete pages by drag-and-drop." />
        </div>

        {/* Changes bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginTop: 20, padding: '12px 18px',
          background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 13 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, color: 'var(--text-2)' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#F59E0B' }} />
              <span className="pp-mono" style={{ color: 'var(--text)' }}>3</span> pages moved
            </span>
            <span style={{ color: 'var(--line-2)' }}>·</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, color: 'var(--text-2)' }}>
              <span className="pp-mono" style={{ color: 'var(--text)' }}>1</span> rotated
            </span>
            <span style={{ color: 'var(--line-2)' }}>·</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, color: 'var(--text-2)' }}>
              <span className="pp-mono" style={{ color: '#F87171' }}>1</span> deleted
            </span>
            <span style={{ color: 'var(--line-2)' }}>·</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, color: 'var(--text-2)' }}>
              <span className="pp-mono" style={{ color: '#6EE7B7' }}>1</span> duplicated
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button className="pp-btn pp-btn-ghost" style={{ padding: '7px 14px', fontSize: 13 }}>
              <IconUndo size={14} /> Reset
            </button>
            <button className="pp-btn">
              <IconDownload size={14} /> Save reorganized PDF
            </button>
          </div>
        </div>

        {/* Floating selection toolbar */}
        <div style={{ marginTop: 24 }}>
          <FloatingToolbar count={2} />
        </div>

        {/* Grid */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '28px 22px',
          padding: '8px 4px',
        }}>
          {display.map((p, i) => {
            const isSel = selSet[p.id];
            return (
              <div key={p.id + i} style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
                <div style={{ position: 'relative', cursor: 'grab' }}>
                  {/* grip on hover */}
                  <PageThumb
                    n={p.deleted ? '—' : p.n}
                    variant={p.variant}
                    w={150}
                    selected={isSel}
                    rotated={p.rot}
                    deleted={p.deleted}
                    badge={
                      <>
                        {p.dup && (
                          <span style={{ position: 'absolute', top: 6, left: 6, padding: '2px 7px', borderRadius: 999, background: 'rgba(16,185,129,0.92)', color: 'white', fontSize: 9.5, fontWeight: 600, letterSpacing: '0.04em' }}>COPY</span>
                        )}
                        {p.rot ? (
                          <span style={{ position: 'absolute', top: 6, right: 6, width: 20, height: 20, borderRadius: 5, background: 'rgba(245,158,11,0.92)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <IconRotate size={12} sw={2} />
                          </span>
                        ) : null}
                        {isSel && (
                          <span style={{ position: 'absolute', top: 6, right: 6, width: 20, height: 20, borderRadius: '50%', background: 'var(--indigo)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--bg)' }}>
                            <IconCheck size={11} sw={2.6} />
                          </span>
                        )}
                      </>
                    }
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Hint */}
        <div style={{ marginTop: 36, textAlign: 'center', fontSize: 12.5, color: 'var(--text-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <IconGrip size={13} /> Drag to reorder
          </span>
          <span style={{ color: 'var(--line-2)' }}>·</span>
          <span><span className="pp-mono" style={{ padding: '1px 6px', background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 4 }}>⌘ Click</span> multi-select</span>
          <span style={{ color: 'var(--line-2)' }}>·</span>
          <span><span className="pp-mono" style={{ padding: '1px 6px', background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 4 }}>⇧ Click</span> range</span>
          <span style={{ color: 'var(--line-2)' }}>·</span>
          <span>Right-click for menu</span>
        </div>
      </div>
    </section>
  );
};

const OrganizeEmpty = () => (
  <section style={{ padding: '32px 40px 80px' }}>
    <div style={{ maxWidth: 1320, margin: '0 auto' }}>
      <Breadcrumb items={['Home', 'Tools', 'Organize Pages']} />
      <ToolHeader icon="IconFolder" title="Organize Pages" mode="local"
        subtitle="Reorder, rotate, duplicate, and delete pages by drag-and-drop." />
      <div style={{ marginTop: 24, background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 18 }}>
        <EmptyDrop icon="IconFolder" title="Drop a PDF to organize its pages"
          sub="Every page becomes a draggable thumbnail. Reorder, rotate, duplicate, or delete — then save."
          note="Pages are rearranged locally · nothing is uploaded" minHeight={520} />
      </div>
    </div>
  </section>
);

const OrganizeMobile = () => {
  const sel = { p3: true };
  const display = [
    { id: 'p1', variant: 'report', n: 1 },
    { id: 'p2', variant: 'report', n: 2 },
    { id: 'p3', variant: 'legal', n: 3, sel: true },
    { id: 'p4', variant: 'legal', n: 4 },
    { id: 'p5', variant: 'financial', n: 5, rot: 90 },
    { id: 'p6', variant: 'financial', n: 6 },
    { id: 'p7', variant: 'technical', n: 7 },
    { id: 'p8', variant: 'technical', n: 8 },
  ];
  return (
    <MobileShell height={1180}>
      <section style={{ padding: '18px 20px 100px' }}>
        <Breadcrumb items={['Tools', 'Organize']} />
        <h1 style={{ fontSize: 24, letterSpacing: '-0.025em', marginBottom: 4 }}>Organize Pages</h1>
        <p style={{ fontSize: 12.5, color: 'var(--text-2)', marginBottom: 14 }}>Tap to select · long-press to drag.</p>
        <PrivacyBadge mode="local" big />

        <div style={{
          marginTop: 14, padding: '10px 14px', background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 10,
          fontSize: 12.5, color: 'var(--text-2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span><span className="pp-mono" style={{ color: 'var(--text)' }}>1</span> selected · <span className="pp-mono" style={{ color: 'var(--text)' }}>1</span> rotated</span>
          <button className="pp-btn pp-btn-ghost" style={{ padding: '5px 10px', fontSize: 12 }}>Reset</button>
        </div>

        <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '26px 16px' }}>
          {display.map(p => (
            <div key={p.id} style={{ display: 'flex', justifyContent: 'center' }}>
              <PageThumb n={p.n} variant={p.variant} w={130} selected={p.sel} rotated={p.rot || 0}
                badge={
                  <>
                    {p.sel && <span style={{ position: 'absolute', top: 6, right: 6, width: 22, height: 22, borderRadius: '50%', background: 'var(--indigo)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--bg)' }}><IconCheck size={12} sw={2.6} /></span>}
                    {p.rot ? <span style={{ position: 'absolute', top: 6, left: 6, width: 22, height: 22, borderRadius: 6, background: 'rgba(245,158,11,0.92)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IconRotate size={12} sw={2} /></span> : null}
                  </>
                } />
            </div>
          ))}
        </div>
      </section>
      <MobileCTA label="Save reorganized PDF" />
    </MobileShell>
  );
};

const OrganizePage = () => <ToolPage><OrganizeTool /></ToolPage>;
const OrganizeEmptyPage = () => <ToolPage><OrganizeEmpty /></ToolPage>;
const OrganizeLightPage = () => <ToolPage theme="light"><OrganizeTool /></ToolPage>;

Object.assign(window, { OrganizePage, OrganizeEmptyPage, OrganizeLightPage, OrganizeMobile });
