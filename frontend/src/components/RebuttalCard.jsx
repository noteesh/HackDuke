const AGENT_NAMES = {
  bias_auditor: { name: 'Bias Auditor' },
  precedent_agent: { name: 'Precedent Agent' },
  circumstance_agent: { name: 'Circumstance Agent' },
  legal_agent: { name: 'Legal Agent' },
};

export default function RebuttalCard({ agentId, state }) {
  const meta = AGENT_NAMES[agentId];
  if (!meta) return null;

  const { status = 'pending', content = '', result } = state || {};

  const isActive = status === 'arguing';
  const isConceded = status === 'conceded' || result === 'CONCEDED';
  const isRebutted = status === 'rebutted' || result === 'REBUTTED';

  const borderColor = isConceded
    ? 'rgba(244,63,94,0.28)'
    : isRebutted
    ? 'rgba(52,211,153,0.2)'
    : isActive
    ? 'rgba(99,102,241,0.22)'
    : 'rgba(255,255,255,0.07)';

  const bgColor = isConceded
    ? 'rgba(244,63,94,0.05)'
    : isRebutted
    ? 'rgba(52,211,153,0.04)'
    : isActive
    ? 'rgba(99,102,241,0.04)'
    : '#111113';

  const resultBadge = isConceded ? (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold animate-flash-in"
      style={{ background: 'rgba(244,63,94,0.12)', color: '#fb7185', border: '1px solid rgba(244,63,94,0.25)' }}>
      <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
      Conceded
    </span>
  ) : isRebutted ? (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold animate-flash-in"
      style={{ background: 'rgba(52,211,153,0.10)', color: '#34d399', border: '1px solid rgba(52,211,153,0.22)' }}>
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
      Rebutted
    </span>
  ) : isActive ? (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold"
      style={{ background: 'rgba(99,102,241,0.10)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.22)' }}>
      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse-fast" />
      Rebutting
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold"
      style={{ background: 'rgba(255,255,255,0.04)', color: '#52525b', border: '1px solid rgba(255,255,255,0.06)' }}>
      Pending
    </span>
  );

  const textColor = isConceded ? '#fda4af' : isRebutted ? '#6ee7b7' : isActive ? '#a5b4fc' : '#71717a';

  return (
    <div
      className="rounded-xl overflow-hidden transition-all duration-500"
      style={{ border: `1px solid ${borderColor}`, background: bgColor }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3.5 py-2.5"
        style={{ borderBottom: `1px solid ${borderColor}` }}
      >
        <span className="text-xs font-semibold text-[#a1a1aa]">
          vs. {meta.name}
        </span>
        {resultBadge}
      </div>

      {/* Content */}
      <div className="px-3.5 py-3 max-h-44 overflow-y-auto scrollbar-thin">
        {status === 'pending' ? (
          <p className="text-[#3f3f46] text-xs italic">Awaiting challenge...</p>
        ) : (
          <div
            className={`agent-content ${isActive ? 'cursor-blink' : ''}`}
            style={{ color: textColor }}
          >
            {content}
          </div>
        )}
      </div>
    </div>
  );
}
