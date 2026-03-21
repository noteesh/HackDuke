const AGENT_META = {
  denial_defender: {
    name: 'Denial Defender',
    role: 'Institution\'s Advocate',
    description: 'Represents the institution — builds the strongest possible defense of the denial using industry standards, regulatory frameworks, and the institution\'s stated criteria.',
    accentColor: '#6366f1',
    accentBg: 'rgba(99,102,241,0.08)',
    accentBorder: 'rgba(99,102,241,0.2)',
    dotColor: '#818cf8',
  },
  bias_auditor: {
    name: 'Bias Auditor',
    role: 'Discrimination Analyst',
    description: 'Scans for discrimination signals — proxy variables, disparate impact on protected classes, algorithmic bias, and procedural failures that disproportionately affect minorities.',
    accentColor: '#f59e0b',
    accentBg: 'rgba(245,158,11,0.06)',
    accentBorder: 'rgba(245,158,11,0.18)',
    dotColor: '#fbbf24',
  },
  precedent_agent: {
    name: 'Precedent Agent',
    role: 'Legal Research',
    description: 'Finds court cases, CFPB enforcement actions, and regulatory guidance where similar denials were successfully challenged or resulted in penalties for the institution.',
    accentColor: '#f59e0b',
    accentBg: 'rgba(245,158,11,0.06)',
    accentBorder: 'rgba(245,158,11,0.18)',
    dotColor: '#fbbf24',
  },
  circumstance_agent: {
    name: 'Circumstance Agent',
    role: 'Context Analyst',
    description: 'Argues what the algorithm structurally cannot see — life circumstances, alternative credit evidence, income blind spots, recent changes, and compensating factors.',
    accentColor: '#f59e0b',
    accentBg: 'rgba(245,158,11,0.06)',
    accentBorder: 'rgba(245,158,11,0.18)',
    dotColor: '#fbbf24',
  },
  legal_agent: {
    name: 'Legal Agent',
    role: 'Statutory Violations',
    description: 'Identifies specific violations in the denial — ECOA, FCRA, Regulation B — with exact section citations, severity ratings, and whether a private right of action exists.',
    accentColor: '#f59e0b',
    accentBg: 'rgba(245,158,11,0.06)',
    accentBorder: 'rgba(245,158,11,0.18)',
    dotColor: '#fbbf24',
  },
};

// Extract a strength/risk level badge value from the agent's structured data
function getStrengthBadge(agentId, data) {
  if (!data) return null;
  switch (agentId) {
    case 'bias_auditor':
      return { label: data.overall_discrimination_risk, prefix: 'Risk' };
    case 'precedent_agent':
      return { label: data.overall_precedent_strength ?? data.overall_precedence_strength, prefix: 'Precedent' };
    case 'circumstance_agent':
      return { label: data.overall_circumstance_strength, prefix: 'Strength' };
    case 'legal_agent':
      return { label: data.overall_legal_risk, prefix: 'Legal risk' };
    case 'denial_defender':
      return { label: data.overall_defense_confidence, prefix: 'Confidence' };
    default:
      return null;
  }
}

function strengthColor(label) {
  if (!label) return { color: '#52525b', bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.08)' };
  const u = label.toUpperCase();
  if (u === 'CRITICAL' || u === 'HIGH' || u === 'STRONG')
    return { color: '#fb7185', bg: 'rgba(244,63,94,0.10)', border: 'rgba(244,63,94,0.22)' };
  if (u === 'MEDIUM' || u === 'MODERATE')
    return { color: '#fbbf24', bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.22)' };
  if (u === 'LOW' || u === 'WEAK')
    return { color: '#34d399', bg: 'rgba(52,211,153,0.10)', border: 'rgba(52,211,153,0.22)' };
  return { color: '#818cf8', bg: 'rgba(99,102,241,0.10)', border: 'rgba(99,102,241,0.22)' };
}

function StatusBadge({ status, rebuttalResult }) {
  if (rebuttalResult === 'CONCEDED') return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold"
      style={{ background: 'rgba(244,63,94,0.12)', color: '#fb7185', border: '1px solid rgba(244,63,94,0.25)' }}>
      <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
      Conceded
    </span>
  );
  if (rebuttalResult === 'REBUTTED') return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold"
      style={{ background: 'rgba(52,211,153,0.10)', color: '#34d399', border: '1px solid rgba(52,211,153,0.22)' }}>
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
      Rebutted
    </span>
  );
  if (status === 'arguing') return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold"
      style={{ background: 'rgba(99,102,241,0.10)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.22)' }}>
      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
      Arguing
    </span>
  );
  if (status === 'done') return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold"
      style={{ background: 'rgba(255,255,255,0.05)', color: '#71717a', border: '1px solid rgba(255,255,255,0.08)' }}>
      <span className="w-1.5 h-1.5 rounded-full bg-[#52525b]" />
      Done
    </span>
  );
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

  const { status = 'pending', content = '', rebuttalResult, data } = state || {};

  const isConceded = rebuttalResult === 'CONCEDED';
  const isRebutted = rebuttalResult === 'REBUTTED';

  const borderColor = isConceded ? 'rgba(244,63,94,0.28)'
    : isRebutted ? 'rgba(52,211,153,0.2)'
    : meta.accentBorder;

  const bgColor = isConceded ? 'rgba(244,63,94,0.05)'
    : isRebutted ? 'rgba(52,211,153,0.04)'
    : '#111113';

  const badge = getStrengthBadge(agentId, data);
  const badgeColors = strengthColor(badge?.label);

  return (
    <div
      className="rounded-xl overflow-hidden transition-all duration-500 animate-fade-in"
      style={{ border: `1px solid ${borderColor}`, background: bgColor }}
    >
      {/* Header */}
      <div
        className="px-4 py-3"
        style={{
          borderBottom: `1px solid ${borderColor}`,
          background: isConceded ? 'rgba(244,63,94,0.06)' : isRebutted ? 'rgba(52,211,153,0.04)' : meta.accentBg,
        }}
      >
        {/* Top row: name + badges */}
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ background: isConceded ? '#fb7185' : isRebutted ? '#34d399' : meta.dotColor }} />
            <span className="text-sm font-semibold text-white">{meta.name}</span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide"
              style={{ color: meta.accentColor, background: `${meta.accentColor}14` }}>
              {meta.role}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {badge?.label && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{ color: badgeColors.color, background: badgeColors.bg, border: `1px solid ${badgeColors.border}` }}>
                {badge.prefix}: {badge.label}
              </span>
            )}
            <StatusBadge status={status} rebuttalResult={rebuttalResult} />
          </div>
        </div>
        {/* Description */}
        <p className="text-[11px] leading-relaxed" style={{ color: '#52525b' }}>
          {meta.description}
        </p>
      </div>

      {/* Content */}
      <div className="px-4 py-3 max-h-56 overflow-y-auto scrollbar-thin">
        {status === 'pending' ? (
          <p className="text-[#3f3f46] text-xs italic">Waiting to fire...</p>
        ) : (
          <div
            className={`agent-content text-xs leading-relaxed ${status === 'arguing' ? 'cursor-blink' : ''}`}
            style={{ color: isConceded ? '#fda4af' : isRebutted ? '#6ee7b7' : '#a1a1aa', whiteSpace: 'pre-wrap' }}
          >
            {content}
          </div>
        )}
      </div>
    </div>
  );
}
