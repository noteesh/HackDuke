import Footer from './Footer.jsx';

const SAMPLE_DENIAL = `Dear Applicant,

We regret to inform you that your application for a personal loan of $5,000 has been denied. This decision was based on our automated review system.

Primary reason: Insufficient credit history.
Secondary reason: Debt-to-income ratio.

You have the right to request the specific reasons within 60 days.

- AutoLend Financial`;

export default function DenialInput({ denialText, onTextChange, onSubmit, onShowImpact }) {
  return (
    <div className="min-h-screen bg-[#0a0a0b] flex flex-col items-center justify-center p-6">
      {/* Subtle radial glow behind content */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(99,102,241,0.07) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 w-full max-w-xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 mb-5">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-3">
            The Override
          </h1>
          <p className="text-[#71717a] text-sm max-w-sm mx-auto leading-relaxed">
            Paste an algorithmic denial. Five AI agents will challenge it in parallel.
            If the institution's defense concedes 2+ arguments, the Override fires.
          </p>
        </div>

        {/* How it works */}
        <div className="grid grid-cols-3 gap-2.5 mb-7">
          {[
            { step: '01', label: 'Paste denial', sub: 'loan · insurance · housing' },
            { step: '02', label: 'Agents debate', sub: 'bias · precedent · law' },
            { step: '03', label: 'Override fires', sub: '2+ concessions trigger' },
          ].map((item) => (
            <div
              key={item.step}
              className="rounded-xl p-4 border"
              style={{ background: '#111113', borderColor: 'rgba(255,255,255,0.07)' }}
            >
              <div className="text-[10px] font-bold text-[#6366f1] uppercase tracking-widest mb-2">{item.step}</div>
              <div className="text-white text-xs font-semibold mb-1">{item.label}</div>
              <div className="text-[#52525b] text-[11px] leading-snug">{item.sub}</div>
            </div>
          ))}
        </div>

        {/* Input card */}
        <div
          className="rounded-2xl border p-5"
          style={{ background: '#111113', borderColor: 'rgba(255,255,255,0.08)' }}
        >
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider">
              Denial Letter
            </label>
            <button
              onClick={() => onTextChange(SAMPLE_DENIAL)}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
            >
              Load sample
            </button>
          </div>
          <textarea
            value={denialText}
            onChange={(e) => onTextChange(e.target.value)}
            placeholder="Paste the denial letter here..."
            rows={9}
            className="w-full rounded-xl p-4 text-sm text-[#e4e4e7] placeholder-[#3f3f46] resize-none focus:outline-none transition-colors leading-relaxed font-sans"
            style={{
              background: '#0a0a0b',
              border: '1px solid rgba(255,255,255,0.07)',
            }}
            onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.5)'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.07)'}
          />
          <button
            onClick={onSubmit}
            disabled={!denialText.trim()}
            className="mt-4 w-full py-3.5 rounded-xl font-semibold text-sm tracking-wide transition-all text-white
              disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' }}
            onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.background = 'linear-gradient(135deg, #818cf8 0%, #6366f1 100%)'; }}
            onMouseLeave={e => { if (!e.currentTarget.disabled) e.currentTarget.style.background = 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)'; }}
          >
            Initiate Override
          </button>
        </div>

        <div className="flex items-center justify-center gap-4 mt-5">
          <p className="text-[#3f3f46] text-xs">
            Powered by IBM watsonx Orchestrate — 8 AI agents
          </p>
          <span className="text-[#3f3f46] text-xs">·</span>
          <button
            onClick={onShowImpact}
            className="text-xs text-indigo-500 hover:text-indigo-400 transition-colors font-medium"
          >
            Why this matters →
          </button>
        </div>
      </div>
      <div className="fixed bottom-0 left-0 right-0 z-10">
        <Footer onShowImpact={onShowImpact} />
      </div>
    </div>
  );
}
