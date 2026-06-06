// PlinyPDF — Empty / Error / Success states (vignettes)

const StateBoard = ({ children, title, kicker, w = 640, h = 360 }) => (
  <div className="pp-board" style={{
    width: w, height: h, padding: 28,
    display: 'flex', flexDirection: 'column',
  }}>
    {kicker && (
      <div className="pp-mono" style={{ fontSize: 10.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 14 }}>
        {kicker}
      </div>
    )}
    {title && (
      <h3 style={{ fontSize: 14, marginBottom: 14, color: 'var(--text-2)', fontWeight: 500 }}>{title}</h3>
    )}
    <div style={{ flex: 1, display: 'flex' }}>{children}</div>
  </div>
);

// (a) File too large
const ErrorFileTooLarge = () => (
  <StateBoard kicker="State · error / file too large" w={640} h={360}>
    <div style={{
      flex: 1,
      border: '1.5px solid #F43F5E',
      background: 'rgba(244,63,94,0.06)',
      borderRadius: 16,
      padding: 32,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center',
    }}>
      <div style={{
        width: 52, height: 52, borderRadius: 13,
        background: 'rgba(244,63,94,0.18)', color: '#F43F5E',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 16,
      }}>
        <IconAlert size={22} sw={1.7} />
      </div>
      <div style={{ fontSize: 17, fontWeight: 500, marginBottom: 6, color: 'var(--text)' }}>
        File is too large.
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 18 }}>
        <span className="pp-mono" style={{ color: 'var(--text)' }}>annual-report-2025.pdf</span> is 142 MB · maximum is 100 MB per file.
      </div>
      <button className="pp-btn pp-btn-ghost" style={{ padding: '8px 14px', fontSize: 13 }}>
        <IconCompress size={14} /> Try compressing it first
        <IconArrow size={13} />
      </button>
    </div>
  </StateBoard>
);

// (b) Wrong file type
const ErrorWrongType = () => (
  <StateBoard kicker="State · error / wrong type" w={640} h={360}>
    <div style={{
      flex: 1,
      border: '1.5px solid var(--amber)',
      background: 'rgba(245,158,11,0.06)',
      borderRadius: 16,
      padding: 32,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center',
    }}>
      <div style={{
        width: 52, height: 52, borderRadius: 13,
        background: 'rgba(245,158,11,0.18)', color: 'var(--amber)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 16,
      }}>
        <IconFile size={22} sw={1.7} />
      </div>
      <div style={{ fontSize: 17, fontWeight: 500, marginBottom: 6, color: 'var(--text)' }}>
        That isn't a PDF.
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 18 }}>
        Only PDF files are supported in Merge. You dropped <span className="pp-mono" style={{ color: 'var(--text)' }}>meeting-notes.docx</span>.
      </div>
      <button className="pp-btn" style={{ padding: '8px 14px', fontSize: 13 }}>
        <IconWord size={14} /> Convert Word to PDF instead
        <IconArrow size={13} />
      </button>
    </div>
  </StateBoard>
);

// (c) Processing failed
const ErrorProcessing = () => (
  <StateBoard kicker="State · error / processing failed" w={640} h={360}>
    <div style={{
      flex: 1,
      border: '1px solid var(--line-2)',
      background: 'var(--card)',
      borderRadius: 16,
      padding: 28,
      display: 'flex', alignItems: 'flex-start', gap: 18,
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: 12, flexShrink: 0,
        background: 'rgba(244,63,94,0.14)', color: '#F43F5E',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <IconAlert size={20} sw={1.7} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 17, fontWeight: 500, marginBottom: 6, color: 'var(--text)' }}>
          Something went wrong processing your file.
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 14, lineHeight: 1.55 }}>
          The WASM module returned an error before finishing. This usually means the PDF is corrupted or uses an unsupported encryption.
        </p>
        <div style={{
          padding: '10px 12px',
          background: 'rgba(16,185,129,0.06)',
          border: '1px solid rgba(16,185,129,0.18)',
          borderRadius: 10,
          fontSize: 12, color: 'var(--text-2)',
          marginBottom: 16,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <IconShield size={13} color="#34D399" sw={1.8} />
          Your file was never uploaded — nothing was stored.
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="pp-btn">
            <IconRefresh size={14} /> Try again
          </button>
          <button className="pp-btn pp-btn-ghost">Report issue</button>
        </div>
      </div>
    </div>
  </StateBoard>
);

// (d) Generic success download state
const SuccessDownload = () => (
  <StateBoard kicker="State · success / generic" w={640} h={360}>
    <div style={{
      flex: 1,
      background: 'linear-gradient(180deg, rgba(16,185,129,0.1), rgba(16,185,129,0.02))',
      border: '1px solid rgba(16,185,129,0.24)',
      borderRadius: 16,
      padding: 28,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center',
    }}>
      {/* animated checkmark ring */}
      <div style={{
        position: 'relative',
        width: 72, height: 72, borderRadius: '50%',
        background: 'rgba(16,185,129,0.18)',
        color: '#34D399',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 20,
      }}>
        <div style={{
          position: 'absolute', inset: -6, borderRadius: '50%',
          border: '1.5px solid rgba(16,185,129,0.32)',
          animation: 'pppulse 2s ease-in-out infinite',
        }} />
        <IconCheck size={34} sw={2.4} />
      </div>
      <h3 style={{ fontSize: 22, letterSpacing: '-0.02em', marginBottom: 8 }}>Done! Your file is ready.</h3>
      <p style={{ fontSize: 13.5, color: 'var(--text-2)', marginBottom: 20 }}>
        <span className="pp-mono" style={{ color: 'var(--text)' }}>merged-2026-05-21.pdf</span> · 364 KB · processed in 0.4 s
      </p>
      <button className="pp-btn pp-btn-lg" style={{ background: 'var(--emerald)', boxShadow: '0 8px 20px -10px rgba(16,185,129,0.6)', marginBottom: 14 }}>
        <IconDownload size={15} /> Download
      </button>
      <div style={{ display: 'flex', gap: 16, fontSize: 12.5 }}>
        <a style={{ color: 'var(--text-2)' }}>Process another file</a>
        <span style={{ color: 'var(--line-2)' }}>·</span>
        <a style={{ color: '#BFB5FF', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          Send to a tool <IconArrow size={11} />
        </a>
      </div>
    </div>
  </StateBoard>
);

Object.assign(window, { ErrorFileTooLarge, ErrorWrongType, ErrorProcessing, SuccessDownload });
