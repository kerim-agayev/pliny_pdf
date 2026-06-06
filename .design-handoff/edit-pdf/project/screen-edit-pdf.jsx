// PlinyPDF — Phase 4: Edit PDF — all 17 states.
// Each exported as a standalone artboard component. Uses chrome from edit-pdf-parts.jsx.

// ---- shared little overlays ----
const ModalBackdrop = ({ children, align = 'center' }) => (
  <div style={{
    position: 'absolute', inset: 0, zIndex: 60,
    background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(2px)',
    display: 'flex', alignItems: align === 'top' ? 'flex-start' : 'center', justifyContent: 'center',
    paddingTop: align === 'top' ? 90 : 0,
  }}>{children}</div>
);

const ModalCard = ({ children, w = 440 }) => (
  <div className="pp-card" style={{
    width: w, padding: 28, background: 'var(--card)',
    boxShadow: '0 40px 90px -30px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05)',
  }}>{children}</div>
);

// ============================================================
//  STATE 1 — EMPTY (before upload)
// ============================================================
const EditEmpty = ({ theme = 'dark' }) => (
  <div className={`pp-board${theme === 'light' ? ' pp-light' : ''}`} style={{ width: 1280, height: 940, display: 'flex', flexDirection: 'column' }}>
    <EditHeader unsaved={false} />
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, position: 'relative',
      background: 'radial-gradient(60% 50% at 50% 30%, rgba(107,92,231,0.07), rgba(107,92,231,0) 70%), var(--bg)' }}>
      <div style={{
        width: 620, border: '1.5px dashed var(--line-2)', borderRadius: 22, padding: '64px 48px', textAlign: 'center',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0))',
      }}>
        <div style={{
          width: 76, height: 76, borderRadius: 19, margin: '0 auto 24px',
          background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.3)', color: '#60A5FA',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <IconCloudUp size={32} sw={1.6} />
        </div>
        <h1 style={{ fontSize: 26, letterSpacing: '-0.025em', marginBottom: 10 }}>Drop your PDF here or click to browse</h1>
        <p style={{ fontSize: 14.5, color: 'var(--text-2)', marginBottom: 8 }}>Edit text, whiteout, highlight, sign, and annotate — right in your browser window.</p>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 26 }}>
          <span className="pp-mono" style={{ fontSize: 11.5, color: 'var(--text-3)' }}>PDF files only</span>
          <span style={{ color: 'var(--line-2)' }}>·</span>
          <span className="pp-badge" style={{ fontSize: 11, padding: '2px 9px' }}>Max 15 MB</span>
        </div>
        <div>
          <button className="pp-btn pp-btn-lg"><IconFile size={15} /> Browse files</button>
        </div>
      </div>
      <div className="pp-badge cloud" style={{ marginTop: 28, padding: '10px 16px', fontSize: 13, borderRadius: 999, maxWidth: 560 }}>
        <span className="pp-dot" style={{ width: 8, height: 8 }} />
        Your file is processed securely on our server and deleted within 24 hours
      </div>
    </div>
  </div>
);

// ============================================================
//  STATE 2 — LOADING / PARSING (skeleton)
// ============================================================
const Skel = ({ w, h, r = 6, style }) => (
  <div className="pp-skel" style={{ width: w, height: h, borderRadius: r, ...style }} />
);

const EditLoading = ({ theme = 'dark' }) => (
  <div className={`pp-board${theme === 'light' ? ' pp-light' : ''}`} style={{ width: 1280, height: 940, display: 'flex', flexDirection: 'column', position: 'relative' }}>
    <EditHeader unsaved={false} />
    {/* toolbar skeletons */}
    <div style={{ height: 48, borderBottom: '1px solid var(--line)', background: 'var(--card)', display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px' }}>
      {Array.from({ length: 9 }).map((_, i) => <Skel key={i} w={32} h={32} r={7} />)}
    </div>
    <div style={{ height: 46, borderBottom: '1px solid var(--line)', background: 'var(--card)', display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px', opacity: 0.5 }}>
      <Skel w={104} h={30} /><Skel w={58} h={30} /><Skel w={120} h={30} />
    </div>
    <div style={{ height: 46, borderBottom: '1px solid var(--line)', background: 'var(--card)', display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px' }}>
      <Skel w={64} h={30} /><Skel w={160} h={30} /><div style={{ flex: 1 }} /><Skel w={120} h={30} />
    </div>
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
      <div style={{ width: 168, borderRight: '1px solid var(--line)', background: 'var(--card)', padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {Array.from({ length: 4 }).map((_, i) => <Skel key={i} w={104} h={134} r={4} style={{ margin: '0 auto' }} />)}
      </div>
      <div style={{ flex: 1, background: 'var(--bg-2)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 28 }}>
        <Skel w={600} h={540} r={3} />
        {/* progress card floating */}
        <div style={{ position: 'absolute', top: 290, background: 'var(--card)', border: '1px solid var(--line-2)', borderRadius: 14, padding: '22px 26px', width: 380, boxShadow: '0 30px 60px -24px rgba(0,0,0,0.6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <Spinner />
            <div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>Parsing your PDF…</div>
              <div className="pp-mono" style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 2 }}>Rendering page 3 of 10</div>
            </div>
            <span className="pp-mono" style={{ fontSize: 12, color: 'var(--text-2)', marginLeft: 'auto' }}>30%</span>
          </div>
          <div className="pp-progress"><span style={{ width: '30%' }} /></div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
            <span className="pp-mono" style={{ fontSize: 10.5, color: 'var(--text-3)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span className="pp-dot" style={{ color: '#60A5FA' }} /> Uploaded · processing on server
            </span>
            <button className="pp-btn pp-btn-ghost" style={{ padding: '5px 12px', fontSize: 12 }}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
    <EditStatus current={1} timer="15:00" />
  </div>
);

// ============================================================
//  STATE 3 — EDITOR ACTIVE (nothing selected)
// ============================================================
const EditActive = ({ theme = 'dark' }) => (
  <EditFrame theme={theme} tool="select" formatEnabled={false}
    canvas={<ContractPage decorate={{}} />} />
);

// ============================================================
//  STATE 4 — TEXT BLOCK SELECTED
// ============================================================
const EditSelected = ({ theme = 'dark' }) => (
  <EditFrame theme={theme} tool="select" formatEnabled color="#1f1f1f" align="justify"
    canvas={<ContractPage decorate={{ c3: 'selected' }} />} />
);

// ============================================================
//  STATE 5 — TEXT EDITING MODE (double-click)
// ============================================================
const EditEditing = ({ theme = 'dark' }) => (
  <EditFrame theme={theme} tool="select" formatEnabled color="#1f1f1f"
    statusExtra={<><div style={{ width: 1, height: 18, background: 'var(--line)' }} /><span className="pp-mono" style={{ fontSize: 11, color: 'var(--text-3)' }}>248 words · 1,492 chars</span></>}
    canvas={<ContractPage decorate={{ c2: 'editing' }} />} />
);

// ============================================================
//  STATE 6 — ADD TEXT MODE (Text+ active)
// ============================================================
const EditAddText = ({ theme = 'dark' }) => (
  <EditFrame theme={theme} tool="text" formatEnabled
    canvas={
      <ContractPage decorate={{}} overlays={
        <>
          {/* new dashed text box placed in empty area */}
          <div style={{ position: 'absolute', left: 320, top: 430, width: 180, padding: '8px 10px',
            border: '2px dashed #6B5CE7', borderRadius: 4, background: 'rgba(107,92,231,0.06)',
            fontFamily: '"Noto Sans", sans-serif', fontSize: 12, color: '#9CA3AF' }}>
            Type here…
            <span style={{ position: 'absolute', left: 10, top: 9, width: 1.5, height: 15, background: '#6B5CE7', animation: 'ppblink 1s step-end infinite' }} />
          </div>
          {/* I-beam cursor hint */}
          <div style={{ position: 'absolute', left: 540, top: 560, color: '#6B5CE7', fontSize: 22, fontFamily: 'serif' }}>I</div>
        </>
      } />
    } />
);

// ============================================================
//  STATE 7 — WHITEOUT MODE
// ============================================================
const EditWhiteout = ({ theme = 'dark' }) => (
  <EditFrame theme={theme} tool="whiteout"
    canvas={
      <ContractPage decorate={{}} overlays={
        <>
          {/* applied solid white rect over a clause line */}
          <div style={{ position: 'absolute', left: 60, top: 366, width: 240, height: 18, background: '#FFFFFF', border: '1px solid #D1D5DB', borderRadius: 2 }} />
          {/* dragging preview dashed red */}
          <div style={{ position: 'absolute', left: 60, top: 430, width: 300, height: 34, border: '1.5px dashed #F43F5E', borderRadius: 2, background: 'rgba(244,63,94,0.04)' }} />
          {/* crosshair + tooltip */}
          <div style={{ position: 'absolute', left: 370, top: 470, pointerEvents: 'none' }}>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', width: 22, height: 1, background: '#F43F5E', top: 0, left: -11 }} />
              <div style={{ position: 'absolute', width: 1, height: 22, background: '#F43F5E', top: -11, left: 0 }} />
              <div style={{ position: 'absolute', left: 14, top: 8, background: 'var(--card)', border: '1px solid var(--line-2)', borderRadius: 6, padding: '5px 9px', fontSize: 11, color: 'var(--text)', whiteSpace: 'nowrap', boxShadow: '0 6px 18px -6px rgba(0,0,0,0.5)' }}>
                Click and drag to cover content
              </div>
            </div>
          </div>
        </>
      } />
    } />
);

// ============================================================
//  STATE 8 — HIGHLIGHT MODE
// ============================================================
const EditHighlight = ({ theme = 'dark' }) => (
  <EditFrame theme={theme} tool="highlight"
    canvas={
      <ContractPage decorate={{}} overlays={
        <>
          {/* applied yellow highlight */}
          <div style={{ position: 'absolute', left: 60, top: 300, width: 320, height: 16, background: 'rgba(250,204,21,0.45)', borderRadius: 1 }} />
          {/* selected highlight w/ delete + color options */}
          <div style={{ position: 'absolute', left: 60, top: 322, width: 260, height: 16, background: 'rgba(250,204,21,0.45)', borderRadius: 1, outline: '1.5px solid #FACC15' }}>
            <button style={{ position: 'absolute', right: -8, top: -8, width: 16, height: 16, borderRadius: '50%', background: '#0F0F0F', color: 'white', border: '1.5px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}>
              <IconX size={9} sw={2.5} />
            </button>
            <div style={{ position: 'absolute', left: 0, top: 24, display: 'flex', gap: 5, padding: 5, background: 'var(--card)', border: '1px solid var(--line-2)', borderRadius: 8, boxShadow: '0 8px 20px -8px rgba(0,0,0,0.5)' }}>
              {['#FACC15', '#34D399', '#60A5FA', '#F472B6'].map((c, i) => (
                <span key={c} style={{ width: 18, height: 18, borderRadius: 5, background: c, boxShadow: i === 0 ? '0 0 0 2px var(--card), 0 0 0 3.5px ' + c : 'none', cursor: 'pointer' }} />
              ))}
            </div>
          </div>
        </>
      } />
    } />
);

// ============================================================
//  STATE 9 — DRAW / SHAPES MODE (dropdown open)
// ============================================================
const EditShapes = ({ theme = 'dark' }) => (
  <div className={`pp-board${theme === 'light' ? ' pp-light' : ''}`} style={{ width: 1280, height: 940, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
    <EditHeader />
    <div style={{ position: 'relative' }}>
      <ToolbarTools active="shapes" />
      {/* Shapes dropdown */}
      <div style={{ position: 'absolute', left: 296, top: 46, zIndex: 40, width: 188, background: 'var(--card)', border: '1px solid var(--line-2)', borderRadius: 12, padding: 6, boxShadow: '0 16px 40px -12px rgba(0,0,0,0.6)' }}>
        {[['Rectangle', IconRect], ['Circle', IconCircleShape], ['Arrow', IconArrowDraw], ['Line', IconLineShape]].map(([l, Ic], i) => (
          <button key={l} className="pp-related" style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, background: i === 0 ? 'rgba(107,92,231,0.14)' : 'transparent', border: 0, color: i === 0 ? '#BFB5FF' : 'var(--text)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
            <Ic size={16} sw={1.7} /> {l}
          </button>
        ))}
        <div style={{ borderTop: '1px solid var(--line)', marginTop: 6, paddingTop: 8, display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px 4px' }}>
          <span className="pp-mono" style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Stroke</span>
          <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
            {[1.5, 3, 5].map((w, i) => <span key={i} style={{ width: 18, height: 18, borderRadius: 5, border: i === 1 ? '1px solid var(--indigo)' : '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ width: 10, height: w, background: i === 1 ? '#BFB5FF' : 'var(--text-3)', borderRadius: 2 }} /></span>)}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, padding: '6px 10px 4px' }}>
          {['#F43F5E', '#3B82F6', '#10B981', '#0F0F0F'].map((c, i) => <span key={c} style={{ width: 18, height: 18, borderRadius: 5, background: c, boxShadow: i === 0 ? '0 0 0 2px var(--card), 0 0 0 3.5px ' + c : 'none' }} />)}
        </div>
      </div>
    </div>
    <ToolbarFormat enabled={false} />
    <ToolbarActions />
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
      <EditSidebar current={1} />
      <EditCanvas>
        <ContractPage decorate={{}} overlays={
          <>
            {/* freehand pen stroke */}
            <svg width="200" height="120" style={{ position: 'absolute', left: 70, top: 300, pointerEvents: 'none' }}>
              <path d="M5 60 Q 40 10 70 50 T 130 40 Q 160 60 190 20" stroke="#F43F5E" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            </svg>
            {/* rectangle shape selected */}
            <div style={{ position: 'absolute', left: 320, top: 440, width: 180, height: 90, border: '2px solid #3B82F6', borderRadius: 4 }}>
              {['nw', 'ne', 'sw', 'se'].map(h => <span key={h} style={{ position: 'absolute', width: 8, height: 8, borderRadius: 2, background: 'white', border: '1.5px solid #3B82F6', left: h[1] === 'w' ? -4 : 'auto', right: h[1] === 'e' ? -4 : 'auto', top: h[0] === 'n' ? -4 : 'auto', bottom: h[0] === 's' ? -4 : 'auto' }} />)}
            </div>
          </>
        } />
      </EditCanvas>
    </div>
    <EditStatus current={1} timer="14:42" />
  </div>
);

// ============================================================
//  STATE 10 — COMMENT / STICKY NOTE
// ============================================================
const EditComment = ({ theme = 'dark' }) => (
  <EditFrame theme={theme} tool="comment"
    canvas={
      <ContractPage decorate={{}} overlays={
        <>
          {/* placed comment pin */}
          <div style={{ position: 'absolute', left: 380, top: 286, width: 26, height: 26, background: '#F59E0B', borderRadius: '4px 12px 12px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 16px -4px rgba(245,158,11,0.6)' }}>
            <IconMessage size={13} color="white" sw={2} />
          </div>
          {/* open bubble */}
          <div style={{ position: 'absolute', left: 414, top: 280, width: 230, background: 'var(--card)', border: '1px solid var(--line-2)', borderRadius: 12, padding: 14, boxShadow: '0 16px 40px -12px rgba(0,0,0,0.6)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'linear-gradient(135deg,#6B5CE7,#EC4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 600, color: 'white' }}>AM</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)' }}>Aslan M.</div>
                <div className="pp-mono" style={{ fontSize: 9.5, color: 'var(--text-3)' }}>Today · 15:02</div>
              </div>
              <button style={{ background: 'transparent', border: 0, color: 'var(--text-3)', cursor: 'pointer', padding: 2 }}><IconX size={13} /></button>
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.5, marginBottom: 10 }}>
              Legal needs to confirm the auto-renewal clause before we send this.
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input className="pp-input" placeholder="Reply…" style={{ fontSize: 12, padding: '7px 10px' }} />
              <button className="pp-btn" style={{ padding: '7px 12px', fontSize: 12 }}>Save</button>
            </div>
          </div>
        </>
      } />
    } />
);

// ============================================================
//  STATE 11 — FIND & REPLACE MODAL
// ============================================================
const EditFindReplace = ({ theme = 'dark' }) => (
  <EditFrame theme={theme} tool="select"
    canvas={
      <ContractPage decorate={{}} overlays={
        <>
          {/* matched text highlighted orange */}
          <div style={{ position: 'absolute', left: 60, top: 300, width: 96, height: 16, background: 'rgba(249,115,22,0.4)', outline: '1.5px solid #F97316', borderRadius: 1 }} />
          <div style={{ position: 'absolute', left: 200, top: 366, width: 96, height: 14, background: 'rgba(249,115,22,0.28)', borderRadius: 1 }} />
          <div style={{ position: 'absolute', left: 120, top: 470, width: 96, height: 14, background: 'rgba(249,115,22,0.28)', borderRadius: 1 }} />
        </>
      } />
    }
    overlay={
      <ModalBackdrop align="top">
        <ModalCard w={460}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <h3 style={{ fontSize: 18, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 8 }}>
              <IconSearch size={16} color="var(--text-2)" /> Find &amp; Replace
            </h3>
            <span className="pp-mono" style={{ fontSize: 10.5, color: 'var(--text-3)', padding: '2px 7px', background: 'var(--bg-2)', borderRadius: 5, border: '1px solid var(--line)' }}>⌘H</span>
          </div>
          <label style={{ fontSize: 12, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>Find</label>
          <div style={{ position: 'relative', marginBottom: 14 }}>
            <input className="pp-input" defaultValue="Provider" style={{ paddingRight: 110 }} />
            <div style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="pp-mono" style={{ fontSize: 11, color: '#F97316' }}>3 matches</span>
              <button style={{ background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 5, color: 'var(--text-2)', width: 22, height: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IconChevron size={11} style={{ transform: 'rotate(-90deg)' }} /></button>
              <button style={{ background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 5, color: 'var(--text-2)', width: 22, height: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IconChevron size={11} style={{ transform: 'rotate(90deg)' }} /></button>
            </div>
          </div>
          <label style={{ fontSize: 12, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>Replace with</label>
          <input className="pp-input" defaultValue="Vendor" style={{ marginBottom: 16 }} />
          <div style={{ display: 'flex', gap: 18, marginBottom: 20 }}>
            {['Case sensitive', 'Whole word only'].map((l, i) => (
              <label key={l} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--text-2)', cursor: 'pointer' }}>
                <span style={{ width: 16, height: 16, borderRadius: 4, border: '1.5px solid var(--line-2)', background: i === 1 ? 'var(--indigo)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {i === 1 && <IconCheck size={10} color="white" sw={3} />}
                </span>
                {l}
              </label>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="pp-btn pp-btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>Replace</button>
            <button className="pp-btn" style={{ flex: 1, justifyContent: 'center' }}>Replace All</button>
            <button className="pp-btn pp-btn-ghost" style={{ padding: '10px 14px' }}>Close</button>
          </div>
        </ModalCard>
      </ModalBackdrop>
    } />
);

// ============================================================
//  STATE 12 — CONTEXT MENU (right-click)
// ============================================================
const EditContextMenu = ({ theme = 'dark' }) => (
  <EditFrame theme={theme} tool="select" formatEnabled
    canvas={
      <ContractPage decorate={{ c3: 'selected' }} overlays={
        <div style={{ position: 'absolute', left: 280, top: 360, zIndex: 50, width: 196, background: 'var(--card)', border: '1px solid var(--line-2)', borderRadius: 10, padding: 5, boxShadow: '0 18px 44px -12px rgba(0,0,0,0.65)' }}>
          {[
            ['Cut', '⌘X', IconScissors], ['Copy', '⌘C', IconCopy], ['Paste', '⌘V', IconClipboard], ['Delete', 'Del', IconTrash],
            ['---'],
            ['Select All', '⌘A', null], ['Edit Text', '', IconType], ['Change Font…', '', null],
          ].map((row, i) => row[0] === '---' ? (
            <div key={i} style={{ height: 1, background: 'var(--line)', margin: '5px 6px' }} />
          ) : (() => {
            const RowIcon = row[2];
            return (
            <button key={i} className="pp-related" style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', borderRadius: 7, background: 'transparent', border: 0, color: row[0] === 'Delete' ? '#F87171' : 'var(--text)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
              {RowIcon ? <RowIcon size={14} sw={1.7} /> : <span style={{ width: 14 }} />}
              <span style={{ flex: 1, textAlign: 'left' }}>{row[0]}</span>
              {row[1] && <span className="pp-mono" style={{ fontSize: 10.5, color: 'var(--text-3)' }}>{row[1]}</span>}
            </button>
            );
          })())}
        </div>
      } />
    } />
);

// ============================================================
//  STATE 13 — SESSION EXPIRY WARNING (toast)
// ============================================================
const EditSessionWarning = ({ theme = 'dark' }) => (
  <EditFrame theme={theme} tool="select" timer="05:00" urgent
    canvas={<ContractPage decorate={{}} />}
    overlay={
      <div style={{ position: 'absolute', top: 214, left: '50%', transform: 'translateX(-50%)', zIndex: 55, width: 540,
        background: 'linear-gradient(180deg, rgba(245,158,11,0.16), rgba(245,158,11,0.08))',
        border: '1px solid rgba(245,158,11,0.4)', borderRadius: 12, padding: '14px 18px',
        display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 20px 50px -16px rgba(0,0,0,0.6)' }}>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(245,158,11,0.2)', color: '#FBBF24', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <IconClock size={17} sw={1.8} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Your session expires in 5 minutes</div>
          <div style={{ fontSize: 12.5, color: 'var(--text-2)', marginTop: 1 }}>Save your changes now — unsaved edits will be lost when the server session ends.</div>
        </div>
        <button className="pp-btn" style={{ flexShrink: 0 }}>Save now</button>
        <button style={{ background: 'transparent', border: 0, color: 'var(--text-3)', cursor: 'pointer', padding: 4, flexShrink: 0 }}><IconX size={16} /></button>
      </div>
    } />
);

// ============================================================
//  STATE 14 — ERROR: SCANNED PDF
// ============================================================
const EditScannedError = ({ theme = 'dark' }) => (
  <EditFrame theme={theme} tool="select"
    canvas={<ContractPage decorate={{}} />}
    overlay={
      <ModalBackdrop>
        <ModalCard w={460}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(245,158,11,0.16)', color: '#FBBF24', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
            <IconAlert size={22} sw={1.7} />
          </div>
          <h3 style={{ fontSize: 20, letterSpacing: '-0.02em', marginBottom: 8 }}>This PDF appears to be scanned</h3>
          <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.6, marginBottom: 20 }}>
            Text editing won't work on image-only pages. Run OCR first to make the text selectable and editable.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button className="pp-btn pp-btn-lg" style={{ justifyContent: 'center' }}>
              <IconSparkle size={15} sw={1.7} /> Go to OCR tool <IconArrow size={14} />
            </button>
            <button className="pp-btn pp-btn-ghost pp-btn-lg" style={{ justifyContent: 'center' }}>Continue anyway</button>
          </div>
          <p style={{ fontSize: 11.5, color: 'var(--text-3)', textAlign: 'center', marginTop: 14, lineHeight: 1.5 }}>
            Continuing will only allow annotations (highlight, draw, comment) — not text editing.
          </p>
        </ModalCard>
      </ModalBackdrop>
    } />
);

// ============================================================
//  STATE 15 — ERROR: PARSE FAILED
// ============================================================
const EditParseError = ({ theme = 'dark' }) => (
  <div className={`pp-board${theme === 'light' ? ' pp-light' : ''}`} style={{ width: 1280, height: 940, display: 'flex', flexDirection: 'column', position: 'relative' }}>
    <EditHeader unsaved={false} />
    <div style={{ flex: 1, background: 'var(--bg)', position: 'relative' }} />
    <ModalBackdrop>
      <ModalCard w={440}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(244,63,94,0.16)', color: '#F87171', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
          <IconAlert size={22} sw={1.7} />
        </div>
        <h3 style={{ fontSize: 20, letterSpacing: '-0.02em', marginBottom: 8 }}>Unable to process this PDF</h3>
        <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.6, marginBottom: 22 }}>
          This file may be corrupted or use unsupported features such as XFA forms or non-standard encryption.
        </p>
        <button className="pp-btn pp-btn-lg" style={{ width: '100%', justifyContent: 'center', marginBottom: 12 }}>
          <IconRefresh size={15} /> Try another file
        </button>
        <div style={{ textAlign: 'center' }}>
          <a style={{ fontSize: 13, color: '#BFB5FF' }}>Contact support →</a>
        </div>
      </ModalCard>
    </ModalBackdrop>
  </div>
);

// ============================================================
//  STATE 16 — MOBILE (375)
// ============================================================
const EditMobile = ({ theme = 'dark' }) => (
  <div className={`pp-board${theme === 'light' ? ' pp-light' : ''}`} style={{ width: 375, height: 760, display: 'flex', flexDirection: 'column', position: 'relative', fontSize: 14 }}>
    <EditHeader mobile />
    {/* horizontal scrollable toolbar */}
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', height: 50, background: 'var(--card)', borderBottom: '1px solid var(--line)', overflow: 'hidden', flexShrink: 0 }}>
      {[[IconCursor, 'select', true], [IconTextPlus, 'text'], [IconWhiteout, 'white'], [IconHighlight, 'hl'], [IconStrike, 's'], [IconPen, 'd']].map(([Ic, k, on], i) => (
        <button key={i} style={{ width: 44, height: 36, borderRadius: 9, flexShrink: 0, background: on ? 'rgba(107,92,231,0.18)' : 'var(--bg-2)', border: on ? '1px solid rgba(107,92,231,0.4)' : '1px solid var(--line)', color: on ? '#BFB5FF' : 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Ic size={18} sw={1.7} />
        </button>
      ))}
      <button style={{ width: 44, height: 36, borderRadius: 9, flexShrink: 0, background: 'var(--bg-2)', border: '1px solid var(--line)', color: 'var(--text-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: 'auto' }}>
        <span style={{ fontSize: 18, lineHeight: 1 }}>⋯</span>
      </button>
    </div>
    {/* canvas */}
    <div style={{ flex: 1, background: 'var(--bg-2)', display: 'flex', justifyContent: 'center', padding: '18px 16px', overflow: 'hidden', position: 'relative' }}>
      <ContractPage width={300} decorate={{ c2: 'selected' }} />
      {/* pages toggle FAB */}
      <button style={{ position: 'absolute', left: 14, bottom: 14, height: 38, padding: '0 14px', borderRadius: 999, background: 'var(--card)', border: '1px solid var(--line-2)', color: 'var(--text)', fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 7, boxShadow: '0 8px 20px -8px rgba(0,0,0,0.5)' }}>
        <IconFile size={14} /> Pages
      </button>
    </div>
    {/* bottom bar */}
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px 16px', background: 'var(--card)', borderTop: '1px solid var(--line)', flexShrink: 0 }}>
      <button style={{ width: 42, height: 42, borderRadius: 11, background: 'var(--bg-2)', border: '1px solid var(--line)', color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IconUndo size={18} /></button>
      <button style={{ width: 42, height: 42, borderRadius: 11, background: 'var(--bg-2)', border: '1px solid var(--line)', color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IconRedo size={18} /></button>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
        <button style={{ background: 'transparent', border: 0, color: 'var(--text-2)', display: 'flex', padding: 8 }}><IconChevron size={16} style={{ transform: 'rotate(180deg)' }} /></button>
        <span className="pp-mono" style={{ fontSize: 12.5, color: 'var(--text)' }}>1 / 10</span>
        <button style={{ background: 'transparent', border: 0, color: 'var(--text-2)', display: 'flex', padding: 8 }}><IconChevron size={16} /></button>
      </div>
      <button className="pp-btn" style={{ height: 42, padding: '0 16px' }}><IconDownload size={16} /></button>
    </div>
  </div>
);

Object.assign(window, {
  EditEmpty, EditLoading, EditActive, EditSelected, EditEditing, EditAddText,
  EditWhiteout, EditHighlight, EditShapes, EditComment, EditFindReplace,
  EditContextMenu, EditSessionWarning, EditScannedError, EditParseError, EditMobile,
});
