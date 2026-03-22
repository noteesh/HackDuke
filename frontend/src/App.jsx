import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import AuthGate from './components/AuthGate.jsx';
import Dashboard from './components/Dashboard.jsx';
import DenialInput from './components/DenialInput.jsx';
import AgentCard from './components/AgentCard.jsx';
import AgentDebateGraph from './components/AgentDebateGraph.jsx';
import RebuttalCard from './components/RebuttalCard.jsx';
import OverrideFlash from './components/OverrideFlash.jsx';
import AppealLetter from './components/AppealLetter.jsx';
import ImpactPage from './components/ImpactPage.jsx';
import Footer from './components/Footer.jsx';

const CHALLENGER_IDS = ['bias_auditor', 'precedent_agent', 'circumstance_agent', 'legal_agent'];

const INITIAL_AGENTS = {
  denial_defender:    { status: 'pending', content: '', rebuttalResult: null },
  bias_auditor:       { status: 'pending', content: '', rebuttalResult: null },
  precedent_agent:    { status: 'pending', content: '', rebuttalResult: null },
  circumstance_agent: { status: 'pending', content: '', rebuttalResult: null },
  legal_agent:        { status: 'pending', content: '', rebuttalResult: null },
};

const INITIAL_REBUTTALS = {
  bias_auditor:       { status: 'pending', content: '', result: null },
  precedent_agent:    { status: 'pending', content: '', result: null },
  circumstance_agent: { status: 'pending', content: '', result: null },
  legal_agent:        { status: 'pending', content: '', result: null },
};

const TABS = [
  { id: 'extracted', label: 'Extracted'  },
  { id: 'arguments', label: 'Arguments'  },
  { id: 'diagram',   label: 'Diagram'    },
  { id: 'rebuttal',  label: 'Rebuttal'   },
  { id: 'appeal',    label: 'Appeal'     },
];

// ── Parsed Denial Panel ───────────────────────────────────────────────────────
function hasValue(v) {
  if (v === null || v === undefined || v === '') return false;
  if (Array.isArray(v)) return v.length > 0;
  return true;
}

function confidenceColor(c) {
  if (!c) return { color: '#52525b', bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.08)' };
  const u = c.toUpperCase();
  if (u === 'HIGH')   return { color: '#34d399', bg: 'rgba(52,211,153,0.10)', border: 'rgba(52,211,153,0.22)' };
  if (u === 'MEDIUM') return { color: '#fbbf24', bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.22)' };
  return             { color: '#fb7185', bg: 'rgba(244,63,94,0.10)',  border: 'rgba(244,63,94,0.22)'  };
}

function Field({ label, children }) {
  return (
    <div className="rounded-xl p-3" style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="text-[10px] text-[#52525b] uppercase tracking-wider mb-1.5">{label}</div>
      {children}
    </div>
  );
}

function ExtractedTab({ parsedDenial, denialText }) {
  if (!parsedDenial) {
    return (
      <div className="p-6 space-y-2 animate-pulse max-w-2xl mx-auto w-full">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="rounded-xl h-16" style={{ background: '#18181b' }} />
        ))}
      </div>
    );
  }

  const p = parsedDenial;
  const cc = confidenceColor(p.parsing_confidence);

  // boolean flags that are true
  const flags = [
    p.adverse_action_notice_present && 'Adverse action notice present',
    p.right_to_explanation_mentioned && 'Right to explanation mentioned',
    p.appeal_process_mentioned && 'Appeal process mentioned',
  ].filter(Boolean);

  // boolean flags that are false / missing
  const missingFlags = [
    p.adverse_action_notice_present === false && 'No adverse action notice',
    p.right_to_explanation_mentioned === false && 'Right to explanation NOT mentioned',
    p.appeal_process_mentioned === false && 'No appeal process described',
  ].filter(Boolean);

  // extra detail fields — only if they have actual values
  const detailFields = [
    { key: 'institution_type',   label: 'Institution type'   },
    { key: 'applicant_name',     label: 'Applicant name'     },
    { key: 'denial_date',        label: 'Denial date'        },
    { key: 'appeal_deadline',    label: 'Appeal deadline'    },
    { key: 'contact_info',       label: 'Contact info'       },
    { key: 'parsing_notes',      label: 'Parser notes'       },
  ].filter(({ key }) => hasValue(p[key]));

  const arrayFields = [
    { key: 'referenced_scores',    label: 'Referenced scores'    },
    { key: 'referenced_criteria',  label: 'Referenced criteria'  },
    { key: 'regulatory_references',label: 'Regulatory references'},
  ].filter(({ key }) => hasValue(p[key]));

  return (
    <div className="h-full overflow-y-auto scrollbar-thin p-6">
      <div className="max-w-2xl mx-auto space-y-5">

        {/* Header row: institution + type + confidence */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-lg font-bold text-white leading-tight">
              {p.institution_name || 'Unknown Institution'}
            </p>
            <p className="text-sm text-[#71717a] mt-0.5 capitalize">
              {[p.application_type, p.denial_type].filter(Boolean).join(' · ') || 'Denial letter'}
            </p>
          </div>
          {p.parsing_confidence && (
            <span
              className="text-xs font-semibold px-3 py-1 rounded-full flex-shrink-0"
              style={{ color: cc.color, background: cc.bg, border: `1px solid ${cc.border}` }}
            >
              {p.parsing_confidence} confidence
            </span>
          )}
        </div>

        {/* Why denied */}
        {hasValue(p.stated_reasons) && (
          <Field label="Why the denial was given">
            <ul className="space-y-1.5">
              {p.stated_reasons.map((r, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#fb7185' }} />
                  <span className="text-xs text-white font-medium leading-snug">{String(r)}</span>
                </li>
              ))}
            </ul>
          </Field>
        )}

        {/* Process flags */}
        {(flags.length > 0 || missingFlags.length > 0) && (
          <div>
            <p className="text-[10px] font-semibold text-[#52525b] uppercase tracking-widest mb-2">
              Procedural checks
            </p>
            <div className="flex flex-wrap gap-2">
              {flags.map(f => (
                <span key={f} className="text-[11px] font-medium px-2.5 py-1 rounded-lg"
                  style={{ background: 'rgba(52,211,153,0.08)', color: '#6ee7b7', border: '1px solid rgba(52,211,153,0.18)' }}>
                  ✓ {f}
                </span>
              ))}
              {missingFlags.map(f => (
                <span key={f} className="text-[11px] font-medium px-2.5 py-1 rounded-lg"
                  style={{ background: 'rgba(244,63,94,0.08)', color: '#fda4af', border: '1px solid rgba(244,63,94,0.18)' }}>
                  ✗ {f}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Referenced scores */}
        {hasValue(p.referenced_scores) && (
          <Field label="Credit scores referenced">
            <div className="flex flex-wrap gap-2">
              {p.referenced_scores.map((s, i) => {
                const label = typeof s === 'object'
                  ? `${s.score_type ?? 'Score'}: ${s.score_value ?? '—'}`
                  : String(s);
                return (
                  <span key={i} className="text-xs font-semibold px-2.5 py-1 rounded-lg"
                    style={{ background: 'rgba(99,102,241,0.12)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.22)' }}>
                    {label}
                  </span>
                );
              })}
            </div>
          </Field>
        )}

        {/* Detail fields grid — only non-null values */}
        {detailFields.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {detailFields.map(({ key, label }) => (
              <Field key={key} label={label}>
                <span className="text-xs text-white font-medium leading-snug">{String(p[key])}</span>
              </Field>
            ))}
          </div>
        )}

        {/* Array extras */}
        {arrayFields.map(({ key, label }) => (
          <Field key={key} label={label}>
            <ul className="space-y-1">
              {p[key].map((v, i) => (
                <li key={i} className="text-xs text-[#a1a1aa] leading-snug">
                  {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                </li>
              ))}
            </ul>
          </Field>
        ))}

        {/* Raw letter */}
        <div>
          <p className="text-[10px] font-semibold text-[#52525b] uppercase tracking-widest mb-2">
            Raw letter
          </p>
          <div className="rounded-xl p-4" style={{ background: '#111113', border: '1px solid rgba(255,255,255,0.05)' }}>
            <pre className="text-xs text-[#52525b] whitespace-pre-wrap font-sans leading-relaxed">
              {p.raw_text || denialText}
            </pre>
          </div>
        </div>

      </div>
    </div>
  );
}

// Pipeline step pill
function Step({ n, label, active }) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
        style={active
          ? { background: 'rgba(99,102,241,0.2)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.35)' }
          : { background: 'rgba(255,255,255,0.04)', color: '#3f3f46', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        {n}
      </div>
      <span className="text-[11px] font-medium" style={{ color: active ? '#a1a1aa' : '#3f3f46' }}>{label}</span>
    </div>
  );
}

// ── Arguments Panel ───────────────────────────────────────────────────────────
function ArgumentsTab({ agents, currentRound }) {
  const anyActive = Object.values(agents).some(a => a.status !== 'pending');
  const defendersActive = agents.denial_defender?.status !== 'pending';
  const challengersActive = CHALLENGER_IDS.some(id => agents[id]?.status !== 'pending');
  const inDebate = currentRound > 0 && challengersActive;

  return (
    <div className="h-full overflow-y-auto scrollbar-thin p-6">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Pipeline banner */}
        <div
          className="rounded-xl p-4"
          style={{ background: '#111113', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <p className="text-xs font-semibold text-white mb-1">How VerdictX works</p>
          <p className="text-[11px] text-[#52525b] leading-relaxed mb-3">
            Your denial letter is parsed, then attacked by 4 specialist AI agents simultaneously.
            The Denial Defender (representing the institution) builds its defense, then rebuts each challenge one by one.
            If the defense concedes 2 or more arguments, VerdictX fires and a formal appeal letter is generated.
          </p>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
            <Step n="1" label="Parse" active={anyActive} />
            <span className="text-[#3f3f46] text-xs">→</span>
            <Step n="2" label="4 agents attack" active={challengersActive} />
            <span className="text-[#3f3f46] text-xs">→</span>
            <Step n="3" label="Defender builds defense" active={defendersActive} />
            <span className="text-[#3f3f46] text-xs">→</span>
            <Step n="4" label="Up to 3 debate rounds" active={inDebate} />
            <span className="text-[#3f3f46] text-xs">→</span>
            <Step n="5" label="Judge decides" active={false} />
          </div>
        </div>

        {/* Denial Defender */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <p className="text-[10px] font-semibold text-[#52525b] uppercase tracking-widest">
              Institution's Position
            </p>
            <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.06)' }} />
            <p className="text-[10px] text-[#3f3f46]">argues the denial was valid</p>
          </div>
          <AgentCard agentId="denial_defender" state={agents.denial_defender} />
        </div>

        {/* VS divider */}
        <div className="flex items-center gap-3">
          <div className="h-px flex-1" style={{ background: 'rgba(245,158,11,0.15)' }} />
          <div
            className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest"
            style={{ background: 'rgba(245,158,11,0.07)', color: '#78716c', border: '1px solid rgba(245,158,11,0.15)' }}
          >
            challenged by 4 specialists
          </div>
          <div className="h-px flex-1" style={{ background: 'rgba(245,158,11,0.15)' }} />
        </div>

        {/* Challengers */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <p className="text-[10px] font-semibold text-[#52525b] uppercase tracking-widest">
              The Challenges
            </p>
            <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.06)' }} />
            <p className="text-[10px] text-[#3f3f46]">all fire simultaneously</p>
          </div>
          <div className="space-y-3">
            {CHALLENGER_IDS.map(id => (
              <AgentCard key={id} agentId={id} state={agents[id]} />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

// ── Rebuttal Panel ────────────────────────────────────────────────────────────
const AGENT_DISPLAY_NAMES = {
  bias_auditor:       'Bias Auditor',
  precedent_agent:    'Precedent Agent',
  circumstance_agent: 'Circumstance Agent',
  legal_agent:        'Legal Agent',
};

const AGENT_COLORS = {
  bias_auditor:       { dot: '#818cf8', bubble: 'rgba(99,102,241,0.08)',  bubbleBorder: 'rgba(99,102,241,0.18)',  label: '#6366f1' },
  precedent_agent:    { dot: '#fb923c', bubble: 'rgba(251,146,60,0.08)',  bubbleBorder: 'rgba(251,146,60,0.18)',  label: '#f97316' },
  circumstance_agent: { dot: '#a78bfa', bubble: 'rgba(167,139,250,0.08)', bubbleBorder: 'rgba(167,139,250,0.18)', label: '#8b5cf6' },
  legal_agent:        { dot: '#34d399', bubble: 'rgba(52,211,153,0.08)',  bubbleBorder: 'rgba(52,211,153,0.18)',  label: '#10b981' },
};

function DebateThread({ agentId, agentRounds, rebuttalRounds }) {
  const [expanded, setExpanded] = useState(false);
  const name = AGENT_DISPLAY_NAMES[agentId];
  const color = AGENT_COLORS[agentId];

  const rounds = rebuttalRounds.filter(r => r.activeAgents.includes(agentId));
  const latestRound = [...rounds].reverse().find(Boolean);
  const finalState = latestRound?.rebuttals[agentId];
  const finalVerdict = finalState?.result;
  const isLive = rounds.some(r => r.rebuttals[agentId]?.status === 'arguing');

  const firstAttack = agentRounds[1]?.[agentId] ?? '';
  const snippet = firstAttack.split('\n').find(l => l.trim()) ?? '';

  const borderColor = finalVerdict === 'CONCEDED'
    ? 'rgba(52,211,153,0.16)'
    : finalVerdict === 'REBUTTED'
    ? 'rgba(244,63,94,0.22)'
    : isLive ? 'rgba(99,102,241,0.2)'
    : 'rgba(255,255,255,0.07)';

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-200"
      style={{ background: '#0d0d0f', border: `1px solid ${borderColor}` }}
    >
      {/* ── Header row (always visible) ── */}
      <button onClick={() => setExpanded(e => !e)} className="w-full text-left">
        <div className="flex items-center gap-3 px-4 py-3.5">
          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color.dot }} />
          <span className="text-sm font-semibold text-white flex-1 min-w-0">{name}</span>

          {/* Round outcome pills */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {rounds.map(({ round, rebuttals: rr }) => {
              const v = rr[agentId]?.result;
              return (
                <span key={round} className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                  style={v === 'CONCEDED' ? { background: 'rgba(52,211,153,0.12)', color: '#34d399' }
                    : v === 'REBUTTED' ? { background: 'rgba(244,63,94,0.15)', color: '#fb7185' }
                    : { background: 'rgba(255,255,255,0.07)', color: '#52525b' }}>
                  R{round}
                </span>
              );
            })}
            {rounds.length === 0 && <span className="text-[10px] text-[#3f3f46]">pending</span>}
          </div>

          {/* Final verdict */}
          {finalVerdict ? (
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full flex-shrink-0"
              style={finalVerdict === 'CONCEDED'
                ? { background: 'rgba(52,211,153,0.10)', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)'}
                : { background: 'rgba(244,63,94,0.12)', color: '#fb7185', border: '1px solid rgba(244,63,94,0.25)' }}>
              {finalVerdict === 'CONCEDED' ? '✓ Conceded' : '✗ Rebutted'}
            </span>
          ) : isLive ? (
            <span className="flex items-center gap-1 text-[10px] text-[#818cf8] flex-shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              Live
            </span>
          ) : null}

          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="#52525b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            className="flex-shrink-0 transition-transform duration-200"
            style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>

        {/* One-line snippet when collapsed */}
        {!expanded && snippet && (
          <div className="px-4 pb-3 -mt-1">
            <p className="text-[11px] text-[#52525b] truncate">
              <span className="font-medium" style={{ color: color.label }}>{name}:</span>{' '}{snippet}
            </p>
          </div>
        )}
      </button>

      {/* ── Expanded: full chat thread with internal scroll ── */}
      {expanded && (
        <div className="border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="overflow-y-auto px-4 py-3 space-y-5 scrollbar-thin" style={{ maxHeight: 420 }}>
            {rounds.length === 0 ? (
              <p className="text-[11px] text-[#3f3f46] italic">Awaiting debate…</p>
            ) : rounds.map(({ round, rebuttals: roundRebuttals }) => {
              const attackContent = agentRounds[round]?.[agentId];
              const defState = roundRebuttals[agentId];
              const verdict = defState?.result;
              return (
                <div key={round} className="space-y-2.5">
                  {/* Round divider (only if multi-round) */}
                  {rounds.length > 1 && (
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded"
                        style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.25)' }}>
                        {round === 1 ? 'Round 1' : `Round ${round} — counter`}
                      </span>
                      <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.05)' }} />
                    </div>
                  )}

                  {/* Attacker bubble */}
                  {attackContent && (
                    <div className="flex">
                      <div className="max-w-[78%] rounded-2xl rounded-tl-sm px-4 py-3"
                        style={{ background: color.bubble, border: `1px solid ${color.bubbleBorder}` }}>
                        <div className="text-[9px] font-bold uppercase tracking-wider mb-1.5" style={{ color: color.label }}>{name}</div>
                        <p className="text-xs text-[#c4c4c8] leading-relaxed whitespace-pre-wrap">{attackContent}</p>
                      </div>
                    </div>
                  )}

                  {/* Defender bubble */}
                  {defState?.content ? (
                    <div className="flex justify-end">
                      <div className="max-w-[78%] rounded-2xl rounded-tr-sm px-4 py-3"
                        style={{
                          background: verdict === 'CONCEDED' ? 'rgba(244,63,94,0.07)' : verdict === 'REBUTTED' ? 'rgba(52,211,153,0.06)' : 'rgba(255,255,255,0.04)',
                          border: verdict === 'CONCEDED' ? '1px solid rgba(244,63,94,0.2)' : verdict === 'REBUTTED' ? '1px solid rgba(52,211,153,0.16)' : '1px solid rgba(255,255,255,0.07)',
                        }}>
                        <div className="flex items-center justify-between mb-1.5 gap-3">
                          <span className="text-[9px] font-bold text-[#52525b] uppercase tracking-wider">Defender</span>
                          {verdict && (
                            <span className="text-[9px] font-bold" style={{ color: verdict === 'CONCEDED' ? '#fb7185' : '#34d399' }}>
                              {verdict}
                            </span>
                          )}
                        </div>
                        <p className="text-xs leading-relaxed whitespace-pre-wrap"
                          style={{ color: verdict === 'CONCEDED' ? '#fda4af' : verdict === 'REBUTTED' ? '#6ee7b7' : '#a1a1aa' }}>
                          {defState.content}
                        </p>
                      </div>
                    </div>
                  ) : defState?.status === 'arguing' ? (
                    <div className="flex justify-end">
                      <div className="px-4 py-2.5 rounded-2xl rounded-tr-sm text-xs text-[#818cf8] flex items-center gap-1.5"
                        style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.15)' }}>
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                        Defender responding…
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Judge Panel ───────────────────────────────────────────────────────────────
const JUDGE_PROSE_KEYS = [
  'overall_assessment', 'reasoning', 'analysis', 'summary',
  'recommendation', 'key_finding', 'conclusion',
];
const JUDGE_LIST_KEYS = [
  'strongest_arguments', 'key_arguments', 'winning_arguments',
  'conceded_arguments', 'notable_points',
];

function JudgePanel({ judgeOutput }) {
  if (!judgeOutput) return null;

  // Collect prose fields
  const proseItems = JUDGE_PROSE_KEYS
    .filter(k => judgeOutput[k] && typeof judgeOutput[k] === 'string')
    .map(k => ({ key: k, text: judgeOutput[k] }));

  // Collect list fields (arrays of strings or objects with a text/argument field)
  const listItems = JUDGE_LIST_KEYS
    .filter(k => Array.isArray(judgeOutput[k]) && judgeOutput[k].length > 0)
    .map(k => ({
      key: k,
      label: k.replace(/_/g, ' '),
      items: judgeOutput[k].map(v =>
        typeof v === 'string' ? v : (v.argument ?? v.text ?? v.reason ?? JSON.stringify(v))
      ),
    }));

  if (proseItems.length === 0 && listItems.length === 0) return null;

  return (
    <div
      className="rounded-2xl p-4"
      style={{ background: '#111113', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)' }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
          </svg>
        </div>
        <p className="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider">Judge's Assessment</p>
      </div>

      {/* Prose fields */}
      {proseItems.map(({ key, text }) => (
        <p key={key} className="text-xs text-[#71717a] leading-relaxed mb-2">{text}</p>
      ))}

      {/* List fields */}
      {listItems.map(({ key, label, items }) => (
        <div key={key} className="mt-2">
          <p className="text-[10px] font-semibold text-[#52525b] uppercase tracking-wider mb-1.5 capitalize">
            {label}
          </p>
          <ul className="space-y-1">
            {items.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-[#71717a]">
                <span className="mt-1.5 w-1 h-1 rounded-full flex-shrink-0" style={{ background: '#fbbf24' }} />
                {item}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function RebuttalTab({ rebuttalRounds, rebuttals, agentRounds, overrideResult, phase }) {
  const isDone = phase === 'complete';
  const noOverride = isDone && overrideResult && !overrideResult.triggered;

  return (
    <div className="h-full overflow-y-auto scrollbar-thin px-6 py-5">
      <div className="max-w-3xl mx-auto space-y-2.5">
        {CHALLENGER_IDS.map(id => (
          <DebateThread
            key={id}
            agentId={id}
            agentRounds={agentRounds}
            rebuttalRounds={rebuttalRounds}
          />
        ))}

        {/* Judge's assessment — shown once override_result arrives */}
        {overrideResult?.judgeOutput && (
          <JudgePanel judgeOutput={overrideResult.judgeOutput} />
        )}

        {/* VerdictX Success — small confirmation, appeal tab handles the letter */}
        {overrideResult?.triggered && (
          <div
            className="rounded-xl p-4 animate-slide-up"
            style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.25)' }}
          >
            <div className="text-sm font-semibold text-[#34d399] mb-1">VerdictX Activated in Your Favor</div>
            <div className="text-xs text-[#71717a]">
              {overrideResult.concessions} of 4 challenges conceded. The institution's defense collapsed — see the Appeal tab for your letter.
            </div>
          </div>
        )}

        {/* No override — prominent explanation */}
        {noOverride && (
          <div
            className="rounded-2xl p-6 animate-slide-up text-center"
            style={{ background: '#111113', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            {/* Icon */}
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#52525b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>

            <p className="text-base font-semibold text-white mb-2">
              Not enough evidence to make a case
            </p>
            <p className="text-sm text-[#71717a] leading-relaxed mb-5 max-w-sm mx-auto">
              The Override requires at least 2 conceded arguments to generate a formal appeal.
              The institution's defense held on{' '}
              <span className="text-[#a1a1aa] font-medium">{4 - overrideResult.concessions} of 4</span> challenges
              — not enough to override.
            </p>

            {/* What was conceded vs held */}
            <div className="grid grid-cols-2 gap-2 text-left mb-5">
              <div className="rounded-xl p-3" style={{ background: 'rgba(52,211,153,0.05)', border: '1px solid rgba(52,211,153,0.15)' }}>
                <p className="text-[10px] font-semibold text-[#34d399] uppercase tracking-wider mb-2">Defense held</p>
                {CHALLENGER_IDS.filter(id => rebuttals[id]?.result !== 'CONCEDED').map(id => (
                  <p key={id} className="text-xs text-[#6ee7b7] mb-0.5">✓ {AGENT_DISPLAY_NAMES[id]}</p>
                ))}
                {CHALLENGER_IDS.filter(id => rebuttals[id]?.result !== 'CONCEDED').length === 0 && (
                  <p className="text-xs text-[#52525b] italic">None</p>
                )}
              </div>
              <div className="rounded-xl p-3" style={{ background: 'rgba(244,63,94,0.05)', border: '1px solid rgba(244,63,94,0.12)' }}>
                <p className="text-[10px] font-semibold text-[#fb7185] uppercase tracking-wider mb-2">Conceded</p>
                {CHALLENGER_IDS.filter(id => rebuttals[id]?.result === 'CONCEDED').map(id => (
                  <p key={id} className="text-xs text-[#fda4af] mb-0.5">✗ {AGENT_DISPLAY_NAMES[id]}</p>
                ))}
                {overrideResult.concessions === 0 && (
                  <p className="text-xs text-[#52525b] italic">None</p>
                )}
              </div>
            </div>

            <p className="text-xs text-[#3f3f46] leading-relaxed">
              This does not mean the denial was necessarily fair — only that the arguments found
              were not strong enough to meet the threshold. Consider consulting a legal professional
              or submitting a manual dispute directly with the institution.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const { user, logout } = useAuth0();
  const [phase, setPhase]             = useState('dashboard');
  const [activeTab, setActiveTab]     = useState('extracted');
  const [denialText, setDenialText]   = useState('');
  const [parsedDenial, setParsedDenial]   = useState(null);
  const [agents, setAgents]               = useState(INITIAL_AGENTS);
  const [rebuttals, setRebuttals]         = useState(INITIAL_REBUTTALS);
  const [overrideResult, setOverrideResult] = useState(null);
  const [appealLetter, setAppealLetter]   = useState('');
  const [appealStreaming, setAppealStreaming] = useState(false);
  const [showFlash, setShowFlash]         = useState(false);
  const [concessionCount, setConcessionCount] = useState(0);
  const [currentRound, setCurrentRound] = useState(1);
  // [{round, activeAgents, rebuttals:{agentId:{status,content,result}}}]
  const [rebuttalRounds, setRebuttalRounds] = useState([]);
  // {[round]: {[agentId]: content}} — attacker text captured per round
  const [agentRounds, setAgentRounds] = useState({});
  const agentContentAccumulator = useRef({});

  // Refs to capture final state for MongoDB save (avoids stale closure in async loop)
  const finalState = useRef({});

  // Auto-advance tabs as pipeline progresses
  useEffect(() => {
    const anyArguing = Object.values(agents).some(a => a.status === 'arguing' || a.status === 'done');
    if (anyArguing && activeTab === 'extracted') setActiveTab('arguments');
  }, [agents]);

  useEffect(() => {
    const anyRebutting = Object.values(rebuttals).some(r => r.status !== 'pending');
    if (anyRebutting && (activeTab === 'arguments' || activeTab === 'diagram')) setActiveTab('rebuttal');
  }, [rebuttals]);

  const appealTabOpened = useRef(false);
  useEffect(() => {
    if (appealLetter && !appealTabOpened.current) {
      appealTabOpened.current = true;
      setActiveTab('appeal');
    }
  }, [appealLetter]);

  const handleEvent = useCallback((type, data) => {
    switch (type) {
      case 'parsed':
        setParsedDenial(data);
        finalState.current.parsedDenial = data;
        break;

      case 'agent_start':
        setAgents(prev => {
          const next = { ...prev, [data.agentId]: { ...prev[data.agentId], status: 'arguing' } };
          finalState.current.agents = next;
          return next;
        });
        break;

      case 'agent_chunk':
        setAgents(prev => {
          const next = {
            ...prev,
            [data.agentId]: {
              ...prev[data.agentId],
              content: (prev[data.agentId]?.content ?? '') + data.chunk,
            },
          };
          finalState.current.agents = next;
          return next;
        });
        // Accumulate challenger content so we can show it in debate threads
        if (CHALLENGER_IDS.includes(data.agentId)) {
          agentContentAccumulator.current[data.agentId] =
            (agentContentAccumulator.current[data.agentId] ?? '') + data.chunk;
        }
        break;

      case 'agent_complete':
        setAgents(prev => {
          const next = {
            ...prev,
            [data.agentId]: { ...prev[data.agentId], status: 'done', data: data.data ?? null },
          };
          finalState.current.agents = next;
          return next;
        });
        break;

      case 'round_start': {
        const { round, activeAgents } = data;
        setCurrentRound(round);
        // Round 1: attacker content was accumulated BEFORE this event fires — save it now
        if (round === 1) {
          const captured = { ...agentContentAccumulator.current };
          setAgentRounds(prev => {
            const next = { ...prev, 1: captured };
            finalState.current.agentRounds = next;
            return next;
          });
          agentContentAccumulator.current = {};
        }
        setRebuttalRounds(prev => {
          const next = [...prev, {
            round,
            activeAgents,
            rebuttals: Object.fromEntries(activeAgents.map(id => [id, { status: 'pending', content: '', result: null }])),
          }];
          finalState.current.rebuttalRounds = next;
          return next;
        });
        // Reset agent content for counter-attacks in rounds 2+
        if (round > 1) {
          agentContentAccumulator.current = {};
          setAgents(prev => {
            const next = { ...prev };
            for (const id of activeAgents) {
              next[id] = { ...next[id], status: 'pending', content: '' };
            }
            finalState.current.agents = next;
            return next;
          });
        }
        break;
      }

      case 'rebuttal_start':
        // Round 2+: counter-attack content is fully accumulated by now — save it
        if (data.round > 1) {
          const captured = { ...agentContentAccumulator.current };
          setAgentRounds(prev => {
            const next = { ...prev, [data.round]: captured };
            finalState.current.agentRounds = next;
            return next;
          });
          agentContentAccumulator.current = {};
        }
        break;

      case 'round_end':
        // informational; state already updated via rebuttal_result events
        break;

      case 'rebuttal_section_start':
        setRebuttals(prev => {
          const next = { ...prev, [data.agentId]: { ...prev[data.agentId], status: 'arguing' } };
          finalState.current.rebuttals = next;
          return next;
        });
        setRebuttalRounds(prev => {
          const next = prev.map(r =>
            r.round === data.round
              ? { ...r, rebuttals: { ...r.rebuttals, [data.agentId]: { status: 'arguing', content: '', result: null } } }
              : r
          );
          finalState.current.rebuttalRounds = next;
          return next;
        });
        break;

      case 'rebuttal_chunk':
        setRebuttals(prev => {
          const next = {
            ...prev,
            [data.agentId]: {
              ...prev[data.agentId],
              content: (prev[data.agentId]?.content ?? '') + data.chunk,
            },
          };
          finalState.current.rebuttals = next;
          return next;
        });
        setRebuttalRounds(prev => {
          const next = prev.map(r =>
            r.round === data.round
              ? { ...r, rebuttals: { ...r.rebuttals, [data.agentId]: { ...r.rebuttals[data.agentId], content: (r.rebuttals[data.agentId]?.content ?? '') + data.chunk } } }
              : r
          );
          finalState.current.rebuttalRounds = next;
          return next;
        });
        break;

      case 'rebuttal_result': {
        const res = data.result;
        setRebuttals(prev => {
          const next = {
            ...prev,
            [data.agentId]: { ...prev[data.agentId], status: res === 'CONCEDED' ? 'conceded' : 'rebutted', result: res },
          };
          finalState.current.rebuttals = next;
          return next;
        });
        setRebuttalRounds(prev => {
          const next = prev.map(r =>
            r.round === data.round
              ? { ...r, rebuttals: { ...r.rebuttals, [data.agentId]: { ...r.rebuttals[data.agentId], status: res === 'CONCEDED' ? 'conceded' : 'rebutted', result: res } } }
              : r
          );
          finalState.current.rebuttalRounds = next;
          return next;
        });
        setAgents(prev => {
          const next = {
            ...prev,
            [data.agentId]: { ...prev[data.agentId], rebuttalResult: res },
          };
          finalState.current.agents = next;
          return next;
        });
        if (res === 'CONCEDED') setConcessionCount(n => n + 1);
        break;
      }

      case 'override_result':
        setOverrideResult(data);
        finalState.current.overrideTriggered = data.triggered;
        finalState.current.concessionCount   = data.concessions;
        finalState.current.concededAgents    = data.concededAgents ?? [];
        if (data.triggered) {
          setShowFlash(true);
          setAppealStreaming(true);
          setTimeout(() => setShowFlash(false), 3200);
        }
        break;

      case 'appeal_chunk':
        setAppealLetter(prev => {
          const next = prev + data.chunk;
          finalState.current.appealLetter = next;
          return next;
        });
        break;

      case 'complete':
        setPhase('complete');
        setAppealStreaming(false);
        break;

      default:
        break;
    }
  }, []);

  const startAnalysis = async () => {
    setPhase('processing');
    setActiveTab('extracted');
    setAgents(INITIAL_AGENTS);
    setRebuttals(INITIAL_REBUTTALS);
    setOverrideResult(null);
    setAppealLetter('');
    setAppealStreaming(false);
    setConcessionCount(0);
    setParsedDenial(null);
    setShowFlash(false);
    setCurrentRound(1);
    setRebuttalRounds([]);
    setAgentRounds({});
    agentContentAccumulator.current = {};
    appealTabOpened.current = false;
    finalState.current = {};

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ denialText }),
      });

      if (!response.ok) throw new Error(`Server error: ${response.status}`);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop();

        for (const part of parts) {
          if (!part.trim()) continue;
          let eventType = 'message';
          let dataStr = '';
          for (const line of part.split('\n')) {
            if (line.startsWith('event: ')) eventType = line.slice(7).trim();
            else if (line.startsWith('data: ')) dataStr = line.slice(6);
          }
          if (dataStr) {
            try { handleEvent(eventType, JSON.parse(dataStr)); } catch { /* skip */ }
          }
        }
      }

      // Save completed case to MongoDB
      if (user?.sub && finalState.current.parsedDenial) {
        fetch('/api/cases', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId:            user.sub,
            denialText,
            parsedDenial:      finalState.current.parsedDenial      ?? null,
            agents:            finalState.current.agents             ?? null,
            rebuttals:         finalState.current.rebuttals          ?? null,
            rebuttalRounds:    finalState.current.rebuttalRounds     ?? [],
            agentRounds:       finalState.current.agentRounds        ?? {},
            overrideTriggered: finalState.current.overrideTriggered  ?? false,
            concessionCount:   finalState.current.concessionCount    ?? 0,
            concededAgents:    finalState.current.concededAgents     ?? [],
            appealLetter:      finalState.current.appealLetter       ?? '',
          }),
        }).catch(err => console.warn('[cases] Save failed:', err));
      }
    } catch (err) {
      console.error('Analysis error:', err);
      setPhase('input');
    }
  };

  if (phase === 'impact') {
    return <ImpactPage onBack={() => setPhase('dashboard')} />;
  }

  if (phase === 'dashboard') {
    return (
      <AuthGate onShowImpact={() => setPhase('impact')}>
        <Dashboard
          onNewCase={() => setPhase('input')}
          onOpenCase={async (caseId) => {
            // Fetch full case and load it into the analysis view (read-only replay)
            try {
              const r = await fetch(`/api/cases?userId=${encodeURIComponent(user.sub)}&caseId=${caseId}`);
              const c = await r.json();
              if (!c || c.error) return;
              // Restore state from saved case
              setDenialText(c.denialText ?? '');
              setParsedDenial(c.parsedDenial ?? null);
              if (c.agents) setAgents(c.agents);
              if (c.rebuttals) setRebuttals(c.rebuttals);
              if (c.rebuttalRounds) setRebuttalRounds(c.rebuttalRounds);
              if (c.agentRounds) setAgentRounds(c.agentRounds);
              setOverrideResult(c.overrideTriggered != null ? {
                triggered: c.overrideTriggered,
                concessions: c.concessionCount ?? 0,
                concededAgents: c.concededAgents ?? [],
              } : null);
              setConcessionCount(c.concessionCount ?? 0);
              setAppealLetter(c.appealLetter ?? '');
              setAppealStreaming(false);
              appealTabOpened.current = !!c.appealLetter;
              setActiveTab('extracted');
              setPhase('complete');
            } catch (err) {
              console.error('[openCase]', err);
            }
          }}
          onShowImpact={() => setPhase('impact')}
        />
      </AuthGate>
    );
  }

  if (phase === 'input') {
    return (
      <AuthGate onShowImpact={() => setPhase('impact')}>
        <DenialInput
          denialText={denialText}
          onTextChange={setDenialText}
          onSubmit={startAnalysis}
          onShowImpact={() => setPhase('impact')}
        />
      </AuthGate>
    );
  }

  const isProcessing = phase === 'processing';
  const hasAppeal = !!appealLetter;

  return (
    <AuthGate>
      <div className="h-screen flex flex-col overflow-hidden" style={{ background: '#0a0a0b', color: '#f4f4f5' }}>
        {/* {showFlash && <OverrideFlash />} */}

        {/* ── Top bar ── */}
        <div
          className="flex-shrink-0 px-5 h-12 flex items-center justify-between z-10"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(10,10,11,0.95)', backdropFilter: 'blur(8px)' }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPhase('dashboard')}
              className="flex items-center justify-center w-7 h-7 rounded-lg transition-colors text-[#52525b] hover:text-[#a1a1aa]"
              style={{ background: 'rgba(255,255,255,0.05)' }}
              title="Back to dashboard"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 5l-7 7 7 7" />
              </svg>
            </button>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.15)' }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-white">VerdictX</span>
              <span className="text-[#3f3f46] text-xs hidden sm:block">/ adversarial review</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {isProcessing && !overrideResult && (
              <div className="flex items-center gap-1.5 text-xs text-[#818cf8]">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                <span className="hidden sm:block font-medium">
                  {Object.values(rebuttals).some(r => r.status !== 'pending')
                    ? `Round ${currentRound} — Defender rebutting`
                    : currentRound > 1
                    ? `Round ${currentRound} — Counter-attack`
                    : 'Agents arguing'}
                </span>
              </div>
            )}

            <div
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all duration-300"
              style={
                concessionCount >= 2
                  ? { background: 'rgba(244,63,94,0.12)', color: '#fb7185', border: '1px solid rgba(244,63,94,0.25)' }
                  : concessionCount === 1
                  ? { background: 'rgba(245,158,11,0.10)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.22)' }
                  : { background: 'rgba(255,255,255,0.05)', color: '#52525b', border: '1px solid rgba(255,255,255,0.07)' }
              }
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: concessionCount >= 2 ? '#fb7185' : concessionCount === 1 ? '#fbbf24' : '#3f3f46' }} />
              {concessionCount}/4 conceded
            </div>

            {overrideResult?.triggered && (
              <div
                className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold animate-pulse-fast"
                style={{ background: 'rgba(244,63,94,0.15)', color: '#fb7185', border: '1px solid rgba(244,63,94,0.3)' }}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
                VerdictX Active
              </div>
            )}
            {overrideResult && !overrideResult.triggered && phase === 'complete' && (
              <div className="px-3 py-1 rounded-full text-xs font-medium" style={{ background: 'rgba(255,255,255,0.05)', color: '#52525b', border: '1px solid rgba(255,255,255,0.07)' }}>
                No VerdictX
              </div>
            )}

            {user && (
              <div className="hidden sm:flex items-center gap-2 pl-2.5" style={{ borderLeft: '1px solid rgba(255,255,255,0.07)' }}>
                <span className="text-xs text-[#52525b]">{user.name}</span>
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

        {/* ── Tab bar ── */}
        <div
          className="flex-shrink-0 flex items-center gap-1 px-5 h-10"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', background: '#0d0d0f' }}
        >
          {TABS.map(tab => {
            // Hide appeal tab until there's content
            if (tab.id === 'appeal' && !hasAppeal) return null;

            const isActive = activeTab === tab.id;

            // Dot indicators
            const hasDot =
              (tab.id === 'arguments' && Object.values(agents).some(a => a.status !== 'pending')) ||
              (tab.id === 'rebuttal'  && Object.values(rebuttals).some(r => r.status !== 'pending')) ||
              (tab.id === 'appeal'    && hasAppeal);

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="relative flex items-center gap-1.5 px-3.5 py-1 rounded-lg text-xs font-medium transition-all"
                style={
                  isActive
                    ? { background: 'rgba(99,102,241,0.12)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.22)' }
                    : { color: '#52525b', border: '1px solid transparent' }
                }
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = '#a1a1aa'; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = '#52525b'; }}
              >
                {tab.label}
                {hasDot && !isActive && (
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{
                      background: tab.id === 'appeal' ? '#fb7185'
                        : tab.id === 'rebuttal' && Object.values(rebuttals).some(r => r.result === 'CONCEDED') ? '#fb7185'
                        : '#818cf8',
                    }}
                  />
                )}
                {tab.id === 'appeal' && appealStreaming && (
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                )}
              </button>
            );
          })}
        </div>

        {/* ── Tab content ── */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {activeTab === 'extracted' && (
            <ExtractedTab parsedDenial={parsedDenial} denialText={denialText} />
          )}
          {activeTab === 'arguments' && (
            <ArgumentsTab agents={agents} currentRound={currentRound} />
          )}
          {activeTab === 'diagram' && (
            <div className="h-full p-4">
              <AgentDebateGraph agents={agents} />
            </div>
          )}
          {activeTab === 'rebuttal' && (
            <RebuttalTab
              rebuttalRounds={rebuttalRounds}
              rebuttals={rebuttals}
              agentRounds={agentRounds}
              overrideResult={overrideResult}
              phase={phase}
            />
          )}
          {activeTab === 'appeal' && hasAppeal && (
            <div className="h-full overflow-y-auto scrollbar-thin">
              <AppealLetter 
                text={appealLetter} 
                streaming={appealStreaming}
                parsedDenial={parsedDenial}
                agents={agents}
                rebuttals={rebuttals}
                overrideResult={overrideResult}
              />
            </div>
          )}
        </div>
        <Footer onShowImpact={() => setPhase('impact')} />
      </div>
    </AuthGate>
  );
}
