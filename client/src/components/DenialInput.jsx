const SAMPLE_DENIAL = `Dear Applicant,

We regret to inform you that your application for a personal loan of $5,000 has been denied. This decision was based on our automated review system.

Primary reason: Insufficient credit history.
Secondary reason: Debt-to-income ratio.

You have the right to request the specific reasons within 60 days.

- AutoLend Financial`;

export default function DenialInput({ denialText, onTextChange, onSubmit }) {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6">
      {/* Grid background */}
      <div
        className="fixed inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(#f59e0b 1px, transparent 1px), linear-gradient(90deg, #f59e0b 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative z-10 w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="text-5xl">⚡</span>
          </div>
          <h1 className="text-5xl font-black text-white tracking-tight mb-3">
            THE OVERRIDE
          </h1>
          <p className="text-gray-400 text-base max-w-md mx-auto leading-relaxed">
            Paste an algorithmic denial. Five AI agents will challenge it. If the
            institution's own defense concedes 2+ arguments — the Override fires.
          </p>
        </div>

        {/* How it works */}
        <div className="grid grid-cols-3 gap-3 mb-8 text-center">
          {[
            { icon: '📋', label: 'Paste denial', sub: 'loan · insurance · housing · benefits' },
            { icon: '⚔️', label: '5 agents debate', sub: 'bias · precedent · law · circumstance' },
            { icon: '⚡', label: 'Override fires', sub: '2+ concessions → appeal letter generated' },
          ].map((item) => (
            <div key={item.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="text-2xl mb-2">{item.icon}</div>
              <div className="text-white text-sm font-semibold">{item.label}</div>
              <div className="text-gray-500 text-xs mt-1">{item.sub}</div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              Denial Letter
            </label>
            <button
              onClick={() => onTextChange(SAMPLE_DENIAL)}
              className="text-xs text-amber-500 hover:text-amber-400 transition-colors underline underline-offset-2"
            >
              Load sample denial
            </button>
          </div>
          <textarea
            value={denialText}
            onChange={(e) => onTextChange(e.target.value)}
            placeholder="Paste the denial letter here..."
            rows={10}
            className="w-full bg-gray-950 border border-gray-700 rounded-xl p-4 text-sm text-gray-200 placeholder-gray-600 resize-none focus:outline-none focus:border-amber-500 transition-colors font-mono leading-relaxed"
          />
          <button
            onClick={onSubmit}
            disabled={!denialText.trim()}
            className="mt-4 w-full py-4 rounded-xl font-black text-base tracking-widest uppercase transition-all
              bg-amber-500 text-gray-950 hover:bg-amber-400 active:scale-[0.98]
              disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-amber-500"
          >
            ⚡ INITIATE OVERRIDE
          </button>
        </div>

        <p className="text-center text-gray-600 text-xs mt-6">
          Using mock data — no real API calls made
        </p>
      </div>
    </div>
  );
}
