// PlinyPDF — Phase 4: Real cloud PDF Editor.
// Shared chrome: header, 3 toolbar rows, page sidebar, status bar,
// and a realistic rendered contract "page" with editable text blocks.
// Custom full-screen layout (NOT ToolPage/ToolShell). Theme-aware via .pp-light.

// ============================================================
//  HEADER
// ============================================================
const EditHeader = ({ unsaved = true, mobile = false }) => {
  if (mobile) {
    return (
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 14px', height: 52, flexShrink: 0,
        background: 'var(--card)', borderBottom: '1px solid var(--line)',
      }}>
        <button style={{ background: 'transparent', border: 0, color: 'var(--text)', display: 'flex', padding: 8, cursor: 'pointer' }}>
          <IconArrow size={18} style={{ transform: 'rotate(180deg)' }} />
        </button>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1.1 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600 }}>Edit PDF</span>
          <span className="pp-mono" style={{ fontSize: 9.5, color: 'var(--text-3)' }}>contract-2026.pdf</span>
        </div>
        <button className="pp-btn" style={{ padding: '8px 12px', position: 'relative' }}>
          <IconDownload size={15} />
          {unsaved && <span style={{ position: 'absolute', top: 4, right: 4, width: 7, height: 7, borderRadius: '50%', background: '#FACC15', border: '1.5px solid var(--indigo)' }} />}
        </button>
      </header>
    );
  }
  return (
    <header style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 18px', height: 56, flexShrink: 0,
      background: 'var(--card)', borderBottom: '1px solid var(--line)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <a style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13.5, color: 'var(--text-2)' }}>
          <IconArrow size={15} style={{ transform: 'rotate(180deg)' }} /> Back to tools
        </a>
        <div style={{ width: 1, height: 22, background: 'var(--line)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <PlinyMark size={22} color="var(--text)" />
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span className="pp-mono" style={{ fontSize: 13, color: 'var(--text)' }}>contract-2026.pdf</span>
            <span style={{ fontSize: 13, color: 'var(--text-3)' }}>— Edit PDF</span>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span className="pp-mono" style={{ fontSize: 11, color: 'var(--text-3)' }}>
          {unsaved ? 'Unsaved changes' : 'All changes saved'}
        </span>
        <button className="pp-btn pp-btn-ghost" style={{ padding: '8px 14px' }}>
          <IconDownload size={14} /> Download
          <span className="pp-mono" style={{ fontSize: 10, padding: '1px 5px', background: 'rgba(255,255,255,0.06)', borderRadius: 4, marginLeft: 4 }}>⌘D</span>
        </button>
        <button className="pp-btn" style={{ padding: '8px 16px', position: 'relative' }}>
          {unsaved && <span style={{ position: 'absolute', top: 6, right: 6, width: 7, height: 7, borderRadius: '50%', background: '#FACC15', boxShadow: '0 0 6px #FACC15' }} />}
          Save
          <span className="pp-mono" style={{ fontSize: 10, padding: '1px 5px', background: 'rgba(255,255,255,0.16)', borderRadius: 4, marginLeft: 4 }}>⌘S</span>
        </button>
      </div>
    </header>
  );
};

// ============================================================
//  TOOLBAR
// ============================================================
const TBtn = ({ icon: Ic, label, active, disabled, danger, hasCaret, kbd, onClick }) => (
  <button onClick={onClick} disabled={disabled} title={label} className="pp-edtool" style={{
    height: 32, minWidth: 32,
    padding: hasCaret ? '0 6px 0 7px' : 0,
    borderRadius: 7,
    background: active ? 'rgba(107,92,231,0.18)' : 'transparent',
    border: active ? '1px solid rgba(107,92,231,0.42)' : '1px solid transparent',
    color: disabled ? 'var(--text-3)' : (danger ? '#F87171' : (active ? '#BFB5FF' : 'var(--text)')),
    opacity: disabled ? 0.4 : 1,
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4,
    transition: 'background 0.12s, border-color 0.12s, color 0.12s',
    flexShrink: 0,
  }}>
    <Ic size={16.5} sw={1.7} />
    {hasCaret && <IconChevron size={12} style={{ transform: 'rotate(90deg)', opacity: 0.6 }} />}
    {kbd && <span className="pp-mono" style={{ fontSize: 9.5, color: 'var(--text-3)', marginLeft: 2 }}>{kbd}</span>}
  </button>
);

const TBDiv = () => <div style={{ width: 1, height: 20, background: 'var(--line)', flexShrink: 0, margin: '0 3px' }} />;

const TBSelect = ({ value, width = 92, disabled }) => (
  <button disabled={disabled} className="pp-edtool" style={{
    height: 30, padding: '0 8px', borderRadius: 7, width,
    background: 'var(--bg-2)', border: '1px solid var(--line)',
    color: disabled ? 'var(--text-3)' : 'var(--text)', opacity: disabled ? 0.45 : 1,
    fontSize: 12.5, fontFamily: 'inherit',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'space-between', gap: 6,
    cursor: disabled ? 'not-allowed' : 'pointer', flexShrink: 0,
  }}>
    {value} <IconChevron size={12} style={{ transform: 'rotate(90deg)', opacity: 0.6 }} />
  </button>
);

// Row 1 — tools (always visible)
const ToolbarTools = ({ active = 'select', onTool }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 2,
    padding: '8px 16px', height: 48, flexShrink: 0,
    background: 'var(--card)', borderBottom: '1px solid var(--line)',
  }}>
    <TBtn icon={IconCursor} label="Select" active={active === 'select'} onClick={() => onTool?.('select')} />
    <TBDiv />
    <TBtn icon={IconTextPlus} label="Add text" active={active === 'text'} onClick={() => onTool?.('text')} />
    <TBtn icon={IconWhiteout} label="Whiteout" active={active === 'whiteout'} onClick={() => onTool?.('whiteout')} />
    <TBtn icon={IconHighlight} label="Highlight" active={active === 'highlight'} onClick={() => onTool?.('highlight')} />
    <TBtn icon={IconStrike} label="Strikethrough" active={active === 'strike'} onClick={() => onTool?.('strike')} />
    <TBDiv />
    <TBtn icon={IconPen} label="Draw" active={active === 'draw'} onClick={() => onTool?.('draw')} />
    <TBtn icon={IconShapes} label="Shapes" hasCaret active={active === 'shapes'} onClick={() => onTool?.('shapes')} />
    <TBtn icon={IconMessage} label="Comment" active={active === 'comment'} onClick={() => onTool?.('comment')} />
    <TBtn icon={IconLink} label="Link" active={active === 'link'} onClick={() => onTool?.('link')} />
    <div style={{ flex: 1 }} />
    <div className="pp-badge cloud" style={{ fontSize: 11, padding: '3px 9px' }}>
      <span className="pp-dot" /> Cloud editor
    </div>
  </div>
);

// Row 2 — text formatting (active only when text block selected)
const ToolbarFormat = ({ enabled = false, color = '#0F0F0F', align = 'left' }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 5,
    padding: '7px 16px', height: 46, flexShrink: 0,
    background: 'var(--card)', borderBottom: '1px solid var(--line)',
    opacity: enabled ? 1 : 0.55,
  }}>
    <TBSelect value="Helvetica" width={104} disabled={!enabled} />
    <TBSelect value="12" width={58} disabled={!enabled} />
    <TBDiv />
    <TBtn icon={IconBold} label="Bold" disabled={!enabled} />
    <TBtn icon={IconItalic} label="Italic" disabled={!enabled} />
    <TBtn icon={IconUnderlineText} label="Underline" disabled={!enabled} />
    <TBDiv />
    {/* color */}
    <button disabled={!enabled} className="pp-edtool" style={{
      height: 30, padding: '0 6px', borderRadius: 7,
      background: 'var(--bg-2)', border: '1px solid var(--line)',
      display: 'inline-flex', alignItems: 'center', gap: 6, cursor: enabled ? 'pointer' : 'not-allowed',
      opacity: enabled ? 1 : 0.5,
    }}>
      <span style={{ width: 16, height: 16, borderRadius: 4, background: color, border: '1px solid var(--line-2)' }} />
      <IconChevron size={11} style={{ transform: 'rotate(90deg)', opacity: 0.6, color: 'var(--text-2)' }} />
    </button>
    <TBDiv />
    {/* align segmented */}
    <div style={{ display: 'flex', gap: 1, padding: 2, background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 8, opacity: enabled ? 1 : 0.5 }}>
      {[['left', IconAlignLeft], ['center', IconAlignCenter], ['right', IconAlignRight]].map(([k, Ic]) => (
        <span key={k} style={{
          width: 26, height: 24, borderRadius: 5,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          background: enabled && align === k ? 'rgba(107,92,231,0.2)' : 'transparent',
          color: enabled && align === k ? '#BFB5FF' : 'var(--text-2)',
        }}>
          <Ic size={15} sw={1.7} />
        </span>
      ))}
    </div>
    <div style={{ flex: 1 }} />
    <TBtn icon={IconTrash} label="Delete block" danger disabled={!enabled} kbd="Del" />
  </div>
);

// Row 3 — actions (always visible)
const ToolbarActions = ({ zoom = 100, onFind }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 5,
    padding: '7px 16px', height: 46, flexShrink: 0,
    background: 'var(--card)', borderBottom: '1px solid var(--line)',
  }}>
    <TBtn icon={IconUndo} label="Undo" kbd="⌘Z" />
    <TBtn icon={IconRedo} label="Redo" kbd="⌘⇧Z" />
    <TBDiv />
    <button onClick={onFind} className="pp-edtool" style={{
      height: 30, padding: '0 12px', borderRadius: 7,
      background: 'var(--bg-2)', border: '1px solid var(--line)', color: 'var(--text)',
      display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12.5, cursor: 'pointer',
    }}>
      <IconSearch size={14} /> Find &amp; Replace
      <span className="pp-mono" style={{ fontSize: 9.5, color: 'var(--text-3)' }}>⌘H</span>
    </button>
    <div style={{ flex: 1 }} />
    {/* zoom */}
    <div style={{ display: 'flex', alignItems: 'center', gap: 2, padding: 3, background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 8 }}>
      <button className="pp-edtool" style={{ width: 26, height: 24, borderRadius: 5, border: 0, background: 'transparent', color: 'var(--text-2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <IconX size={13} style={{ transform: 'rotate(45deg)' }} />
      </button>
      <span className="pp-mono" style={{ fontSize: 12, color: 'var(--text)', minWidth: 42, textAlign: 'center' }}>{zoom}%</span>
      <button className="pp-edtool" style={{ width: 26, height: 24, borderRadius: 5, border: 0, background: 'transparent', color: 'var(--text-2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <IconPlus size={13} />
      </button>
    </div>
  </div>
);

// ============================================================
//  PAGE SIDEBAR
// ============================================================
const EditSidebar = ({ current = 1, pages = 10 }) => (
  <aside style={{
    width: 168, flexShrink: 0,
    background: 'var(--card)', borderRight: '1px solid var(--line)',
    display: 'flex', flexDirection: 'column',
  }}>
    <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span className="pp-mono" style={{ fontSize: 10.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-3)' }}>Pages</span>
      <span className="pp-mono" style={{ fontSize: 10.5, color: 'var(--text-3)' }}>{pages}</span>
    </div>
    <div style={{ flex: 1, overflow: 'hidden', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      {Array.from({ length: 6 }).map((_, i) => {
        const n = i + 1;
        const sel = n === current;
        return (
          <div key={n} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            <div style={{
              width: 104, height: 134, borderRadius: 4, position: 'relative',
              background: '#FAFAF9',
              border: sel ? '2px solid var(--indigo)' : '1px solid var(--line-2)',
              boxShadow: sel ? '0 0 0 3px var(--indigo-dim)' : '0 2px 8px -4px rgba(0,0,0,0.5)',
              overflow: 'hidden',
            }}>
              <MiniContract n={n} />
            </div>
            <span className="pp-mono" style={{ fontSize: 10.5, color: sel ? '#BFB5FF' : 'var(--text-3)' }}>{n}</span>
          </div>
        );
      })}
    </div>
  </aside>
);

// tiny contract-ish thumbnail content
const MiniContract = ({ n }) => (
  <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 3 }}>
    {n === 1 && <div style={{ height: 8, width: '40%', background: '#6B5CE7', opacity: 0.5, borderRadius: 1, marginBottom: 3 }} />}
    {n === 1 && <div style={{ height: 5, width: '70%', background: '#1f1f1f', opacity: 0.7, borderRadius: 1, margin: '0 auto 5px' }} />}
    {[0.9, 0.7, 0.95, 0.6, 0.85, 0.5, 0.9, 0.4, 0.8].map((w, i) => (
      <div key={i} style={{ height: 2, width: `${w * 100}%`, background: '#9CA3AF', borderRadius: 1 }} />
    ))}
    {n >= 9 && <div style={{ marginTop: 'auto', height: 1, width: '50%', background: '#1f1f1f', opacity: 0.4 }} />}
  </div>
);

// ============================================================
//  STATUS BAR
// ============================================================
const EditStatus = ({ current = 1, pages = 10, timer = '15:00', urgent = false, extra }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 16,
    padding: '0 18px', height: 40, flexShrink: 0,
    background: 'var(--card)', borderTop: '1px solid var(--line)',
    fontSize: 12,
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <button style={{ background: 'transparent', border: 0, color: 'var(--text-2)', display: 'flex', cursor: 'pointer', padding: 2 }}>
        <IconChevron size={13} style={{ transform: 'rotate(180deg)' }} />
      </button>
      <span className="pp-mono" style={{ color: 'var(--text-2)' }}>
        Page <span style={{ color: 'var(--text)' }}>{current}</span> of {pages}
      </span>
      <button style={{ background: 'transparent', border: 0, color: 'var(--text-2)', display: 'flex', cursor: 'pointer', padding: 2 }}>
        <IconChevron size={13} />
      </button>
    </div>
    <div style={{ width: 1, height: 18, background: 'var(--line)' }} />
    <div className="pp-badge cloud" style={{ fontSize: 11, padding: '3px 9px' }}>
      <span className="pp-dot" /> Cloud — Secure
    </div>
    {extra}
    <div style={{ flex: 1 }} />
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 7,
      fontSize: 11.5,
      color: urgent ? '#FBBF24' : 'var(--text-3)',
    }}>
      <IconClock size={13} color={urgent ? '#FBBF24' : 'var(--text-3)'} />
      <span className="pp-mono">{timer} remaining</span>
    </div>
  </div>
);

// ============================================================
//  CONTRACT PAGE (the rendered white "PNG")
// ============================================================
// A text block wrapper that can show: none | hover | selected | editing | new
const TextBlock = ({ state = 'none', children, style = {}, handles = false }) => {
  const border =
    state === 'selected' ? '2px solid #6B5CE7'
    : state === 'editing' ? '2px solid #6B5CE7'
    : state === 'new' ? '2px dashed #6B5CE7'
    : state === 'hover' ? '1px solid rgba(107,92,231,0.4)'
    : '1px solid transparent';
  const bg =
    (state === 'selected' || state === 'editing') ? 'rgba(107,92,231,0.06)'
    : 'transparent';
  return (
    <div style={{
      position: 'relative', border, background: bg, borderRadius: 3,
      margin: '-3px -6px', padding: '3px 6px',
      transition: 'border-color 0.12s, background 0.12s',
      ...style,
    }}>
      {children}
      {handles && ['nw', 'ne', 'sw', 'se'].map(h => (
        <span key={h} style={{
          position: 'absolute', width: 8, height: 8, borderRadius: 2,
          background: 'white', border: '1.5px solid #6B5CE7',
          left: h[1] === 'w' ? -4 : 'auto', right: h[1] === 'e' ? -4 : 'auto',
          top: h[0] === 'n' ? -4 : 'auto', bottom: h[0] === 's' ? -4 : 'auto',
        }} />
      ))}
      {state === 'editing' && (
        <span style={{
          position: 'absolute', right: 8, top: '50%', width: 1.5, height: 15,
          background: '#6B5CE7', transform: 'translateY(-50%)',
          animation: 'ppblink 1s step-end infinite',
        }} />
      )}
    </div>
  );
};

// The contract content. `decorate` lets a state highlight specific blocks.
const ContractPage = ({ width = 600, decorate = {}, overlays }) => {
  const d = (key) => decorate[key] || 'none';
  return (
    <div style={{
      position: 'relative', width, minHeight: width * 1.32,
      background: '#FFFFFF', borderRadius: 3,
      boxShadow: '0 30px 70px -24px rgba(0,0,0,0.55), 0 0 0 1px rgba(0,0,0,0.18)',
      color: '#1f1f1f', flexShrink: 0,
    }}>
      <div style={{ padding: '54px 60px 64px' }}>
        {/* Letterhead */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 30, paddingBottom: 18, borderBottom: '2px solid #1f1f1f' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <div style={{ width: 22, height: 22, borderRadius: 5, background: '#6B5CE7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <PlinyMark size={15} color="white" />
              </div>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: '#0F0F0F', letterSpacing: '-0.01em' }}>Meridian Labs, Inc.</span>
            </div>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 10, color: '#6B7280' }}>
              440 Brannan Street · San Francisco, CA 94107
            </div>
          </div>
          <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 9.5, color: '#9CA3AF', lineHeight: 1.6 }}>
            Doc №&nbsp;MSA-2026-0481<br />Revision 3
          </div>
        </div>

        {/* Title */}
        <TextBlock state={d('title')} style={{ marginBottom: 6 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: '#0F0F0F', letterSpacing: '0.04em', textAlign: 'center', margin: 0 }}>
            PROFESSIONAL SERVICES AGREEMENT
          </h1>
        </TextBlock>
        <TextBlock state={d('subtitle')} style={{ marginBottom: 22 }}>
          <p style={{ fontFamily: 'Georgia, serif', fontSize: 11, color: '#6B7280', textAlign: 'center', margin: 0 }}>
            This Agreement is entered into as of <strong style={{ color: '#1f1f1f' }}>June 6, 2026</strong> ("Effective Date")
          </p>
        </TextBlock>

        {/* Intro */}
        <TextBlock state={d('intro')} style={{ marginBottom: 18 }}>
          <p style={{ fontFamily: 'Georgia, serif', fontSize: 12.5, lineHeight: 1.75, color: '#1f1f1f', margin: 0, textAlign: 'justify' }}>
            BETWEEN <strong>Meridian Labs, Inc.</strong>, a Delaware corporation ("Client"), and
            <strong> Pliny Software Ltd.</strong> ("Provider"). The parties agree to the terms set forth
            below in consideration of the mutual covenants contained herein.
          </p>
        </TextBlock>

        {/* Clauses */}
        {[
          ['c1', '1. Scope of Services', 'Provider shall furnish the professional services described in Exhibit A ("Services"). Any change to the scope must be agreed in writing by both parties and may affect fees and timelines.'],
          ['c2', '2. Term', 'This Agreement commences on the Effective Date and continues for twelve (12) months unless terminated earlier in accordance with Section 6. Renewal is automatic for successive one-year terms.'],
          ['c3', '3. Fees & Payment', 'Client shall pay Provider the fees set out in Exhibit B within thirty (30) days of each invoice date. Late amounts accrue interest at 1.5% per month or the maximum rate permitted by law.'],
          ['c4', '4. Confidentiality', 'Each party shall protect the other\u2019s Confidential Information using no less than reasonable care and shall not disclose it to third parties except as permitted under this Agreement.'],
        ].map(([key, h, body]) => (
          <TextBlock key={key} state={d(key)} style={{ marginBottom: 14 }} handles={d(key) === 'selected'}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 12.5, fontWeight: 700, color: '#0F0F0F', marginBottom: 4 }}>{h}</div>
            <p style={{ fontFamily: 'Georgia, serif', fontSize: 12, lineHeight: 1.7, color: '#1f1f1f', margin: 0, textAlign: 'justify' }}>{body}</p>
          </TextBlock>
        ))}

        {/* Signature block */}
        <div style={{ marginTop: 30, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 36 }}>
          {['Client — Meridian Labs, Inc.', 'Provider — Pliny Software Ltd.'].map((label, i) => (
            <div key={i}>
              <div style={{ borderBottom: '1.5px solid #1f1f1f', height: 34, marginBottom: 6, position: 'relative' }}>
                {i === 0 && (
                  <span style={{ position: 'absolute', bottom: 4, left: 6, fontFamily: '"Segoe Script","Brush Script MT",cursive', fontSize: 20, color: '#1E3A8A', transform: 'rotate(-4deg)' }}>
                    A. Marius
                  </span>
                )}
              </div>
              <div style={{ fontFamily: 'Georgia, serif', fontSize: 10, color: '#6B7280' }}>{label}</div>
              <div style={{ fontFamily: 'Georgia, serif', fontSize: 9.5, color: '#9CA3AF', marginTop: 8 }}>Date: ________________</div>
            </div>
          ))}
        </div>
      </div>

      {/* page footer */}
      <div style={{ position: 'absolute', bottom: 22, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', padding: '0 60px', fontFamily: 'var(--font-mono)', fontSize: 9, color: '#9CA3AF' }}>
        <span>MSA-2026-0481</span><span>Page 1 of 10</span>
      </div>

      {overlays}
    </div>
  );
};

// canvas backdrop wrapper used by all editor states
const EditCanvas = ({ children, scrollHint = true }) => (
  <div style={{
    flex: 1, position: 'relative', overflow: 'hidden',
    background:
      'radial-gradient(70% 60% at 50% 0%, rgba(107,92,231,0.06), rgba(107,92,231,0) 70%), repeating-linear-gradient(45deg, rgba(127,127,127,0.04) 0 1px, transparent 1px 16px), var(--bg-2)',
    display: 'flex', justifyContent: 'center',
    padding: '36px 40px',
  }}>
    {children}
  </div>
);

// The standard editor frame: header + 3 toolbars + (sidebar + canvas) + status.
const EditFrame = ({ theme = 'dark', width = 1280, height = 940,
  tool = 'select', formatEnabled = false, color = '#0F0F0F', align = 'left',
  current = 1, timer = '15:00', urgent = false, statusExtra, onFind,
  canvas, overlay }) => (
  <div className={`pp-board${theme === 'light' ? ' pp-light' : ''}`} style={{
    width, height, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden',
  }}>
    <EditHeader />
    <ToolbarTools active={tool} />
    <ToolbarFormat enabled={formatEnabled} color={color} align={align} />
    <ToolbarActions onFind={onFind} />
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
      <EditSidebar current={current} />
      <EditCanvas>{canvas}</EditCanvas>
    </div>
    <EditStatus current={current} timer={timer} urgent={urgent} extra={statusExtra} />
    {overlay}
  </div>
);

// blink + tool cursor styles
if (!document.getElementById('pp-edit-style')) {
  const s = document.createElement('style');
  s.id = 'pp-edit-style';
  s.textContent = `
    @keyframes ppblink { 50% { opacity: 0; } }
    @keyframes ppshimmer { 0% { background-position: -400px 0; } 100% { background-position: 400px 0; } }
    .pp-skel { background: linear-gradient(90deg, var(--card) 0px, var(--card-hi) 200px, var(--card) 400px); background-size: 800px 100%; animation: ppshimmer 1.4s infinite linear; }
  `;
  document.head.appendChild(s);
}

Object.assign(window, {
  EditHeader, ToolbarTools, ToolbarFormat, ToolbarActions, EditSidebar,
  EditStatus, ContractPage, TextBlock, EditCanvas, EditFrame, TBtn, TBDiv, TBSelect, MiniContract,
});
