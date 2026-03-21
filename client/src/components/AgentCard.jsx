const AGENT_META = {
  denial_defender: {
    name: 'Denial Defender',
    icon: '🛡️',
    role: 'DEFENSE',
    borderClass: 'border-blue-800',
    headerClass: 'bg-blue-950/60 border-b border-blue-800',
    roleClass: 'bg-blue-900/60 text-blue-300',
    dotClass: 'bg-blue-400',
  },
  bias_auditor: {
    name: 'Bias Auditor',
    icon: '🔍',
    role: 'CHALLENGER',
    borderClass: 'border-amber-800',
    headerClass: 'bg-amber-950/40 border-b border-amber-800',
    roleClass: 'bg-amber-900/50 text-amber-300',
    dotClass: 'bg-amber-400',
  },
  precedent_agent: {
    name: 'Precedent Agent',
    icon: '⚖️',
    role: 'CHALLENGER',
    borderClass: 'border-amber-800',
    headerClass: 'bg-amber-950/40 border-b border-amber-800',
    roleClass: 'bg-amber-900/50 text-amber-300',
    dotClass: 'bg-amber-400',
  },
  circumstance_agent: {
    name: 'Circumstance Agent',
    icon: '🧩',
    role: 'CHALLENGER',
    borderClass: 'border-amber-800',
    headerClass: 'bg-amber-950/40 border-b border-amber-800',
    roleClass: 'bg-amber-900/50 text-amber-300',
    dotClass: 'bg-amber-400',
  },
  legal_agent: {
    name: 'Legal Agent',
    icon: '📜',
    role: 'CHALLENGER',
    borderClass: 'border-amber-800',
    headerClass: 'bg-amber-950/40 border-b border-amber-800',
    roleClass: 'bg-amber-900/50 text-amber-300',
    dotClass: 'bg-amber-400',
  },
};

function StatusBadge({ status, rebuttalResult }) {
  if (rebuttalResult === 'CONCEDED') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-red-900/60 text-red-400 border border-red-700">
        ✗ CONCEDED
      </span>
    );
  }
  if (rebuttalResult === 'REBUTTED') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-green-900/60 text-green-400 border border-green-700">
        ✓ REBUTTED
      </span>
    );
  }
  if (status === 'arguing' || status === 'done') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-bold bg-gray-800 text-gray-400 border border-gray-700">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse-fast" />
        {status === 'done' ? 'ARGUED' : 'ARGUING'}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-bold bg-gray-800 text-gray-600 border border-gray-700">
      <span className="w-1.5 h-1.5 rounded-full bg-gray-600" />
      PENDING
    </span>
  );
}

export default function AgentCard({ agentId, state }) {
  const meta = AGENT_META[agentId];
  if (!meta) return null;

  const { status = 'pending', content = '', rebuttalResult } = state || {};

  const cardBorder =
    rebuttalResult === 'CONCEDED'
      ? 'border-red-700'
      : rebuttalResult === 'REBUTTED'
      ? 'border-green-800'
      : meta.borderClass;

  return (
    <div
      className={`rounded-xl border ${cardBorder} bg-gray-900 overflow-hidden transition-all duration-500 animate-fade-in`}
    >
      {/* Header */}
      <div className={`flex items-center justify-between px-3 py-2 ${meta.headerClass}`}>
        <div className="flex items-center gap-2">
          <span className="text-base">{meta.icon}</span>
          <span className="text-sm font-bold text-white">{meta.name}</span>
          <span className={`text-xs px-1.5 py-0.5 rounded font-mono font-bold ${meta.roleClass}`}>
            {meta.role}
          </span>
        </div>
        <StatusBadge status={status} rebuttalResult={rebuttalResult} />
      </div>

      {/* Content */}
      <div className="p-3 max-h-56 overflow-y-auto scrollbar-thin">
        {status === 'pending' ? (
          <div className="text-gray-600 text-xs font-mono italic">Waiting to fire...</div>
        ) : (
          <div
            className={`agent-content text-gray-300 ${
              status === 'arguing' ? 'cursor-blink' : ''
            }`}
          >
            {content}
          </div>
        )}
      </div>
    </div>
  );
}
