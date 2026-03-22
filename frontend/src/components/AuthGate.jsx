import { useAuth0 } from '@auth0/auth0-react';

// Wireframe document with a glowing dot tracing its outline + internal lines
function DocumentWireframe() {
  // Document rect: x=60, y=30, w=200, h=260, corner fold=20

  // The continuous motion path (dot travels along a single connected route)
  const motionPath = [
    'M 60 30',
    'L 240 30 L 260 50 L 260 290 L 60 290 L 60 30',
    'L 240 30 L 240 50 L 260 50',
    'M 80 60 L 240 60 L 240 80 L 80 80 L 80 60',
    'M 80 105 L 220 105',
    'M 80 122 L 200 122',
    'M 80 139 L 230 139',
    'M 80 156 L 190 156',
    'M 80 173 L 215 173',
    'M 80 190 L 205 190',
    'M 80 207 L 225 207',
    'M 80 224 L 175 224',
    'M 80 255 L 180 255',
    'M 80 270 L 140 270',
  ].join(' ');

  return (
    <svg
      viewBox="0 0 320 320"
      fill="none"
      className="w-full h-full"
      style={{ maxWidth: 520, maxHeight: 520 }}
    >
      <defs>
        {/* Glow filter for the dot */}
        <filter id="dotGlow" x="-200%" y="-200%" width="500%" height="500%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="lineGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ── Static wireframe ── */}
      {/* Outer border */}
      <path
        d="M 60 30 L 240 30 L 260 50 L 260 290 L 60 290 Z"
        stroke="rgba(99,102,241,0.18)"
        strokeWidth="1.5"
        fill="rgba(99,102,241,0.02)"
      />
      {/* Fold corner lines */}
      <path
        d="M 240 30 L 240 50 L 260 50"
        stroke="rgba(99,102,241,0.18)"
        strokeWidth="1"
      />
      {/* Header block */}
      <rect
        x="80" y="60" width="160" height="20"
        fill="rgba(99,102,241,0.06)"
        stroke="rgba(99,102,241,0.18)"
        strokeWidth="1"
      />
      {/* Body text lines */}
      {[105, 122, 139, 156, 173, 190, 207, 224].map((y, i) => (
        <line
          key={y}
          x1="80" y1={y}
          x2={[220, 200, 230, 190, 215, 205, 225, 175][i]}
          y2={y}
          stroke="rgba(99,102,241,0.14)"
          strokeWidth="1"
          strokeLinecap="round"
        />
      ))}
      {/* Signature lines */}
      <line x1="80" y1="255" x2="180" y2="255" stroke="rgba(99,102,241,0.2)" strokeWidth="1" strokeLinecap="round" />
      <line x1="80" y1="270" x2="140" y2="270" stroke="rgba(99,102,241,0.12)" strokeWidth="1" strokeLinecap="round" />

      {/* ── Animated glowing dot ── */}
      <circle r="4" fill="#818cf8" filter="url(#dotGlow)">
        <animateMotion
          dur="7s"
          repeatCount="indefinite"
          path={motionPath}
          rotate="auto"
        />
      </circle>

      {/* Outer halo ring around dot */}
      <circle r="8" fill="rgba(129,140,248,0.15)" filter="url(#dotGlow)">
        <animateMotion
          dur="7s"
          repeatCount="indefinite"
          path={motionPath}
          rotate="auto"
        />
      </circle>

      {/* ── Trailing comet — slightly delayed, fades in ── */}
      <circle r="2.5" fill="rgba(129,140,248,0.5)">
        <animateMotion
          dur="7s"
          repeatCount="indefinite"
          path={motionPath}
          rotate="auto"
          keyPoints="0;1"
          keyTimes="0;1"
          begin="0.08s"
        />
      </circle>
      <circle r="1.5" fill="rgba(129,140,248,0.25)">
        <animateMotion
          dur="7s"
          repeatCount="indefinite"
          path={motionPath}
          rotate="auto"
          begin="0.16s"
        />
      </circle>
    </svg>
  );
}

const BUILT_WITH = [
  {
    name: 'ElevenLabs',
    logo: (
      <svg viewBox="0 0 80 24" fill="currentColor" className="h-5">
        <text x="0" y="18" fontSize="16" fontWeight="700" fontFamily="Inter, sans-serif">11</text>
        <text x="22" y="18" fontSize="16" fontWeight="400" fontFamily="Inter, sans-serif">ElevenLabs</text>
      </svg>
    ),
  },
  {
    name: 'Auth0',
    logo: (
      <svg viewBox="0 0 60 24" fill="currentColor" className="h-5">
        <text x="0" y="18" fontSize="16" fontWeight="700" fontFamily="Inter, sans-serif">Auth0</text>
      </svg>
    ),
  },
  {
    name: 'Gemini',
    logo: (
      <svg viewBox="0 0 70 24" fill="currentColor" className="h-5">
        <text x="0" y="18" fontSize="16" fontWeight="400" fontFamily="Inter, sans-serif">Gemini</text>
      </svg>
    ),
  },
  {
    name: 'IBM Orchestrate',
    logo: (
      <svg viewBox="0 0 130 24" fill="currentColor" className="h-5">
        <text x="0" y="18" fontSize="16" fontWeight="700" fontFamily="Inter, sans-serif">IBM </text>
        <text x="38" y="18" fontSize="16" fontWeight="400" fontFamily="Inter, sans-serif">Orchestrate</text>
      </svg>
    ),
  },
  {
    name: 'Twilio',
    logo: (
      <svg viewBox="0 0 60 24" fill="currentColor" className="h-5">
        <text x="0" y="18" fontSize="16" fontWeight="400" fontFamily="Inter, sans-serif">Twilio</text>
      </svg>
    ),
  },
  {
    name: 'DigitalOcean',
    logo: (
      <svg viewBox="0 0 110 24" fill="currentColor" className="h-5">
        <text x="0" y="18" fontSize="16" fontWeight="400" fontFamily="Inter, sans-serif">DigitalOcean</text>
      </svg>
    ),
  },
  {
    name: 'OpenAI',
    logo: (
      <svg viewBox="0 0 65 24" fill="currentColor" className="h-5">
        <text x="0" y="18" fontSize="16" fontWeight="400" fontFamily="Inter, sans-serif">OpenAI</text>
      </svg>
    ),
  },
];

function LoadingScreen() {
  return (
    <div className="h-screen flex items-center justify-center" style={{ background: '#0a0a0b' }}>
      <div className="flex items-center gap-2.5 text-sm text-[#52525b]">
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
        Loading...
      </div>
    </div>
  );
}

function ErrorScreen({ message }) {
  return (
    <div className="h-screen flex items-center justify-center" style={{ background: '#0a0a0b' }}>
      <div className="text-sm text-rose-400">Authentication error: {message}</div>
    </div>
  );
}

function LoginScreen({ onLogin, onShowImpact }) {
  return (
    <div className="h-screen flex overflow-hidden" style={{ background: '#080b14' }}>

      {/* ── LEFT — Hero panel ── */}
      <div className="hidden lg:flex flex-col flex-1 relative overflow-hidden px-14 py-12">

        {/* Ambient glow blobs */}
        <div
          className="absolute pointer-events-none"
          style={{
            width: 700, height: 700,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(56,100,220,0.15) 0%, transparent 70%)',
            top: -180, left: -120,
          }}
        />
        <div
          className="absolute pointer-events-none"
          style={{
            width: 500, height: 500,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.10) 0%, transparent 70%)',
            bottom: 40, right: 0,
          }}
        />

        {/* Logo — top left */}
        <div className="relative flex items-center gap-2.5 mb-10">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </div>
          <span className="text-white font-bold text-xl tracking-tight">The Override</span>
        </div>

        {/* Middle section: hero copy LEFT + wireframe RIGHT */}
        <div className="relative flex flex-1 items-center gap-8 min-h-0">

          {/* Text column */}
          <div className="flex flex-col justify-center flex-1 min-w-0">
            <h1 className="text-5xl font-bold text-white tracking-tight leading-tight mb-4">
              The platform for<br />
              <span style={{ color: '#818cf8' }}>adversarial AI</span>
            </h1>
            <p className="text-sm leading-relaxed mb-1.5" style={{ color: '#f4f4f5', fontFamily: "'JetBrains Mono', monospace" }}>
              Challenge automated denials with multi-agent AI.
            </p>
            <p className="text-sm leading-relaxed" style={{ color: '#f4f4f5', fontFamily: "'JetBrains Mono', monospace" }}>
              Override the algorithm — reclaim your rights.
            </p>
            {onShowImpact && (
              <button
                onClick={onShowImpact}
                className="mt-5 text-xs text-[#52525b] hover:text-[#818cf8] transition-colors text-left"
              >
                85% of banks use AI to make denials. Black applicants are 80% more likely to be rejected.{' '}
                <span className="underline underline-offset-2">See the research →</span>
              </button>
            )}
          </div>

          {/* Wireframe column — sits between text and login panel */}
          <div className="flex-shrink-0 flex items-center justify-center pointer-events-none" style={{ width: 460, height: 480 }}>
            <DocumentWireframe />
          </div>
        </div>

        {/* Built With — pinned to bottom */}
        <div className="relative mt-10">
          <p className="text-xs font-medium text-[#3f3f46] uppercase tracking-widest mb-4">Built With</p>
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
            {BUILT_WITH.map((tech) => (
              <div key={tech.name} className="text-[#52525b] hover:text-[#71717a] transition-colors" title={tech.name}>
                {tech.logo}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT — Login card ── */}
      <div
        className="flex items-center justify-center w-full lg:w-[440px] flex-shrink-0 px-8"
        style={{ background: '#0d1117', borderLeft: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 mb-8 justify-center">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)' }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </div>
            <span className="text-white font-semibold text-sm">The Override</span>
          </div>

          <h2 className="text-xl font-semibold text-white mb-1">Sign in</h2>
          <p className="text-sm text-[#71717a] mb-8">
            Challenge algorithmic denials with AI agents
          </p>

          {/* Login button */}
          <button
            onClick={onLogin}
            className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-lg text-sm font-medium text-white transition-all mb-4"
            style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              border: '1px solid rgba(99,102,241,0.4)',
              boxShadow: '0 1px 20px rgba(99,102,241,0.2)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #818cf8 0%, #6366f1 100%)';
              e.currentTarget.style.boxShadow = '0 1px 28px rgba(99,102,241,0.35)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)';
              e.currentTarget.style.boxShadow = '0 1px 20px rgba(99,102,241,0.2)';
            }}
          >
            Continue with Auth0
          </button>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
            <span className="text-xs text-[#3f3f46]">secured by</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { icon: '🔒', label: 'End-to-end encrypted' },
              { icon: '🛡️', label: 'Auth0 identity' },
              { icon: '⚡', label: 'Instant access' },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-lg p-3 text-center"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div className="text-base mb-1.5">{item.icon}</div>
                <div className="text-[10px] text-[#52525b] leading-snug">{item.label}</div>
              </div>
            ))}
          </div>

          {/* Mobile built-with */}
          <div className="flex lg:hidden flex-wrap items-center justify-center gap-4 mt-10">
            <p className="w-full text-center text-[10px] text-[#3f3f46] uppercase tracking-widest mb-1">Built With</p>
            {BUILT_WITH.map((tech) => (
              <div key={tech.name} className="text-[#3f3f46]" title={tech.name}>
                {tech.logo}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthGate({ children, onShowImpact }) {
  const { isLoading, error, isAuthenticated, loginWithRedirect } = useAuth0();

  if (isLoading) return <LoadingScreen />;
  if (error) return <ErrorScreen message={error.message} />;
  if (!isAuthenticated) return <LoginScreen onLogin={() => loginWithRedirect()} onShowImpact={onShowImpact} />;

  return children;
}
