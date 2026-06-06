// PlinyPDF — Crop PDF (canvas with crop overlay + handles)

const CROP_PRESETS = [
  { id: 'margins', label: 'Remove margins', sub: 'Auto-detect', icon: 'IconCompress' },
  { id: 'square', label: 'Square', sub: '1 : 1', icon: 'IconRect' },
  { id: 'letter', label: 'Letter', sub: '8.5 × 11 in', icon: 'IconFile' },
  { id: 'a4', label: 'A4', sub: '210 × 297 mm', icon: 'IconFile' },
  { id: 'custom', label: 'Custom', sub: 'Free crop', icon: 'IconCursor' },
];

const CropHandle = ({ pos }) => {
  const map = {
    tl: { top: -6, left: -6, cursor: 'nwse-resize' }, tr: { top: -6, right: -6, cursor: 'nesw-resize' },
    bl: { bottom: -6, left: -6, cursor: 'nesw-resize' }, br: { bottom: -6, right: -6, cursor: 'nwse-resize' },
    tc: { top: -6, left: '50%', marginLeft: -6, cursor: 'ns-resize' }, bc: { bottom: -6, left: '50%', marginLeft: -6, cursor: 'ns-resize' },
    ml: { left: -6, top: '50%', marginTop: -6, cursor: 'ew-resize' }, mr: { right: -6, top: '50%', marginTop: -6, cursor: 'ew-resize' },
  };
  const corner = ['tl', 'tr', 'bl', 'br'].includes(pos);
  return (
    <div style={{
      position: 'absolute', ...map[pos],
      width: 12, height: 12, borderRadius: corner ? 3 : 6,
      background: 'white', border: '2px solid var(--indigo)',
      boxShadow: '0 2px 6px rgba(0,0,0,0.4)', zIndex: 4,
    }} />
  );
};

const CropTool = () => {
  const [preset, setPreset] = React.useState('custom');
  const [apply, setApply] = React.useState('all');
  const [unit, setUnit] = React.useState('mm');
  // crop inset as % of page
  const crop = { top: 12, right: 10, bottom: 14, left: 10 };
  const vals = { top: 18, right: 15, bottom: 22, left: 15 }; // mm

  return (
    <section style={{ padding: '32px 40px 80px' }}>
      <div style={{ maxWidth: 1320, margin: '0 auto' }}>
        <Breadcrumb items={['Home', 'Tools', 'Crop PDF']} />
        <ToolHeader icon="IconRect" title="Crop PDF" mode="local"
          subtitle="Trim margins and resize the page box. Drag the handles or pick a preset." />

        <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 32, marginTop: 36 }}>
          {/* Settings */}
          <div className="pp-card" style={{ padding: 26, alignSelf: 'start' }}>
            <PanelTitle>Crop settings</PanelTitle>

            <SettingsRow label="Apply to">
              <Segmented columns={3} value={apply} onChange={setApply} options={[
                { value: 'all', label: 'All' },
                { value: 'current', label: 'Current' },
                { value: 'range', label: 'Range' },
              ]} />
              {apply === 'range' && (
                <input className="pp-input" style={{ marginTop: 10 }} defaultValue="1-5, 7, 10-15" placeholder="e.g. 1-5, 7, 10-15" />
              )}
            </SettingsRow>

            <SettingsRow label="Presets">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {CROP_PRESETS.map(p => {
                  const Ic = window[p.icon];
                  const active = preset === p.id;
                  return (
                    <button key={p.id} onClick={() => setPreset(p.id)} style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10,
                      background: active ? 'rgba(107,92,231,0.1)' : 'var(--bg-2)',
                      border: active ? '1px solid var(--indigo)' : '1px solid var(--line)',
                      cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                    }}>
                      <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--line)', color: active ? '#BFB5FF' : 'var(--text-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Ic size={15} sw={1.7} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--text)' }}>{p.label}</div>
                        <div className="pp-mono" style={{ fontSize: 11, color: 'var(--text-3)' }}>{p.sub}</div>
                      </div>
                      {active && <IconCheck size={15} color="#BFB5FF" />}
                    </button>
                  );
                })}
              </div>
            </SettingsRow>

            <SettingsRow label="Manual">
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
                <div style={{ display: 'flex', gap: 2, padding: 3, background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 8 }}>
                  {['mm', 'in', 'px'].map(u => (
                    <button key={u} onClick={() => setUnit(u)} style={{
                      padding: '4px 10px', borderRadius: 5, fontSize: 11.5, border: 0, cursor: 'pointer', fontFamily: 'var(--font-mono)',
                      background: unit === u ? 'rgba(107,92,231,0.18)' : 'transparent',
                      color: unit === u ? '#BFB5FF' : 'var(--text-3)',
                    }}>{u}</button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[['Top', vals.top], ['Right', vals.right], ['Bottom', vals.bottom], ['Left', vals.left]].map(([l, v]) => (
                  <div key={l}>
                    <div className="pp-mono" style={{ fontSize: 10.5, color: 'var(--text-3)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{l}</div>
                    <div style={{ position: 'relative' }}>
                      <input className="pp-input" defaultValue={v} style={{ paddingRight: 32 }} />
                      <span className="pp-mono" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--text-3)' }}>{unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            </SettingsRow>

            <button className="pp-btn pp-btn-lg" style={{ width: '100%', justifyContent: 'center', marginTop: 6 }}>
              <IconRect size={15} sw={1.7} /> Apply crop
            </button>
          </div>

          {/* Canvas */}
          <div style={{
            background: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.012) 0 1px, transparent 1px 14px), var(--bg-2)',
            border: '1px solid var(--line)', borderRadius: 16, padding: 48,
            display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', minHeight: 760,
          }}>
            <div style={{ position: 'absolute', top: 16, left: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="pp-mono" style={{ fontSize: 10.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-3)' }}>Crop · page 2 of 24</span>
            </div>

            {/* page with crop overlay */}
            <div style={{ position: 'relative', marginTop: 20 }}>
              <DocPage variant="legal" width={520} height={680} pageLabel="2 / 24" />
              {/* darkened outside via 4 panels */}
              <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                {/* top */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: `${crop.top}%`, background: 'rgba(10,10,12,0.72)' }} />
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: `${crop.bottom}%`, background: 'rgba(10,10,12,0.72)' }} />
                <div style={{ position: 'absolute', top: `${crop.top}%`, bottom: `${crop.bottom}%`, left: 0, width: `${crop.left}%`, background: 'rgba(10,10,12,0.72)' }} />
                <div style={{ position: 'absolute', top: `${crop.top}%`, bottom: `${crop.bottom}%`, right: 0, width: `${crop.right}%`, background: 'rgba(10,10,12,0.72)' }} />
              </div>
              {/* crop frame */}
              <div style={{
                position: 'absolute',
                top: `${crop.top}%`, left: `${crop.left}%`,
                right: `${crop.right}%`, bottom: `${crop.bottom}%`,
                border: '1.5px solid var(--indigo)',
                boxShadow: '0 0 0 1px rgba(0,0,0,0.3)',
              }}>
                {/* rule-of-thirds */}
                <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                  <div style={{ position: 'absolute', top: '33.33%', left: 0, right: 0, height: 1, background: 'rgba(255,255,255,0.18)' }} />
                  <div style={{ position: 'absolute', top: '66.66%', left: 0, right: 0, height: 1, background: 'rgba(255,255,255,0.18)' }} />
                  <div style={{ position: 'absolute', left: '33.33%', top: 0, bottom: 0, width: 1, background: 'rgba(255,255,255,0.18)' }} />
                  <div style={{ position: 'absolute', left: '66.66%', top: 0, bottom: 0, width: 1, background: 'rgba(255,255,255,0.18)' }} />
                </div>
                {['tl', 'tr', 'bl', 'br', 'tc', 'bc', 'ml', 'mr'].map(h => <CropHandle key={h} pos={h} />)}
                {/* edge value labels */}
                <div className="pp-mono" style={{ position: 'absolute', top: -26, left: '50%', transform: 'translateX(-50%)', fontSize: 11, color: '#BFB5FF', background: 'var(--card)', border: '1px solid var(--line-2)', borderRadius: 5, padding: '2px 7px' }}>{vals.top} mm</div>
                <div className="pp-mono" style={{ position: 'absolute', bottom: -26, left: '50%', transform: 'translateX(-50%)', fontSize: 11, color: '#BFB5FF', background: 'var(--card)', border: '1px solid var(--line-2)', borderRadius: 5, padding: '2px 7px' }}>{vals.bottom} mm</div>
                <div className="pp-mono" style={{ position: 'absolute', left: -42, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: '#BFB5FF', background: 'var(--card)', border: '1px solid var(--line-2)', borderRadius: 5, padding: '2px 7px' }}>{vals.left}</div>
                <div className="pp-mono" style={{ position: 'absolute', right: -44, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: '#BFB5FF', background: 'var(--card)', border: '1px solid var(--line-2)', borderRadius: 5, padding: '2px 7px' }}>{vals.right}</div>
                {/* output dims chip */}
                <div className="pp-mono" style={{ position: 'absolute', left: 6, top: 6, fontSize: 10, color: 'white', background: 'rgba(107,92,231,0.9)', borderRadius: 4, padding: '2px 7px' }}>
                  180 × 244 mm
                </div>
              </div>
            </div>

            {/* page thumbnails */}
            <div style={{ marginTop: 36, display: 'flex', gap: 8, alignItems: 'center' }}>
              {[1, 2, 3, 4, 5].map(n => (
                <div key={n} style={{
                  width: 34, height: 44, borderRadius: 4, background: '#FAFAF9',
                  border: n === 2 ? '2px solid var(--indigo)' : '1px solid var(--line-2)',
                  position: 'relative',
                }}>
                  <div className="pp-mono" style={{ position: 'absolute', bottom: -16, left: 0, right: 0, textAlign: 'center', fontSize: 9.5, color: n === 2 ? '#BFB5FF' : 'var(--text-3)' }}>{n}</div>
                </div>
              ))}
              <span className="pp-mono" style={{ fontSize: 11, color: 'var(--text-3)', marginLeft: 6 }}>… 24</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const CropEmpty = () => (
  <section style={{ padding: '32px 40px 80px' }}>
    <div style={{ maxWidth: 1320, margin: '0 auto' }}>
      <Breadcrumb items={['Home', 'Tools', 'Crop PDF']} />
      <ToolHeader icon="IconRect" title="Crop PDF" mode="local"
        subtitle="Trim margins and resize the page box. Drag the handles or pick a preset." />
      <div style={{ marginTop: 24, background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 18 }}>
        <EmptyDrop icon="IconRect" title="Drop a PDF to crop"
          sub="Drag crop handles directly on the page, or apply a preset like A4 or Remove margins."
          note="Cropping happens locally · nothing is uploaded" minHeight={520} />
      </div>
    </div>
  </section>
);

const CropMobile = () => {
  const crop = { top: 12, right: 10, bottom: 14, left: 10 };
  return (
    <MobileShell height={1180}>
      <section style={{ padding: '18px 20px 100px' }}>
        <Breadcrumb items={['Tools', 'Crop PDF']} />
        <h1 style={{ fontSize: 24, letterSpacing: '-0.025em', marginBottom: 4 }}>Crop PDF</h1>
        <p style={{ fontSize: 12.5, color: 'var(--text-2)', marginBottom: 14 }}>Drag handles or pick a preset.</p>
        <PrivacyBadge mode="local" big />

        {/* canvas */}
        <div style={{ marginTop: 16, background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 14, padding: 20, display: 'flex', justifyContent: 'center' }}>
          <div style={{ position: 'relative' }}>
            <DocPage variant="legal" width={280} height={366} scale={0.58} pageLabel="2 / 24" />
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: `${crop.top}%`, background: 'rgba(10,10,12,0.72)' }} />
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: `${crop.bottom}%`, background: 'rgba(10,10,12,0.72)' }} />
              <div style={{ position: 'absolute', top: `${crop.top}%`, bottom: `${crop.bottom}%`, left: 0, width: `${crop.left}%`, background: 'rgba(10,10,12,0.72)' }} />
              <div style={{ position: 'absolute', top: `${crop.top}%`, bottom: `${crop.bottom}%`, right: 0, width: `${crop.right}%`, background: 'rgba(10,10,12,0.72)' }} />
            </div>
            <div style={{ position: 'absolute', top: `${crop.top}%`, left: `${crop.left}%`, right: `${crop.right}%`, bottom: `${crop.bottom}%`, border: '1.5px solid var(--indigo)' }}>
              {['tl', 'tr', 'bl', 'br'].map(h => <CropHandle key={h} pos={h} />)}
            </div>
          </div>
        </div>

        {/* presets horizontal scroll */}
        <div style={{ marginTop: 16, display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          {CROP_PRESETS.map((p, i) => (
            <button key={p.id} style={{
              flexShrink: 0, padding: '8px 14px', borderRadius: 999, fontSize: 12.5, cursor: 'pointer',
              background: i === 4 ? 'rgba(107,92,231,0.14)' : 'var(--card)',
              border: i === 4 ? '1px solid var(--indigo)' : '1px solid var(--line)',
              color: i === 4 ? '#BFB5FF' : 'var(--text-2)', fontFamily: 'inherit',
            }}>{p.label}</button>
          ))}
        </div>
      </section>
      <MobileCTA label="Apply crop" />
    </MobileShell>
  );
};

const CropPage = () => <ToolPage><CropTool /></ToolPage>;
const CropEmptyPage = () => <ToolPage><CropEmpty /></ToolPage>;
const CropLightPage = () => <ToolPage theme="light"><CropTool /></ToolPage>;

Object.assign(window, { CropPage, CropEmptyPage, CropLightPage, CropMobile });
