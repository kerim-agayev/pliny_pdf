// PlinyPDF — PDF Editor (annotate / highlight / draw / mark up)

const EDITOR_COLORS = [
  { name: 'Yellow', value: '#FACC15' },
  { name: 'Red', value: '#F43F5E' },
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Green', value: '#10B981' },
  { name: 'Black', value: '#0F0F0F' },
  { name: 'White', value: '#FFFFFF' },
];

const EditorToolBtn = ({ icon: Ic, label, active, disabled, onClick, badge }) => (
  <button onClick={onClick} disabled={disabled} title={label} style={{
    width: 34, height: 34, borderRadius: 8,
    background: active ? 'rgba(107,92,231,0.18)' : 'transparent',
    border: active ? '1px solid rgba(107,92,231,0.4)' : '1px solid transparent',
    color: disabled ? 'var(--text-3)' : (active ? '#BFB5FF' : 'var(--text)'),
    opacity: disabled ? 0.4 : 1,
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    transition: 'background 0.12s, border-color 0.12s, color 0.12s',
    position: 'relative',
    flexShrink: 0,
  }} className="pp-edtool">
    <Ic size={17} sw={1.7} />
    {badge && (
      <span style={{
        position: 'absolute', bottom: -2, right: -2,
        width: 10, height: 10, borderRadius: '50%',
        background: badge, border: '2px solid var(--bg)',
      }} />
    )}
  </button>
);

const ToolDivider = () => (
  <div style={{ width: 1, height: 22, background: 'var(--line)', flexShrink: 0 }} />
);

const ToolGroup = ({ children }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>{children}</div>
);

const EditorToolbar = ({ disabled = false, activeTool = 'highlight', activeColor = '#FACC15', onTool }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '10px 16px',
    background: 'var(--card)',
    borderBottom: '1px solid var(--line)',
    overflow: 'hidden',
  }}>
    {/* Select */}
    <ToolGroup>
      <EditorToolBtn icon={IconCursor} label="Select" active={activeTool === 'select'} disabled={disabled} onClick={() => onTool?.('select')} />
    </ToolGroup>
    <ToolDivider />

    {/* Text */}
    <ToolGroup>
      <EditorToolBtn icon={IconType} label="Text box" active={activeTool === 'text'} disabled={disabled} onClick={() => onTool?.('text')} />
      <EditorToolBtn icon={IconSticky} label="Sticky note" active={activeTool === 'sticky'} disabled={disabled} onClick={() => onTool?.('sticky')} />
    </ToolGroup>
    <ToolDivider />

    {/* Markup */}
    <ToolGroup>
      <EditorToolBtn icon={IconHighlight} label="Highlight" active={activeTool === 'highlight'} disabled={disabled} onClick={() => onTool?.('highlight')} badge={activeTool === 'highlight' ? activeColor : null} />
      <EditorToolBtn icon={IconStrike} label="Strikethrough" active={activeTool === 'strike'} disabled={disabled} onClick={() => onTool?.('strike')} />
      <EditorToolBtn icon={IconUnderline} label="Underline" active={activeTool === 'underline'} disabled={disabled} onClick={() => onTool?.('underline')} />
    </ToolGroup>
    <ToolDivider />

    {/* Draw */}
    <ToolGroup>
      <EditorToolBtn icon={IconPen} label="Pen" active={activeTool === 'pen'} disabled={disabled} onClick={() => onTool?.('pen')} />
      <EditorToolBtn icon={IconRect} label="Rectangle" active={activeTool === 'rect'} disabled={disabled} onClick={() => onTool?.('rect')} />
      <EditorToolBtn icon={IconCircleShape} label="Circle" active={activeTool === 'circle'} disabled={disabled} onClick={() => onTool?.('circle')} />
      <EditorToolBtn icon={IconArrowDraw} label="Arrow" active={activeTool === 'arrow'} disabled={disabled} onClick={() => onTool?.('arrow')} />
      <EditorToolBtn icon={IconLineShape} label="Line" active={activeTool === 'line'} disabled={disabled} onClick={() => onTool?.('line')} />
    </ToolGroup>
    <ToolDivider />

    {/* Other */}
    <ToolGroup>
      <EditorToolBtn icon={IconImage} label="Insert image" disabled={disabled} />
      <EditorToolBtn icon={IconWhiteout} label="Whiteout" disabled={disabled} />
      <EditorToolBtn icon={IconEraser} label="Eraser" disabled={disabled} />
    </ToolGroup>
    <ToolDivider />

    {/* Color swatches */}
    <ToolGroup>
      {EDITOR_COLORS.map(c => {
        const active = c.value === activeColor && !disabled;
        return (
          <button key={c.value} disabled={disabled} title={c.name} style={{
            width: 24, height: 24, borderRadius: 6,
            background: c.value,
            border: c.value === '#FFFFFF' ? '1px solid var(--line-2)' : '1px solid rgba(255,255,255,0.06)',
            cursor: disabled ? 'not-allowed' : 'pointer',
            boxShadow: active
              ? `0 0 0 2px var(--card), 0 0 0 4px ${c.value === '#FFFFFF' ? 'var(--indigo)' : c.value}`
              : 'none',
            opacity: disabled ? 0.4 : 1,
            transition: 'box-shadow 0.15s',
            flexShrink: 0,
          }} />
        );
      })}
    </ToolGroup>
    <ToolDivider />

    {/* Stroke width */}
    <ToolGroup>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 4px' }}>
        <span className="pp-mono" style={{ fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Stroke</span>
        <div style={{
          width: 88, height: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 4px',
          background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 6,
          opacity: disabled ? 0.4 : 1,
        }}>
          {[1.5, 2.5, 4, 6].map((w, i) => (
            <div key={i} style={{
              height: w, width: 14, borderRadius: 2,
              background: i === 2 ? '#BFB5FF' : 'var(--text-3)',
            }} />
          ))}
        </div>
      </div>
    </ToolGroup>
    <ToolDivider />

    {/* Right side: undo/redo/zoom/page nav */}
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto', flexShrink: 0 }}>
      <ToolGroup>
        <EditorToolBtn icon={IconUndo} label="Undo" disabled={disabled} />
        <EditorToolBtn icon={IconRedo} label="Redo" disabled={disabled} />
      </ToolGroup>
      <ToolDivider />
      <div style={{
        display: 'flex', alignItems: 'center', gap: 4,
        padding: '4px 6px',
        background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 8,
        opacity: disabled ? 0.4 : 1,
      }}>
        <button style={{ background: 'transparent', border: 0, color: 'var(--text-2)', padding: 2, cursor: disabled ? 'not-allowed' : 'pointer', display: 'flex' }}>
          <IconChevron size={12} style={{ transform: 'rotate(180deg)' }} />
        </button>
        <span className="pp-mono" style={{ fontSize: 11.5, color: 'var(--text)', minWidth: 40, textAlign: 'center' }}>125%</span>
        <button style={{ background: 'transparent', border: 0, color: 'var(--text-2)', padding: 2, cursor: disabled ? 'not-allowed' : 'pointer', display: 'flex' }}>
          <IconChevron size={12} />
        </button>
      </div>
      <ToolDivider />
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '4px 10px',
        background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 8,
        opacity: disabled ? 0.4 : 1,
      }}>
        <button style={{ background: 'transparent', border: 0, color: 'var(--text-2)', padding: 2, cursor: disabled ? 'not-allowed' : 'pointer', display: 'flex' }}>
          <IconChevron size={12} style={{ transform: 'rotate(180deg)' }} />
        </button>
        <span className="pp-mono" style={{ fontSize: 11.5, color: 'var(--text)' }}>
          <span style={{ color: 'var(--text)' }}>2</span>
          <span style={{ color: 'var(--text-3)' }}> / 24</span>
        </span>
        <button style={{ background: 'transparent', border: 0, color: 'var(--text-2)', padding: 2, cursor: disabled ? 'not-allowed' : 'pointer', display: 'flex' }}>
          <IconChevron size={12} />
        </button>
      </div>
    </div>
  </div>
);

// === The annotated PDF page (the heart of the design) ===
const AnnotatedPdfPage = () => {
  const W = 720, H = 940;
  return (
    <div style={{ position: 'relative', width: W, height: H }}>
      {/* page */}
      <div style={{
        position: 'absolute', inset: 0,
        background: '#FAFAF9',
        borderRadius: 4,
        boxShadow: '0 40px 80px -20px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
        overflow: 'hidden',
        color: '#1f1f1f',
      }}>
        {/* page header */}
        <div style={{ padding: '64px 80px 0' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: 18 }}>
            PlinyPDF · Annual Report 2025 · §2 Product
          </div>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: 30, lineHeight: 1.12,
            color: '#0F0F0F', marginBottom: 18, letterSpacing: '-0.022em', fontWeight: 700,
            textWrap: 'balance',
          }}>
            Eleven new tools, nine of them local.
          </h1>
          <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 28 }}>
            By A. Marius · Chief product officer · 14 pages
          </div>

          {/* Para 1 — normal */}
          <div style={{ position: 'relative', marginBottom: 14 }}>
            <p style={{ fontSize: 13.5, lineHeight: 1.75, color: '#1f1f1f', fontFamily: 'Georgia, serif', margin: 0 }}>
              In 2025 we shipped eleven new tools across four categories. Of those, nine
              run entirely on the client via WebAssembly, with no upload required at any
              point in the flow. The remaining two — server-side OCR and AI summary — are
              the result of explicit cost-benefit decisions where the user-visible quality
              gain outweighs the privacy compromise.
            </p>
          </div>

          {/* Para 2 — HIGHLIGHTED (yellow) */}
          <div style={{ position: 'relative', marginBottom: 14 }}>
            <p style={{ fontSize: 13.5, lineHeight: 1.75, color: '#1f1f1f', fontFamily: 'Georgia, serif', margin: 0, position: 'relative', zIndex: 2 }}>
              <span style={{ background: 'rgba(250,204,21,0.42)', boxShadow: '0 0 0 1px rgba(250,204,21,0.3)', padding: '1px 0', borderRadius: 1 }}>
                The thesis we tested this year: that consumer software can grow at venture
                pace without venture capital, and that the path runs through user trust —
                literal byte-level trust that your file is not being copied.
              </span>{' '}
              The thesis held. Pro conversion sits at <span style={{ background: 'rgba(250,204,21,0.42)', padding: '1px 0' }}>4.1%</span>, well above industry norms.
            </p>
          </div>

          {/* Para 3 — Strikethrough */}
          <div style={{ position: 'relative', marginBottom: 14 }}>
            <p style={{ fontSize: 13.5, lineHeight: 1.75, color: '#1f1f1f', fontFamily: 'Georgia, serif', margin: 0 }}>
              We considered raising a small seed round in Q1 to accelerate hiring, but{' '}
              <span style={{
                textDecoration: 'line-through',
                textDecorationColor: '#F43F5E',
                textDecorationThickness: '2px',
                color: '#5b6470',
              }}>
                the prevailing wisdom is that any consumer SaaS without an early raise will struggle to compete
              </span>{' '}
              ultimately the team decided that hiring slower preserves the culture we want.
            </p>
          </div>

          {/* Para 4 — Underline (red freehand wavy) */}
          <div style={{ position: 'relative', marginBottom: 14 }}>
            <p style={{ fontSize: 13.5, lineHeight: 1.75, color: '#1f1f1f', fontFamily: 'Georgia, serif', margin: 0, position: 'relative' }}>
              The result is a team of twelve, distributed across six time zones, with{' '}
              <span style={{ position: 'relative', display: 'inline' }}>
                no managers, no synchronous standups, and no roadmap longer than one quarter
                <svg width="380" height="6" viewBox="0 0 380 6" style={{ position: 'absolute', left: 0, bottom: -3, pointerEvents: 'none' }}>
                  <path d="M2 3 Q 40 0 80 3 T 160 3 T 240 3 T 320 3 T 378 3" stroke="#F43F5E" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                </svg>
              </span>.
            </p>
          </div>

          {/* Box section — rectangle around it */}
          <div style={{ position: 'relative', marginBottom: 14 }}>
            <div style={{
              padding: '14px 18px',
              background: '#F4F2EE',
              borderLeft: '3px solid #6B5CE7',
              borderRadius: 3,
              fontFamily: 'Georgia, serif', fontSize: 13.5, lineHeight: 1.7, color: '#1f1f1f',
            }}>
              <strong style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 600, color: '#6B5CE7', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                Key insight
              </strong>
              When you remove the upload step, you also remove the only place where your
              competitors are spending money. WebAssembly compute is free at our scale.
            </div>
            {/* Drawn rectangle around it */}
            <div style={{
              position: 'absolute', inset: '-10px -8px',
              border: '2px solid #3B82F6',
              borderRadius: 6,
              pointerEvents: 'none',
              boxShadow: '0 0 0 1px rgba(59,130,246,0.15)',
            }} />
          </div>

          {/* Para 5 + arrow drawn pointing to a number */}
          <div style={{ position: 'relative', marginBottom: 14 }}>
            <p style={{ fontSize: 13.5, lineHeight: 1.75, color: '#1f1f1f', fontFamily: 'Georgia, serif', margin: 0 }}>
              Revenue grew <strong>247%</strong> year over year. Net retention is <strong>118%</strong>, which is
              unusual for consumer subscriptions and we are still trying to understand why.
            </p>
          </div>

          {/* page footer */}
          <div style={{
            position: 'absolute', bottom: 28, left: 0, right: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 80px',
            fontFamily: 'var(--font-mono)', fontSize: 9.5, color: '#9CA3AF',
          }}>
            <span>plinypdf.com/2025</span>
            <span>2 / 24</span>
          </div>
        </div>
      </div>

      {/* === Floating annotations layer === */}
      {/* Blue text box "Review this section" */}
      <div style={{
        position: 'absolute', top: 380, right: -28,
        width: 168, padding: '10px 12px',
        background: 'white',
        border: '2px solid #3B82F6',
        borderRadius: 6,
        boxShadow: '0 8px 20px -8px rgba(59,130,246,0.4)',
        fontFamily: 'var(--font-display)', fontSize: 12, color: '#1E40AF', fontWeight: 500,
      }}>
        Review this section before sign-off
        <div style={{
          position: 'absolute', left: -10, top: 14,
          width: 0, height: 0,
          borderTop: '6px solid transparent', borderBottom: '6px solid transparent',
          borderRight: '10px solid #3B82F6',
        }} />
        <div style={{
          position: 'absolute', left: -7, top: 16,
          width: 0, height: 0,
          borderTop: '4px solid transparent', borderBottom: '4px solid transparent',
          borderRight: '7px solid white',
        }} />
        {/* selection handles */}
        {[[0, 0], [1, 0], [1, 1], [0, 1]].map(([x, y], i) => (
          <div key={i} style={{
            position: 'absolute',
            left: x === 0 ? -4 : 'auto', right: x === 1 ? -4 : 'auto',
            top: y === 0 ? -4 : 'auto', bottom: y === 1 ? -4 : 'auto',
            width: 8, height: 8, borderRadius: 2,
            background: 'white', border: '1.5px solid #3B82F6',
          }} />
        ))}
      </div>

      {/* Green sticky note (collapsed) on margin */}
      <div style={{
        position: 'absolute', top: 248, left: 26,
        width: 28, height: 28,
        background: '#10B981',
        borderRadius: '4px 4px 12px 4px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 6px 16px -4px rgba(16,185,129,0.5)',
        cursor: 'pointer',
      }}>
        <IconSticky size={14} color="white" sw={2} />
        <span style={{
          position: 'absolute', top: -4, right: -4,
          width: 14, height: 14, borderRadius: '50%',
          background: 'white', color: '#10B981',
          fontSize: 9, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '1px solid #10B981',
        }}>1</span>
      </div>

      {/* Arrow drawn pointing to the "247%" number */}
      <svg width="200" height="90" viewBox="0 0 200 90" style={{ position: 'absolute', right: 14, bottom: 192, pointerEvents: 'none' }}>
        <defs>
          <marker id="arrowhead-red" markerWidth="10" markerHeight="10" refX="6" refY="3" orient="auto">
            <path d="M0 0L6 3L0 6Z" fill="#F43F5E" />
          </marker>
        </defs>
        <path d="M 188 12 Q 140 36 88 60" stroke="#F43F5E" strokeWidth="2" fill="none"
              strokeLinecap="round" markerEnd="url(#arrowhead-red)" />
        <text x="100" y="22" fontFamily="var(--font-display)" fontSize="11" fill="#F43F5E" fontWeight="600">
          confirm with finance
        </text>
      </svg>

      {/* Page page-corner indicator + selection handles for the rect */}
      <div style={{
        position: 'absolute', top: 6, left: 6,
        padding: '2px 6px',
        background: 'rgba(107,92,231,0.9)', color: 'white',
        fontSize: 9.5, fontWeight: 600, letterSpacing: '0.05em',
        borderRadius: 3,
        fontFamily: 'var(--font-mono)',
      }}>EDITING</div>
    </div>
  );
};

const EditorBottomBar = ({ disabled = false }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 16,
    padding: '12px 20px',
    background: 'var(--card)',
    borderTop: '1px solid var(--line)',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
      <PdfThumb color="#A78BFA" />
      <div style={{ minWidth: 0 }}>
        <div className="pp-mono" style={{ fontSize: 12, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 240 }}>
          annual-report-2025.pdf
        </div>
        <div className="pp-mono" style={{ fontSize: 10.5, color: 'var(--text-3)', marginTop: 1 }}>
          page 2 of 24 · 7 annotations · auto-saved 2s ago
        </div>
      </div>
    </div>

    {/* Thumbnail strip */}
    <div style={{
      flex: 1, display: 'flex', gap: 4, justifyContent: 'center',
      overflow: 'hidden',
    }}>
      {Array.from({ length: 12 }).map((_, i) => {
        const isCurrent = i === 1;
        const hasAnnot = i === 1 || i === 4 || i === 7;
        return (
          <div key={i} style={{
            width: 28, height: 36, borderRadius: 3,
            background: '#FAFAF9',
            border: isCurrent ? '2px solid var(--indigo)' : '1px solid var(--line-2)',
            opacity: i > 8 ? 0.5 : 1,
            position: 'relative',
            flexShrink: 0,
          }}>
            {/* page lines */}
            <div style={{ position: 'absolute', inset: '4px 3px', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {[1, 0.7, 0.9, 0.5, 0.8].map((w, j) => (
                <div key={j} style={{ height: 1, width: `${w * 100}%`, background: '#9CA3AF' }} />
              ))}
            </div>
            {hasAnnot && (
              <span style={{
                position: 'absolute', top: -3, right: -3,
                width: 8, height: 8, borderRadius: '50%',
                background: '#BFB5FF', border: '1.5px solid var(--card)',
              }} />
            )}
            <div className="pp-mono" style={{
              position: 'absolute', bottom: -14, left: 0, right: 0,
              fontSize: 8.5, color: isCurrent ? '#BFB5FF' : 'var(--text-3)',
              textAlign: 'center',
            }}>{i + 1}</div>
          </div>
        );
      })}
      <div style={{ display: 'flex', alignItems: 'center', color: 'var(--text-3)', padding: '0 4px' }}>
        <span className="pp-mono" style={{ fontSize: 10.5 }}>···</span>
      </div>
    </div>

    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
      <button disabled={disabled} style={{
        background: 'transparent', border: 0, color: 'var(--text-2)',
        fontSize: 13, padding: '6px 10px', cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
      }}>Clear all</button>
      <button className="pp-btn" disabled={disabled} style={{ opacity: disabled ? 0.5 : 1 }}>
        <IconDownload size={14} /> Save PDF
      </button>
    </div>
  </div>
);

// === Editor with annotated PDF ===
const PDFEditorTool = () => (
  <section style={{ padding: '32px 40px 40px' }}>
    <div style={{ maxWidth: 1360, margin: '0 auto' }}>
      <Breadcrumb items={['Home', 'Tools', 'PDF Editor']} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
        <div style={{
          width: 52, height: 52, borderRadius: 13,
          background: 'rgba(107,92,231,0.14)', border: '1px solid rgba(107,92,231,0.3)',
          color: '#BFB5FF',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <IconPen size={22} sw={1.7} />
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 34, letterSpacing: '-0.025em' }}>PDF Editor</h1>
          <p style={{ fontSize: 14.5, color: 'var(--text-2)', marginTop: 2 }}>
            Annotate, highlight, draw, and mark up your PDFs.
          </p>
        </div>
        <div className="pp-badge local" style={{
          padding: '8px 14px', fontSize: 13, borderRadius: 999,
        }}>
          <span className="pp-dot" style={{ width: 8, height: 8 }} />
          Local — annotations never leave your browser
        </div>
      </div>

      {/* Editor surface */}
      <div style={{
        marginTop: 24,
        background: 'var(--bg-2)',
        border: '1px solid var(--line)',
        borderRadius: 18,
        overflow: 'hidden',
        boxShadow: '0 30px 60px -30px rgba(0,0,0,0.6)',
      }}>
        <EditorToolbar activeTool="highlight" activeColor="#FACC15" />
        {/* canvas */}
        <div style={{
          padding: '40px 40px 56px',
          background:
            'radial-gradient(60% 50% at 50% 10%, rgba(107,92,231,0.06), rgba(107,92,231,0) 70%), repeating-linear-gradient(45deg, rgba(255,255,255,0.012) 0 1px, transparent 1px 14px), var(--bg-2)',
          display: 'flex', justifyContent: 'center',
          position: 'relative',
        }}>
          <AnnotatedPdfPage />

          {/* Floating tool-active indicator */}
          <div style={{
            position: 'absolute', top: 24, left: 32,
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 10px 6px 8px',
            background: 'rgba(107,92,231,0.14)',
            border: '1px solid rgba(107,92,231,0.32)',
            borderRadius: 999,
            fontSize: 12, color: '#BFB5FF',
          }}>
            <IconHighlight size={12} sw={2} />
            Highlight tool · Yellow
            <span className="pp-mono" style={{
              padding: '1px 6px', background: 'rgba(107,92,231,0.18)', borderRadius: 4,
              fontSize: 10, color: '#DDD6FE',
            }}>H</span>
          </div>

          {/* Hint pill */}
          <div style={{
            position: 'absolute', bottom: 24, right: 32,
            display: 'inline-flex', alignItems: 'center', gap: 10,
            padding: '6px 12px',
            background: 'var(--card)',
            border: '1px solid var(--line)',
            borderRadius: 999,
            fontSize: 11.5, color: 'var(--text-2)',
          }}>
            <span className="pp-mono" style={{ padding: '1px 5px', background: 'rgba(255,255,255,0.06)', borderRadius: 3, fontSize: 10, color: 'var(--text)' }}>Space</span>
            hold to pan
            <span style={{ color: 'var(--line-2)' }}>·</span>
            <span className="pp-mono" style={{ padding: '1px 5px', background: 'rgba(255,255,255,0.06)', borderRadius: 3, fontSize: 10, color: 'var(--text)' }}>⌘Z</span>
            undo
          </div>
        </div>
        <EditorBottomBar />
      </div>
    </div>
  </section>
);

// === Editor empty / upload state ===
const PDFEditorEmpty = () => (
  <section style={{ padding: '32px 40px 40px' }}>
    <div style={{ maxWidth: 1360, margin: '0 auto' }}>
      <Breadcrumb items={['Home', 'Tools', 'PDF Editor']} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
        <div style={{
          width: 52, height: 52, borderRadius: 13,
          background: 'rgba(107,92,231,0.14)', border: '1px solid rgba(107,92,231,0.3)',
          color: '#BFB5FF',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <IconPen size={22} sw={1.7} />
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 34, letterSpacing: '-0.025em' }}>PDF Editor</h1>
          <p style={{ fontSize: 14.5, color: 'var(--text-2)', marginTop: 2 }}>
            Annotate, highlight, draw, and mark up your PDFs.
          </p>
        </div>
        <div className="pp-badge local" style={{
          padding: '8px 14px', fontSize: 13, borderRadius: 999,
        }}>
          <span className="pp-dot" style={{ width: 8, height: 8 }} />
          Local — annotations never leave your browser
        </div>
      </div>

      <div style={{
        marginTop: 24,
        background: 'var(--bg-2)',
        border: '1px solid var(--line)',
        borderRadius: 18,
        overflow: 'hidden',
      }}>
        <EditorToolbar disabled />
        <div style={{
          padding: '80px 40px',
          background:
            'radial-gradient(60% 50% at 50% 30%, rgba(107,92,231,0.05), rgba(107,92,231,0) 70%), var(--bg-2)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          minHeight: 580,
        }}>
          <div style={{
            width: 560, maxWidth: '100%',
            border: '1.5px dashed var(--line-2)',
            borderRadius: 18,
            padding: 56,
            textAlign: 'center',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0))',
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: 16,
              background: 'rgba(107,92,231,0.12)',
              border: '1px solid rgba(107,92,231,0.28)',
              color: '#BFB5FF',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 22,
            }}>
              <IconUpload size={26} sw={1.7} />
            </div>
            <h3 style={{ fontSize: 22, letterSpacing: '-0.02em', marginBottom: 8 }}>
              Drop a PDF to start annotating
            </h3>
            <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 24 }}>
              Highlight passages, draw on diagrams, add sticky notes — all in your browser.
            </p>
            <button className="pp-btn pp-btn-lg" style={{ marginBottom: 18 }}>
              <IconFile size={15} /> Browse files
            </button>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              fontSize: 12, color: 'var(--text-3)',
            }}>
              <span className="pp-dot" style={{ color: '#34D399' }} />
              All annotations processed locally · nothing is uploaded
            </div>
          </div>

          {/* Format hints */}
          <div style={{
            marginTop: 32,
            display: 'flex', alignItems: 'center', gap: 18,
            fontSize: 12, color: 'var(--text-3)',
          }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span className="pp-mono" style={{ padding: '2px 7px', background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 4, color: 'var(--text-2)' }}>.pdf</span>
              up to 100 MB
            </span>
            <span style={{ color: 'var(--line-2)' }}>·</span>
            <span>Or paste from clipboard</span>
            <span style={{ color: 'var(--line-2)' }}>·</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span className="pp-mono" style={{ padding: '2px 7px', background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 4, color: 'var(--text-2)' }}>⌘V</span>
            </span>
          </div>
        </div>
        <EditorBottomBar disabled />
      </div>
    </div>
  </section>
);

if (!document.getElementById('pp-ed-style')) {
  const s = document.createElement('style');
  s.id = 'pp-ed-style';
  s.textContent = `
    .pp-edtool:not(:disabled):hover { background: rgba(255,255,255,0.05); }
  `;
  document.head.appendChild(s);
}

const PDFEditorPage = () => (
  <div className="pp-board" style={{ width: 1440 }}>
    <Navbar active="tools" />
    <PDFEditorTool />
    <Footer />
  </div>
);

const PDFEditorEmptyPage = () => (
  <div className="pp-board" style={{ width: 1440 }}>
    <Navbar active="tools" />
    <PDFEditorEmpty />
    <Footer />
  </div>
);

Object.assign(window, { PDFEditorPage, PDFEditorEmptyPage });
