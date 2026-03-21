const AGENT_NAMES = {
  bias_auditor: { name: 'Bias Auditor', icon: '🔍' },
  precedent_agent: { name: 'Precedent Agent', icon: '⚖️' },
  circumstance_agent: { name: 'Circumstance Agent', icon: '🧩' },
  legal_agent: { name: 'Legal Agent', icon: '📜' },
};

export default function RebuttalCard({ agentId, state }) {
  const meta = AGENT_NAMES[agentId];
  if (!meta) return null;

  const { status = 'pending', content = '', result } = state || {};

  const isActive = status === 'arguing';
  const isConceded = status === 'conceded' || result === 'CONCEDED';
  const isRebutted = status === 'rebutted' || result === 'REBUTTED';

  const borderClass = isConceded
    ? 'border-red-700 bg-red-950/20'
    : isRebutted
    ? 'border-green-800 bg-green-950/10'
    : isActive
    ? 'border-blue-800 bg-blue-950/20'
    : 'border-gray-800 bg-gray-900/60';

  const resultBadge = isConceded ? (
    <span className="px-2 py-0.5 rounded text-xs font-black bg-red-900 text-red-300 border border-red-700 animate-flash-in">
      ✗ CONCEDED
    </span>
  ) : isRebutted ? (
    <span className="px-2 py-0.5 rounded text-xs font-black bg-green-900/60 text-green-400 border border-green-700 animate-flash-in">
      ✓ REBUTTED
    </span>
  ) : isActive ? (
    <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-900/60 text-blue-300 border border-blue-800">
      REBUTTING...
    </span>
  ) : (
    <span className="px-2 py-0.5 rounded text-xs font-bold text-gray-600 border border-gray-800">
      PENDING
    </span>
  );

  return (
    <div className={`rounded-xl border ${borderClass} overflow-hidden transition-all duration-500`}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800/50">
        <div className="flex items-center gap-2">
          <span className="text-sm">{meta.icon}</span>
          <span className="text-xs font-bold text-gray-300">
            vs. {meta.name}
          </span>
        </div>
        {resultBadge}
      </div>

      {/* Rebuttal content */}
      <div className="p-3 max-h-48 overflow-y-auto scrollbar-thin">
        {status === 'pending' ? (
          <div className="text-gray-600 text-xs font-mono italic">Awaiting challenge outcome...</div>
        ) : (
          <div
            className={`agent-content text-xs ${
              isConceded ? 'text-red-300' : isRebutted ? 'text-green-300' : 'text-blue-300'
            } ${isActive ? 'cursor-blink' : ''}`}
          >
            {content}
          </div>
        )}
      </div>
    </div>
  );
}
