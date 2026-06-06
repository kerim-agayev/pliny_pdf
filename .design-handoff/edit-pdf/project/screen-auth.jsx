// PlinyPDF — Auth (sign in / sign up)

const AuthCard = ({ mode = 'signin' }) => {
  const isSignup = mode === 'signup';
  return (
    <div style={{
      width: 420,
      background: 'var(--card)',
      border: '1px solid var(--line)',
      borderRadius: 20,
      padding: 36,
      boxShadow: '0 30px 70px -30px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04) inset',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
        <a style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <PlinyMark size={32} color="var(--text)" />
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 19, letterSpacing: '-0.02em' }}>
            PlinyPDF
          </span>
        </a>
      </div>

      <h1 style={{ fontSize: 26, letterSpacing: '-0.025em', textAlign: 'center', marginBottom: 8 }}>
        {isSignup ? 'Create your account.' : 'Welcome back.'}
      </h1>
      <p style={{ fontSize: 13.5, color: 'var(--text-2)', textAlign: 'center', marginBottom: 28 }}>
        {isSignup
          ? 'Free forever. No credit card. Pro is optional.'
          : 'Pick up where you left off.'}
      </p>

      {/* Google OAuth */}
      <button style={{
        width: '100%', padding: '12px',
        background: 'var(--bg)',
        border: '1px solid var(--line-2)',
        borderRadius: 10,
        color: 'var(--text)', fontSize: 14, fontWeight: 500,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        cursor: 'pointer',
        transition: 'background 0.12s, border-color 0.12s',
        fontFamily: 'inherit',
      }} className="pp-related">
        <IconGoogle size={18} />
        Continue with Google
      </button>

      {/* Divider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
        <hr className="pp-hr" style={{ flex: 1 }} />
        <span className="pp-mono" style={{ fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>or</span>
        <hr className="pp-hr" style={{ flex: 1 }} />
      </div>

      {/* Email */}
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', fontSize: 12.5, color: 'var(--text-2)', marginBottom: 6 }}>
          Email
        </label>
        <div style={{ position: 'relative' }}>
          <IconMail size={15} color="var(--text-3)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            className="pp-input"
            type="email"
            placeholder="you@example.com"
            defaultValue={isSignup ? '' : 'aslan@meridian.co'}
            style={{ paddingLeft: 36 }}
          />
        </div>
      </div>

      {/* Password */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <label style={{ fontSize: 12.5, color: 'var(--text-2)' }}>Password</label>
          {!isSignup && (
            <a style={{ fontSize: 12, color: '#BFB5FF' }}>Forgot password?</a>
          )}
        </div>
        <div style={{ position: 'relative' }}>
          <IconLock size={15} color="var(--text-3)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            className="pp-input"
            type="password"
            placeholder={isSignup ? 'At least 8 characters' : '••••••••••'}
            defaultValue={isSignup ? '' : '••••••••••'}
            style={{ paddingLeft: 36, paddingRight: 38 }}
          />
          <button style={{
            position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
            background: 'transparent', border: 0, color: 'var(--text-3)',
            padding: 4, cursor: 'pointer',
          }}>
            <IconEye size={15} />
          </button>
        </div>
        {isSignup && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 11.5, color: 'var(--text-3)' }}>
            <span style={{ width: 60, height: 3, background: '#34D399', borderRadius: 2 }} />
            <span style={{ width: 60, height: 3, background: '#34D399', borderRadius: 2 }} />
            <span style={{ width: 60, height: 3, background: 'var(--line-2)', borderRadius: 2 }} />
            <span className="pp-mono" style={{ marginLeft: 4, color: '#34D399' }}>Strong</span>
          </div>
        )}
      </div>

      <button className="pp-btn pp-btn-lg" style={{ width: '100%', justifyContent: 'center' }}>
        {isSignup ? 'Create account' : 'Sign in'}
        <IconArrow size={15} />
      </button>

      {isSignup && (
        <p style={{ fontSize: 11.5, color: 'var(--text-3)', textAlign: 'center', marginTop: 14, lineHeight: 1.5 }}>
          By signing up, you agree to our <a style={{ color: 'var(--text-2)', textDecoration: 'underline', textUnderlineOffset: 2 }}>Terms</a>.
          We never sell your data.
        </p>
      )}

      <hr className="pp-hr" style={{ margin: '24px 0 18px' }} />

      <div style={{ fontSize: 13, color: 'var(--text-2)', textAlign: 'center' }}>
        {isSignup ? (
          <>Already have an account? <a style={{ color: '#BFB5FF' }}>Sign in →</a></>
        ) : (
          <>Don't have an account? <a style={{ color: '#BFB5FF' }}>Sign up →</a></>
        )}
      </div>
    </div>
  );
};

const AuthBoard = ({ mode = 'signin' }) => (
  <div className="pp-board" style={{
    width: 1440, height: 920,
    background: 'var(--bg)',
    backgroundImage:
      'radial-gradient(60% 50% at 20% 30%, rgba(107,92,231,0.12) 0%, rgba(107,92,231,0) 60%), radial-gradient(50% 50% at 80% 70%, rgba(244,114,182,0.06) 0%, rgba(0,0,0,0) 60%)',
    position: 'relative', overflow: 'hidden',
  }}>
    {/* subtle grid */}
    <div style={{
      position: 'absolute', inset: 0,
      backgroundImage:
        'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
      backgroundSize: '64px 64px',
      maskImage: 'radial-gradient(ellipse 60% 60% at 50% 50%, black 30%, transparent 80%)',
      pointerEvents: 'none',
    }} />

    {/* close-to-home link */}
    <div style={{
      position: 'absolute', top: 24, left: 32,
      display: 'flex', alignItems: 'center', gap: 8,
      fontSize: 13, color: 'var(--text-2)', zIndex: 5,
    }}>
      <a style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <IconArrow size={14} style={{ transform: 'rotate(180deg)' }} />
        Back to home
      </a>
    </div>

    {/* Trust strip on right */}
    <div style={{
      position: 'absolute', top: 24, right: 32,
      display: 'flex', alignItems: 'center', gap: 14,
      fontSize: 12.5, color: 'var(--text-3)', zIndex: 5,
    }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <span className="pp-dot" style={{ color: '#34D399' }} /> No tracking
      </span>
      <span>·</span>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <IconShield size={12} color="#34D399" sw={1.8} /> GDPR-compliant
      </span>
    </div>

    {/* card center */}
    <div style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <AuthCard mode={mode} />
    </div>

    {/* footer line */}
    <div style={{
      position: 'absolute', bottom: 20, left: 0, right: 0,
      textAlign: 'center', fontSize: 11.5, color: 'var(--text-3)',
    }}>
      © 2026 PlinyPDF · Named after Pliny the Elder, who organized human knowledge.
    </div>
  </div>
);

const SignInPage = () => <AuthBoard mode="signin" />;
const SignUpPage = () => <AuthBoard mode="signup" />;

Object.assign(window, { AuthCard, AuthBoard, SignInPage, SignUpPage });
