const AGENT_META = {
  denial_defender: {
    name: 'Denial Defender',
    role: 'Defense',
    accentColor: '#6366f1',
    accentBg: 'rgba(99,102,241,0.08)',
    accentBorder: 'rgba(99,102,241,0.2)',
    dotColor: '#818cf8',
  },
  bias_auditor: {
    name: 'Bias Auditor',
    role: 'Challenger',
    accentColor: '#f59e0b',
    accentBg: 'rgba(245,158,11,0.06)',
    accentBorder: 'rgba(245,158,11,0.18)',
    dotColor: '#fbbf24',
  },
  precedent_agent: {
    name: 'Precedent Agent',
    role: 'Challenger',
    accentColor: '#f59e0b',
    accentBg: 'rgba(245,158,11,0.06)',
    accentBorder: 'rgba(245,158,11,0.18)',
    dotColor: '#fbbf24',
  },
  circumstance_agent: {
    name: 'Circumstance Agent',
    role: 'Challenger',
    accentColor: '#f59e0b',
    accentBg: 'rgba(245,158,11,0.06)',
    accentBorder: 'rgba(245,158,11,0.18)',
    dotColor: '#fbbf24',
  },
  legal_agent: {
    name: 'Legal Agent',
    role: 'Challenger',
    accentColor: '#f59e0b',
    accentBg: 'rgba(245,158,11,0.06)',
    accentBorder: 'rgba(245,158,11,0.18)',
    dotColor: '#fbbf24',
  },
};

function StatusBadge({ status, rebuttalResult }) {
  if (rebuttalResult === 'CONCEDED') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold"
        style={{ background: 'rgba(244,63,94,0.12)', color: '#fb7185', border: '1px solid rgba(244,63,94,0.25)' }}>
        <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
        Conceded
      </span>
    );
  }
  if (rebuttalResult === 'REBUTTED') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold"
        style={{ background: 'rgba(52,211,153,0.10)', color: '#34d399', border: '1px solid rgba(52,211,153,0.22)' }}>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        Rebutted
      </span>
    );
  }
  if (status === 'arguing') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold"
        style={{ background: 'rgba(99,102,241,0.10)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.22)' }}>
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse-fast" />
        Arguing
      </span>
    );
  }
  if (status === 'done') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold"
        style={{ background: 'rgba(255,255,255,0.05)', color: '#71717a', border: '1px solid rgba(255,255,255,0.08)' }}>
        <span className="w-1.5 h-1.5 rounded-full bg-[#52525b]" />
        Done
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold"
      style={{ background: 'rgba(255,255,255,0.04)', color: '#52525b', border: '1px solid rgba(255,255,255,0.06)' }}>
      <span className="w-1.5 h-1.5 rounded-full bg-[#3f3f46]" />
      Pending
    </span>
  );
}

export default function AgentCard({ agentId, state }) {
  const meta = AGENT_META[agentId];
  if (!meta) return null;

  const { status = 'pending', content = '', rebuttalResult } = state || {};

  const isConceded = rebuttalResult === 'CONCEDED';
  const isRebutted = rebuttalResult === 'REBUTTED';

  const borderColor = isConceded
    ? 'rgba(244,63,94,0.28)'
    : isRebutted
    ? 'rgba(52,211,153,0.2)'
    : meta.accentBorder;

  const bgColor = isConceded
    ? 'rgba(244,63,94,0.05)'
    : isRebutted
    ? 'rgba(52,211,153,0.04)'
    : '#111113';

  return (
    <div
      className="rounded-xl overflow-hidden transition-all duration-500 animate-fade-in"
      style={{ border: `1px solid ${borderColor}`, background: bgColor }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{ borderBottom: `1px solid ${borderColor}`, background: isConceded ? 'rgba(244,63,94,0.06)' : isRebutted ? 'rgba(52,211,153,0.04)' : meta.accentBg }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{ background: isConceded ? '#fb7185' : isRebutted ? '#34d399' : meta.dotColor }}
          />
          <span className="text-sm font-semibold text-white">{meta.name}</span>
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide"
            style={{ color: meta.accentColor, background: `${meta.accentColor}14` }}
          >
            {meta.role}
          </span>
        </div>
        <StatusBadge status={status} rebuttalResult={rebuttalResult} />
      </div>

      {/* Content */}
      <div className="px-4 py-3 max-h-52 overflow-y-auto scrollbar-thin">
        {status === 'pending' ? (
          <p className="text-[#3f3f46] text-xs italic">Waiting to fire...</p>
        ) : (
          <div className={`agent-content ${status === 'arguing' ? 'cursor-blink' : ''}`}>
            {content}
          </div>
        )}
      </div>
    </div>
  );
}
