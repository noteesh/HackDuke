import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import AuthGate from './components/AuthGate.jsx';
import DenialInput from './components/DenialInput.jsx';
import AgentCard from './components/AgentCard.jsx';
import AgentDebateGraph from './components/AgentDebateGraph.jsx';
import RebuttalCard from './components/RebuttalCard.jsx';
import OverrideFlash from './components/OverrideFlash.jsx';
import AppealLetter from './components/AppealLetter.jsx';

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
function ExtractedTab({ parsedDenial, denialText }) {
  if (!parsedDenial) {
    return (
      <div className="p-6 space-y-2 animate-pulse max-w-2xl mx-auto w-full">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="rounded-xl h-14" style={{ background: '#18181b' }} />
        ))}
      </div>
    );
  }

  // Fields to highlight at the top
  const PRIORITY = ['denial_type', 'institution_name', 'application_type', 'denial_date',
    'stated_reasons', 'parsing_confidence', 'adverse_action_notice_present'];

  const entries = Object.entries(parsedDenial).filter(([k]) => k !== 'raw_text');
  const priorityEntries = PRIORITY.map(k => [k, parsedDenial[k]]).filter(([, v]) => v !== undefined);
  const restEntries = entries.filter(([k]) => !PRIORITY.includes(k));

  const renderVal = (val) => {
    if (Array.isArray(val)) {
      return val.length === 0 ? '—' : (
        <ul className="space-y-0.5 mt-0.5">
          {val.map((v, i) => (
            <li key={i} className="text-xs text-white font-medium leading-snug">
              {typeof v === 'object' ? JSON.stringify(v) : String(v)}
            </li>
          ))}
        </ul>
      );
    }
    if (typeof val === 'boolean') return val ? 'Yes' : 'No';
    if (val === null || val === undefined || val === '') return '—';
    return <span className="text-xs text-white font-medium leading-snug break-words">{String(val)}</span>;
  };

  return (
    <div className="h-full overflow-y-auto scrollbar-thin p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Key fields */}
        <div>
          <p className="text-[10px] font-semibold text-[#52525b] uppercase tracking-widest mb-3">
            Key Fields
          </p>
          <div className="grid grid-cols-2 gap-2">
            {priorityEntries.map(([key, val]) => (
              <div
                key={key}
                className="rounded-xl p-3"
                style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div className="text-[10px] text-[#52525b] capitalize mb-1">
                  {key.replace(/_/g, ' ')}
                </div>
                {renderVal(val)}
              </div>
            ))}
          </div>
        </div>

        {/* Remaining fields */}
        {restEntries.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-[#52525b] uppercase tracking-widest mb-3">
              Additional Details
            </p>
            <div className="grid grid-cols-2 gap-2">
              {restEntries.map(([key, val]) => (
                <div
                  key={key}
                  className="rounded-xl p-3"
                  style={{ background: '#111113', border: '1px solid rgba(255,255,255,0.05)' }}
                >
                  <div className="text-[10px] text-[#52525b] capitalize mb-1">
                    {key.replace(/_/g, ' ')}
                  </div>
                  {renderVal(val)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Raw text */}
        <div>
          <p className="text-[10px] font-semibold text-[#52525b] uppercase tracking-widest mb-3">
            Raw Letter
          </p>
          <div
            className="rounded-xl p-4"
            style={{ background: '#111113', border: '1px solid rgba(255,255,255,0.05)' }}
          >
            <pre className="text-xs text-[#71717a] whitespace-pre-wrap font-sans leading-relaxed">
              {parsedDenial.raw_text || denialText}
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
function ArgumentsTab({ agents }) {
  const anyActive = Object.values(agents).some(a => a.status !== 'pending');
  const defendersActive = agents.denial_defender?.status !== 'pending';
  const challengersActive = CHALLENGER_IDS.some(id => agents[id]?.status !== 'pending');

  return (
    <div className="h-full overflow-y-auto scrollbar-thin p-6">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Pipeline banner */}
        <div
          className="rounded-xl p-4"
          style={{ background: '#111113', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <p className="text-xs font-semibold text-white mb-1">How The Override works</p>
          <p className="text-[11px] text-[#52525b] leading-relaxed mb-3">
            Your denial letter is parsed, then attacked by 4 specialist AI agents simultaneously.
            The Denial Defender (representing the institution) builds its defense, then rebuts each challenge one by one.
            If the defense concedes 2 or more arguments, the Override fires and a formal appeal letter is generated.
          </p>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
            <Step n="1" label="Parse" active={anyActive} />
            <span className="text-[#3f3f46] text-xs">→</span>
            <Step n="2" label="4 agents attack in parallel" active={challengersActive} />
            <span className="text-[#3f3f46] text-xs">→</span>
            <Step n="3" label="Defender builds defense" active={defendersActive} />
            <span className="text-[#3f3f46] text-xs">→</span>
            <Step n="4" label="Defender rebuts each" active={false} />
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
function RebuttalTab({ rebuttals, overrideResult, concessionCount, phase, appealLetter, appealStreaming }) {
  return (
    <div className="h-full overflow-y-auto scrollbar-thin p-6">
      <div className="max-w-2xl mx-auto space-y-4">
        {CHALLENGER_IDS.map(id => (
          <RebuttalCard key={id} agentId={id} state={rebuttals[id]} />
        ))}

        {/* Verdict */}
        {overrideResult && (
          <div
            className="rounded-xl p-5 animate-slide-up"
            style={
              overrideResult.triggered
                ? { background: 'rgba(244,63,94,0.07)', border: '1px solid rgba(244,63,94,0.25)' }
                : { background: '#18181b', border: '1px solid rgba(255,255,255,0.07)' }
            }
          >
            <div
              className="text-sm font-semibold mb-1"
              style={{ color: overrideResult.triggered ? '#fb7185' : '#71717a' }}
            >
              {overrideResult.triggered ? 'Override Fired' : 'Override Not Triggered'}
            </div>
            <div className="text-xs leading-relaxed" style={{ color: '#52525b' }}>
              {overrideResult.concessions} of 4 challenges conceded.{' '}
              {overrideResult.triggered
                ? 'Defense collapsed — appeal letter generated.'
                : `Need 2 to trigger. Defense held ${4 - overrideResult.concessions}/4.`}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const { user, logout } = useAuth0();
  const [phase, setPhase]             = useState('input');
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
        break;

      case 'agent_start':
        setAgents(prev => ({ ...prev, [data.agentId]: { ...prev[data.agentId], status: 'arguing' } }));
        break;

      case 'agent_chunk':
        setAgents(prev => ({
          ...prev,
          [data.agentId]: {
            ...prev[data.agentId],
            content: (prev[data.agentId]?.content ?? '') + data.chunk,
          },
        }));
        break;

      case 'agent_complete':
        setAgents(prev => ({
          ...prev,
          [data.agentId]: { ...prev[data.agentId], status: 'done', data: data.data ?? null },
        }));
        break;

      case 'rebuttal_section_start':
        setRebuttals(prev => ({ ...prev, [data.agentId]: { ...prev[data.agentId], status: 'arguing' } }));
        break;

      case 'rebuttal_chunk':
        setRebuttals(prev => ({
          ...prev,
          [data.agentId]: {
            ...prev[data.agentId],
            content: (prev[data.agentId]?.content ?? '') + data.chunk,
          },
        }));
        break;

      case 'rebuttal_result': {
        const res = data.result;
        setRebuttals(prev => ({
          ...prev,
          [data.agentId]: { ...prev[data.agentId], status: res === 'CONCEDED' ? 'conceded' : 'rebutted', result: res },
        }));
        setAgents(prev => ({
          ...prev,
          [data.agentId]: { ...prev[data.agentId], rebuttalResult: res },
        }));
        if (res === 'CONCEDED') setConcessionCount(n => n + 1);
        break;
      }

      case 'override_result':
        setOverrideResult(data);
        if (data.triggered) {
          setShowFlash(true);
          setAppealStreaming(true);
          setTimeout(() => setShowFlash(false), 3200);
        }
        break;

      case 'appeal_chunk':
        setAppealLetter(prev => prev + data.chunk);
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
    appealTabOpened.current = false;

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
    } catch (err) {
      console.error('Analysis error:', err);
      setPhase('input');
    }
  };

  if (phase === 'input') {
    return (
      <AuthGate>
        <DenialInput denialText={denialText} onTextChange={setDenialText} onSubmit={startAnalysis} />
      </AuthGate>
    );
  }

  const isProcessing = phase === 'processing';
  const hasAppeal = !!appealLetter;

  return (
    <AuthGate>
      <div className="h-screen flex flex-col overflow-hidden" style={{ background: '#0a0a0b', color: '#f4f4f5' }}>
        {showFlash && <OverrideFlash />}

        {/* ── Top bar ── */}
        <div
          className="flex-shrink-0 px-5 h-12 flex items-center justify-between z-10"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(10,10,11,0.95)', backdropFilter: 'blur(8px)' }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPhase('input')}
              className="flex items-center justify-center w-7 h-7 rounded-lg transition-colors text-[#52525b] hover:text-[#a1a1aa]"
              style={{ background: 'rgba(255,255,255,0.05)' }}
              title="Back"
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
              <span className="text-sm font-semibold text-white">The Override</span>
              <span className="text-[#3f3f46] text-xs hidden sm:block">/ adversarial review</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {isProcessing && !overrideResult && (
              <div className="flex items-center gap-1.5 text-xs text-[#818cf8]">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                <span className="hidden sm:block font-medium">
                  {Object.values(rebuttals).some(r => r.status !== 'pending') ? 'Defender rebutting' : 'Agents arguing'}
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
                Override Active
              </div>
            )}
            {overrideResult && !overrideResult.triggered && phase === 'complete' && (
              <div className="px-3 py-1 rounded-full text-xs font-medium" style={{ background: 'rgba(255,255,255,0.05)', color: '#52525b', border: '1px solid rgba(255,255,255,0.07)' }}>
                No override
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
            <ArgumentsTab agents={agents} />
          )}
          {activeTab === 'diagram' && (
            <div className="h-full p-4">
              <AgentDebateGraph agents={agents} />
            </div>
          )}
          {activeTab === 'rebuttal' && (
            <RebuttalTab
              rebuttals={rebuttals}
              overrideResult={overrideResult}
              concessionCount={concessionCount}
              phase={phase}
              appealLetter={appealLetter}
              appealStreaming={appealStreaming}
            />
          )}
          {activeTab === 'appeal' && hasAppeal && (
            <div className="h-full overflow-y-auto scrollbar-thin">
              <AppealLetter text={appealLetter} streaming={appealStreaming} />
            </div>
          )}
        </div>
      </div>
    </AuthGate>
  );
}
