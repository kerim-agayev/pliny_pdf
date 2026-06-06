// PlinyPDF — Merge PDF tool page (interactive)

const Breadcrumb = ({ items }) => (
  <nav style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-3)', marginBottom: 28 }}>
    {items.map((it, i) => (
      <React.Fragment key={i}>
        {i > 0 && <IconChevron size={12} color="var(--text-3)" />}
        <a style={{ color: i === items.length - 1 ? 'var(--text-2)' : 'var(--text-3)' }}>{it}</a>
      </React.Fragment>
    ))}
  </nav>
);

const MOCK_FILES = [
  { id: 'f1', name: 'Q4-financial-report.pdf', size: '1.2 MB', pages: 24, color: '#A78BFA' },
  { id: 'f2', name: 'investor-deck-2026.pdf', size: '4.8 MB', pages: 42, color: '#60A5FA' },
  { id: 'f3', name: 'appendix-charts.pdf', size: '892 KB', pages: 12, color: '#34D399' },
  { id: 'f4', name: 'board-resolutions.pdf', size: '340 KB', pages: 6, color: '#F472B6' },
];

const PdfThumb = ({ color = '#A78BFA', label = 'PDF' }) => (
  <div style={{
    width: 36, height: 44, borderRadius: 4, position: 'relative', flexShrink: 0,
    background: `linear-gradient(180deg, ${color}28, ${color}10)`,
    border: `1px solid ${color}55`,
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
  }}>
    {/* page lines */}
    <div style={{ position: 'absolute', inset: '8px 6px', display: 'flex', flexDirection: 'column', gap: 3 }}>
      {[1, 0.8, 0.6, 0.9, 0.5].map((w, i) => (
        <div key={i} style={{ height: 2, width: `${w * 100}%`, background: `${color}55`, borderRadius: 1 }} />
      ))}
    </div>
    <span className="pp-mono" style={{
      position: 'absolute', bottom: 2, left: 0, right: 0,
      fontSize: 7, color, textAlign: 'center', fontWeight: 600,
    }}>{label}</span>
  </div>
);

const MergeFileRow = ({ file, index, total, dragOver, draggingIdx, onRemove, onDragStart, onDragOver, onDrop }) => {
  const isDragging = draggingIdx === index;
  return (
    <div
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={(e) => { e.preventDefault(); onDragOver(index); }}
      onDrop={() => onDrop(index)}
      className="pp-filerow"
      style={{
        opacity: isDragging ? 0.4 : 1,
        borderColor: dragOver === index && !isDragging ? 'var(--indigo)' : undefined,
        boxShadow: dragOver === index && !isDragging ? '0 0 0 3px var(--indigo-dim)' : undefined,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}>
      <span className="pp-mono" style={{ width: 22, fontSize: 11, color: 'var(--text-3)', textAlign: 'center' }}>
        {String(index + 1).padStart(2, '0')}
      </span>
      <IconGrip size={16} color="var(--text-3)" />
      <PdfThumb color={file.color} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {file.name}
        </div>
        <div className="pp-mono" style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 2 }}>
          {file.size} · {file.pages} pages
        </div>
      </div>
      <button style={{
        width: 30, height: 30, borderRadius: 8, background: 'transparent',
        border: '1px solid var(--line)', color: 'var(--text-2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
      }} onClick={() => onRemove(file.id)}>
        <IconX size={14} />
      </button>
    </div>
  );
};

const HowItWorks = () => (
  <div className="pp-card" style={{ padding: 24 }}>
    <h3 style={{ fontSize: 15, marginBottom: 18, letterSpacing: '-0.015em' }}>How it works</h3>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {[
        ['Drop your files', 'Add any number of PDFs. Drag to reorder.'],
        ['Merge locally', 'pdf-lib (WASM) stitches pages inside your browser. No upload.'],
        ['Download', 'Save the combined PDF or send it straight to a tool.'],
      ].map(([t, b], i) => (
        <div key={i} style={{ display: 'flex', gap: 14 }}>
          <div className="pp-mono" style={{
            width: 24, height: 24, borderRadius: 6, flexShrink: 0,
            background: 'rgba(107,92,231,0.14)', color: '#BFB5FF',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 600,
          }}>{i + 1}</div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 500, marginBottom: 2 }}>{t}</div>
            <div style={{ fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.5 }}>{b}</div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const RelatedTools = () => {
  const related = ['split', 'compress', 'rotate'];
  return (
    <div className="pp-card" style={{ padding: 24 }}>
      <h3 style={{ fontSize: 15, marginBottom: 14, letterSpacing: '-0.015em' }}>Related tools</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {related.map(id => {
          const t = TOOLS.find(x => x.id === id);
          const Ic = window[t.icon];
          return (
            <a key={id} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 8px', margin: '0 -8px', borderRadius: 8,
              transition: 'background 0.12s',
            }} className="pp-related">
              <div style={{
                width: 28, height: 28, borderRadius: 7,
                background: 'rgba(255,255,255,0.04)', border: '1px solid var(--line)',
                color: t.accent,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Ic size={15} sw={1.7} />
              </div>
              <div style={{ flex: 1, fontSize: 13.5, color: 'var(--text)' }}>{t.name}</div>
              <IconArrow size={13} color="var(--text-3)" />
            </a>
          );
        })}
      </div>
    </div>
  );
};

const SecurityNote = () => (
  <div style={{
    padding: 18,
    background: 'rgba(16,185,129,0.06)',
    border: '1px solid rgba(16,185,129,0.18)',
    borderRadius: 14,
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
      <IconShield size={15} color="#34D399" sw={1.7} />
      <div style={{ fontSize: 13.5, fontWeight: 600, color: '#6EE7B7' }}>Verifiable privacy</div>
    </div>
    <p style={{ fontSize: 12.5, lineHeight: 1.55, color: 'var(--text-2)', marginBottom: 10 }}>
      Open DevTools → Network. You'll see no upload traffic when you click Merge.
    </p>
    <a className="pp-mono" style={{ fontSize: 11.5, color: '#6EE7B7' }}>
      How we verify → 
    </a>
  </div>
);

const MergeTool = () => {
  // possible states: 'idle' (empty), 'staged' (files added), 'processing', 'done'
  const [state, setState] = React.useState('staged');
  const [files, setFiles] = React.useState(MOCK_FILES);
  const [dragOver, setDragOver] = React.useState(-1);
  const [draggingIdx, setDraggingIdx] = React.useState(-1);
  const [dropGlow, setDropGlow] = React.useState(false);

  const totalPages = files.reduce((s, f) => s + f.pages, 0);

  const onDragStart = (i) => setDraggingIdx(i);
  const onDragOver = (i) => setDragOver(i);
  const onDrop = (i) => {
    if (draggingIdx === -1 || draggingIdx === i) {
      setDraggingIdx(-1); setDragOver(-1); return;
    }
    const next = [...files];
    const [moved] = next.splice(draggingIdx, 1);
    next.splice(i, 0, moved);
    setFiles(next);
    setDraggingIdx(-1); setDragOver(-1);
  };
  const removeFile = (id) => setFiles(files.filter(f => f.id !== id));

  const startMerge = () => {
    setState('processing');
    setTimeout(() => setState('done'), 2200);
  };

  return (
    <section style={{ padding: '40px 40px 96px' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <Breadcrumb items={['Home', 'Tools', 'Merge PDF']} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 13,
            background: 'rgba(107,92,231,0.14)', border: '1px solid rgba(107,92,231,0.3)',
            color: '#BFB5FF',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <IconMerge size={24} sw={1.6} />
          </div>
          <div>
            <h1 style={{ fontSize: 36, letterSpacing: '-0.025em' }}>Merge PDF</h1>
            <p style={{ fontSize: 14.5, color: 'var(--text-2)', marginTop: 2 }}>
              Combine multiple PDFs into a single file. Drag to reorder pages.
            </p>
          </div>
        </div>

        <PrivacyBadge mode="local" big />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 32, marginTop: 32 }}>
          {/* Main */}
          <div>
            {/* Drop zone */}
            <div
              className={`pp-drop ${dropGlow ? 'glow' : ''}`}
              onDragEnter={() => setDropGlow(true)}
              onDragLeave={() => setDropGlow(false)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => setDropGlow(false)}
              style={{ marginBottom: 20 }}
            >
              <div style={{
                width: 56, height: 56, borderRadius: 14,
                background: dropGlow ? 'rgba(107,92,231,0.2)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${dropGlow ? 'rgba(107,92,231,0.4)' : 'var(--line)'}`,
                color: dropGlow ? '#BFB5FF' : 'var(--text-2)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 16,
                transition: 'all 0.2s',
              }}>
                <IconUpload size={22} sw={1.7} />
              </div>
              <div style={{ fontSize: 17, fontWeight: 500, marginBottom: 6, color: 'var(--text)' }}>
                {dropGlow ? 'Drop to add' : 'Drop PDF files here'}
              </div>
              <div style={{ fontSize: 13.5, color: 'var(--text-2)' }}>
                or <a style={{ color: '#BFB5FF', textDecoration: 'underline', textUnderlineOffset: 3 }}>browse from your device</a>
                <span style={{ color: 'var(--text-3)' }}> · multiple files supported</span>
              </div>
            </div>

            {/* File list / processing / done */}
            {state !== 'done' && files.length > 0 && (
              <div style={{ marginTop: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                    <h3 style={{ fontSize: 15 }}>Files to merge</h3>
                    <span className="pp-mono" style={{ fontSize: 12, color: 'var(--text-3)' }}>
                      {files.length} files · {totalPages} pages
                    </span>
                  </div>
                  <button style={{
                    background: 'transparent', border: 0, color: 'var(--text-2)',
                    fontSize: 13, cursor: 'pointer',
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                  }}>
                    <IconPlus size={13} /> Add more
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {files.map((f, i) => (
                    <MergeFileRow
                      key={f.id} file={f} index={i} total={files.length}
                      dragOver={dragOver} draggingIdx={draggingIdx}
                      onRemove={removeFile}
                      onDragStart={onDragStart} onDragOver={onDragOver} onDrop={onDrop}
                    />
                  ))}
                </div>

                {/* Action row */}
                <div style={{
                  marginTop: 24,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div className="pp-mono" style={{ fontSize: 11.5, color: 'var(--text-3)' }}>OUTPUT FILENAME</div>
                    <div style={{ fontSize: 14, fontFamily: 'var(--font-mono)', color: 'var(--text)' }}>
                      merged-2026-05-21.pdf
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button className="pp-btn pp-btn-ghost pp-btn-lg" onClick={() => setFiles([])}>Clear</button>
                    {state === 'processing' ? (
                      <button className="pp-btn pp-btn-lg" disabled style={{ minWidth: 180, justifyContent: 'center' }}>
                        <Spinner /> Merging…
                      </button>
                    ) : (
                      <button className="pp-btn pp-btn-lg" onClick={startMerge} style={{ minWidth: 180, justifyContent: 'center' }}>
                        Merge {files.length} files <IconArrow size={15} />
                      </button>
                    )}
                  </div>
                </div>

                {state === 'processing' && (
                  <div style={{ marginTop: 18, padding: 16, background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div style={{ fontSize: 13, color: 'var(--text)' }}>Stitching pages locally…</div>
                      <div className="pp-mono" style={{ fontSize: 12, color: 'var(--text-2)' }}>62%</div>
                    </div>
                    <div className="pp-progress"><span style={{ width: '62%' }} /></div>
                    <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className="pp-dot" style={{ color: '#34D399' }} />
                      WASM · pdf-lib 1.17 · zero network requests
                    </div>
                  </div>
                )}
              </div>
            )}

            {state === 'done' && (
              <div style={{
                marginTop: 28,
                padding: 36,
                background: 'linear-gradient(180deg, rgba(16,185,129,0.08), rgba(16,185,129,0.02))',
                border: '1px solid rgba(16,185,129,0.22)',
                borderRadius: 18,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: 14,
                    background: 'rgba(16,185,129,0.18)', color: '#34D399',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <IconCheck size={26} sw={2.4} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: 22, letterSpacing: '-0.015em', marginBottom: 4 }}>Merged successfully.</h3>
                    <p style={{ fontSize: 13.5, color: 'var(--text-2)' }}>
                      <span className="pp-mono" style={{ color: 'var(--text)' }}>merged-2026-05-21.pdf</span> · {totalPages} pages · 7.2 MB · processed in 1.8 s
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button className="pp-btn pp-btn-ghost pp-btn-lg" onClick={() => setState('staged')}>Merge again</button>
                    <button className="pp-btn pp-btn-lg" style={{ background: 'var(--emerald)', boxShadow: '0 8px 20px -10px rgba(16,185,129,0.6)' }}>
                      <IconDownload size={15} /> Download
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <HowItWorks />
            <SecurityNote />
            <RelatedTools />
          </aside>
        </div>
      </div>
    </section>
  );
};

const Spinner = () => (
  <span style={{
    width: 14, height: 14, borderRadius: '50%',
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: 'white',
    display: 'inline-block', animation: 'ppspin 0.8s linear infinite',
  }} />
);

// Inject spin keyframes once
if (!document.getElementById('pp-anim')) {
  const s = document.createElement('style');
  s.id = 'pp-anim';
  s.textContent = `
    @keyframes ppspin { to { transform: rotate(360deg); } }
    @keyframes pppulse { 0%,100% { opacity: 0.8; } 50% { opacity: 0.3; } }
    .pp-related:hover { background: rgba(255,255,255,0.04); }
  `;
  document.head.appendChild(s);
}

const MergePage = () => (
  <div className="pp-board" style={{ width: 1440 }}>
    <Navbar active="tools" />
    <MergeTool />
    <Footer />
  </div>
);

Object.assign(window, { MergePage, Spinner });
