import { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';

function timeAgo(date) {
  const secs = Math.floor((Date.now() - new Date(date)) / 1000);
  if (secs < 60)   return 'just now';
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400)return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

function CaseCard({ c, onOpen }) {
  const institution = c.parsedDenial?.institution_name
    || c.parsedDenial?.institution
    || 'Unknown Institution';
  const denialType = c.parsedDenial?.denial_type
    || c.parsedDenial?.application_type
    || 'denial';
  const snippet = c.denialText?.slice(0, 120).replace(/\n/g, ' ') ?? '';

  return (
    <button
      onClick={() => onOpen(c._id)}
      className="w-full text-left rounded-2xl p-4 transition-all group"
      style={{ background: '#111113', border: '1px solid rgba(255,255,255,0.07)' }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: c.overrideTriggered ? 'rgba(244,63,94,0.12)' : 'rgba(255,255,255,0.05)', border: c.overrideTriggered ? '1px solid rgba(244,63,94,0.25)' : '1px solid rgba(255,255,255,0.08)' }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={c.overrideTriggered ? '#fb7185' : '#52525b'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{institution}</p>
            <p className="text-[11px] text-[#52525b] capitalize">{denialType}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {c.overrideTriggered ? (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(244,63,94,0.12)', color: '#fb7185', border: '1px solid rgba(244,63,94,0.22)' }}>
              VerdictX Fired
            </span>
          ) : (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(255,255,255,0.05)', color: '#52525b', border: '1px solid rgba(255,255,255,0.08)' }}>
              No Override
            </span>
          )}
          <span className="text-[10px] text-[#3f3f46]">{timeAgo(c.createdAt)}</span>
        </div>
      </div>

      {/* Concession bar */}
      <div className="flex items-center gap-2 mb-2.5">
        <div className="flex gap-1">
          {[0, 1, 2, 3].map(i => (
            <div
              key={i}
              className="w-5 h-1.5 rounded-full"
              style={{ background: i < (c.concessionCount ?? 0) ? '#fb7185' : 'rgba(255,255,255,0.08)' }}
            />
          ))}
        </div>
        <span className="text-[10px] text-[#52525b]">{c.concessionCount ?? 0}/4 conceded</span>
      </div>

      {/* Snippet */}
      <p className="text-[11px] text-[#3f3f46] leading-snug truncate">{snippet}…</p>

      {/* Open arrow */}
      <div className="flex justify-end mt-2">
        <span className="text-[10px] text-[#52525b] group-hover:text-[#818cf8] transition-colors">
          View case →
        </span>
      </div>
    </button>
  );
}

export default function Dashboard({ onNewCase, onOpenCase, onShowImpact }) {
  const { user, logout } = useAuth0();
  const [cases, setCases]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    if (!user?.sub) return;
    setLoading(true);
    fetch(`/api/cases?userId=${encodeURIComponent(user.sub)}`)
      .then(r => r.json())
      .then(data => { setCases(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => { setError('Could not load cases.'); setLoading(false); });
  }, [user?.sub]);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0a0a0b', color: '#f4f4f5' }}>

      {/* ── Top bar ── */}
      <div
        className="flex-shrink-0 px-5 h-12 flex items-center justify-between z-10 sticky top-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(10,10,11,0.97)', backdropFilter: 'blur(8px)' }}
      >
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.15)' }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-white">VerdictX</span>
          <span className="text-[#3f3f46] text-xs hidden sm:block">/ dashboard</span>
        </div>

        <div className="flex items-center gap-3">
          {onShowImpact && (
            <button
              onClick={onShowImpact}
              className="text-xs text-[#52525b] hover:text-[#a1a1aa] transition-colors hidden sm:block"
            >
              Why this matters
            </button>
          )}
          {user && (
            <div className="flex items-center gap-2 pl-3" style={{ borderLeft: '1px solid rgba(255,255,255,0.07)' }}>
              <span className="text-xs text-[#52525b]">{user.email}</span>
              <button
                onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
                className="text-xs text-[#3f3f46] hover:text-[#71717a] transition-colors"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 max-w-4xl mx-auto w-full px-6 py-8 space-y-8">

        {/* ── Welcome + New Case CTA ── */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white">
              {user?.given_name ? `Welcome back, ${user.given_name}` : 'Your Cases'}
            </h1>
            <p className="text-sm text-[#52525b] mt-0.5">
              {cases.length > 0
                ? `${cases.length} case${cases.length !== 1 ? 's' : ''} on record`
                : 'No cases yet — start your first challenge below'}
            </p>
          </div>

          <button
            onClick={onNewCase}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white flex-shrink-0 transition-all"
            style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', border: '1px solid rgba(99,102,241,0.3)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'linear-gradient(135deg, #818cf8 0%, #6366f1 100%)'}
            onMouseLeave={e => e.currentTarget.style.background = 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)'}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Case
          </button>
        </div>

        {/* ── How it works (shown only when no cases) ── */}
        {!loading && cases.length === 0 && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { step: '01', label: 'Paste denial', sub: 'loan · insurance · housing' },
              { step: '02', label: 'Agents debate', sub: 'bias · precedent · law' },
              { step: '03', label: 'Override fires', sub: '2+ concessions trigger' },
            ].map(item => (
              <div
                key={item.step}
                className="rounded-xl p-4"
                style={{ background: '#111113', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <div className="text-[10px] font-bold text-[#6366f1] uppercase tracking-widest mb-2">{item.step}</div>
                <div className="text-white text-xs font-semibold mb-1">{item.label}</div>
                <div className="text-[#52525b] text-[11px]">{item.sub}</div>
              </div>
            ))}
          </div>
        )}

        {/* ── Case list ── */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="rounded-2xl h-28 animate-pulse" style={{ background: '#111113' }} />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-xl p-4 text-sm text-[#fca5a5]"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
            {error}
          </div>
        ) : cases.length > 0 ? (
          <div>
            <p className="text-[10px] font-semibold text-[#52525b] uppercase tracking-widest mb-3">Case History</p>
            <div className="space-y-3">
              {cases.map(c => (
                <CaseCard key={c._id} c={c} onOpen={onOpenCase} />
              ))}
            </div>
          </div>
        ) : null}

      </div>
    </div>
  );
}
