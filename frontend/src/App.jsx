import { useState, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import AuthGate from './components/AuthGate.jsx';
import DenialInput from './components/DenialInput.jsx';
import AgentDebateGraph from './components/AgentDebateGraph.jsx';
import RebuttalCard from './components/RebuttalCard.jsx';
import OverrideFlash from './components/OverrideFlash.jsx';
import AppealLetter from './components/AppealLetter.jsx';

const SAMPLE_DENIAL = `Dear Applicant,

We regret to inform you that your application for a personal loan of $5,000 has been denied. This decision was based on our automated review system.

Primary reason: Insufficient credit history.
Secondary reason: Debt-to-income ratio.

You have the right to request the specific reasons within 60 days.

- AutoLend Financial`;

const CHALLENGER_IDS = ['bias_auditor', 'precedent_agent', 'circumstance_agent', 'legal_agent'];

const INITIAL_AGENTS = {
  denial_defender: { status: 'pending', content: '', rebuttalResult: null },
  bias_auditor: { status: 'pending', content: '', rebuttalResult: null },
  precedent_agent: { status: 'pending', content: '', rebuttalResult: null },
  circumstance_agent: { status: 'pending', content: '', rebuttalResult: null },
  legal_agent: { status: 'pending', content: '', rebuttalResult: null },
};

const INITIAL_REBUTTALS = {
  bias_auditor: { status: 'pending', content: '', result: null },
  precedent_agent: { status: 'pending', content: '', result: null },
  circumstance_agent: { status: 'pending', content: '', result: null },
  legal_agent: { status: 'pending', content: '', result: null },
};

export default function App() {
  const { user, logout } = useAuth0();
  const [phase, setPhase] = useState('input'); // input | processing | complete
  const [denialText, setDenialText] = useState(SAMPLE_DENIAL);
  const [parsedDenial, setParsedDenial] = useState(null);
  const [agents, setAgents] = useState(INITIAL_AGENTS);
  const [rebuttals, setRebuttals] = useState(INITIAL_REBUTTALS);
  const [overrideResult, setOverrideResult] = useState(null);
  const [appealLetter, setAppealLetter] = useState('');
  const [appealStreaming, setAppealStreaming] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  const [concessionCount, setConcessionCount] = useState(0);

  const handleEvent = useCallback((type, data) => {
    switch (type) {
      case 'parsed':
        setParsedDenial(data);
        break;

      case 'agent_start':
        setAgents((prev) => ({
          ...prev,
          [data.agentId]: { ...prev[data.agentId], status: 'arguing' },
        }));
        break;

      case 'agent_chunk':
        setAgents((prev) => ({
          ...prev,
          [data.agentId]: {
            ...prev[data.agentId],
            content: (prev[data.agentId]?.content ?? '') + data.chunk,
          },
        }));
        break;

      case 'agent_complete':
        setAgents((prev) => ({
          ...prev,
          [data.agentId]: { ...prev[data.agentId], status: 'done' },
        }));
        break;

      case 'rebuttal_section_start':
        setRebuttals((prev) => ({
          ...prev,
          [data.agentId]: { ...prev[data.agentId], status: 'arguing' },
        }));
        break;

      case 'rebuttal_chunk':
        setRebuttals((prev) => ({
          ...prev,
          [data.agentId]: {
            ...prev[data.agentId],
            content: (prev[data.agentId]?.content ?? '') + data.chunk,
          },
        }));
        break;

      case 'rebuttal_result': {
        const res = data.result;
        setRebuttals((prev) => ({
          ...prev,
          [data.agentId]: { ...prev[data.agentId], status: res === 'CONCEDED' ? 'conceded' : 'rebutted', result: res },
        }));
        setAgents((prev) => ({
          ...prev,
          [data.agentId]: { ...prev[data.agentId], rebuttalResult: res },
        }));
        if (res === 'CONCEDED') {
          setConcessionCount((n) => n + 1);
        }
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
        setAppealLetter((prev) => prev + data.chunk);
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
    // Reset state
    setPhase('processing');
    setAgents(INITIAL_AGENTS);
    setRebuttals(INITIAL_REBUTTALS);
    setOverrideResult(null);
    setAppealLetter('');
    setAppealStreaming(false);
    setConcessionCount(0);
    setParsedDenial(null);
    setShowFlash(false);

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
            try {
              handleEvent(eventType, JSON.parse(dataStr));
            } catch {
              // skip malformed
            }
          }
        }
      }
    } catch (err) {
      console.error('Analysis error:', err);
      setPhase('input');
    }
  };

  // ── Input phase ───────────────────────────────────────────────────────────────
  if (phase === 'input') {
    return (
      <AuthGate>
        <DenialInput
          denialText={denialText}
          onTextChange={setDenialText}
          onSubmit={startAnalysis}
        />
      </AuthGate>
    );
  }

  // ── Analysis / complete phase ─────────────────────────────────────────────────
  const isProcessing = phase === 'processing';

  return (
    <AuthGate>
      <div className="h-screen flex flex-col overflow-hidden" style={{ background: '#0a0a0b', color: '#f4f4f5' }}>
        {showFlash && <OverrideFlash />}

        {/* ── Top bar ── */}
        <div
          className="flex-shrink-0 px-5 h-12 flex items-center justify-between z-10"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(10,10,11,0.95)', backdropFilter: 'blur(8px)' }}
        >
          {/* Left: back + title */}
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

          {/* Right: status + user */}
          <div className="flex items-center gap-2.5">
            {/* Phase indicator */}
            {isProcessing && !overrideResult && (
              <div className="flex items-center gap-1.5 text-xs text-[#818cf8]">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                <span className="hidden sm:block font-medium">
                  {Object.values(rebuttals).some((r) => r.status !== 'pending')
                    ? 'Defender rebutting'
                    : 'Agents arguing'}
                </span>
              </div>
            )}

            {/* Concession counter */}
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
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: concessionCount >= 2 ? '#fb7185' : concessionCount === 1 ? '#fbbf24' : '#3f3f46' }}
              />
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
              <div
                className="px-3 py-1 rounded-full text-xs font-medium"
                style={{ background: 'rgba(255,255,255,0.05)', color: '#52525b', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                No override
              </div>
            )}

            {/* User */}
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

        {/* ── Three-panel body ── */}
        <div className="flex flex-1 min-h-0">

          {/* LEFT — Denial letter */}
          <div
            className="w-60 flex-shrink-0 overflow-y-auto scrollbar-thin p-4 flex flex-col gap-3"
            style={{ borderRight: '1px solid rgba(255,255,255,0.07)' }}
          >
            <p className="text-[10px] font-semibold text-[#52525b] uppercase tracking-widest">
              Denial Letter
            </p>

            {parsedDenial ? (
              <div className="space-y-1.5">
                {Object.entries(parsedDenial).map(([key, val]) => (
                  <div
                    key={key}
                    className="rounded-lg p-2.5"
                    style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <div className="text-[10px] text-[#52525b] capitalize mb-0.5">
                      {key.replace(/_/g, ' ')}
                    </div>
                    <div className="text-xs text-white font-medium break-words leading-snug">{val || '—'}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-1.5 animate-pulse">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="rounded-lg h-11" style={{ background: '#18181b' }} />
                ))}
              </div>
            )}

            <div className="rounded-lg p-3" style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-[10px] text-[#52525b] uppercase tracking-wider mb-2">Raw text</p>
              <pre className="text-xs text-[#52525b] whitespace-pre-wrap font-sans leading-relaxed">
                {denialText}
              </pre>
            </div>
          </div>

          {/* CENTER — Agent debate graph */}
          <div className="flex-1 flex flex-col min-h-0 p-4">
            <p className="text-[10px] font-semibold text-[#52525b] uppercase tracking-widest mb-3 flex-shrink-0">
              Agent Debate
            </p>
            <div className="relative flex-1 min-h-0">
              <AgentDebateGraph agents={agents} />
            </div>
          </div>

          {/* RIGHT — Defender rebuttals */}
          <div
            className="w-72 flex-shrink-0 overflow-y-auto scrollbar-thin p-4"
            style={{ borderLeft: '1px solid rgba(255,255,255,0.07)' }}
          >
            <p className="text-[10px] font-semibold text-[#52525b] uppercase tracking-widest mb-3">
              Defender Rebuttals
            </p>
            <div className="space-y-2.5">
              {CHALLENGER_IDS.map((id) => (
                <RebuttalCard key={id} agentId={id} state={rebuttals[id]} />
              ))}
            </div>

            {/* Verdict box */}
            {overrideResult && (
              <div
                className="mt-4 rounded-xl p-4 animate-slide-up"
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

        {/* ── Appeal Letter ── */}
        {overrideResult?.triggered && (
          <div
            className="flex-shrink-0 max-h-[45vh] overflow-y-auto scrollbar-thin"
            style={{ borderTop: '1px solid rgba(244,63,94,0.2)' }}
          >
            <AppealLetter text={appealLetter} streaming={appealStreaming} />
          </div>
        )}

        {/* ── No-override summary ── */}
        {overrideResult && !overrideResult.triggered && phase === 'complete' && (
          <div
            className="flex-shrink-0 px-6 py-3.5"
            style={{ borderTop: '1px solid rgba(255,255,255,0.07)', background: '#111113' }}
          >
            <p className="text-sm text-[#52525b] max-w-2xl mx-auto">
              <span className="text-[#a1a1aa] font-medium">Override did not fire.</span>{' '}
              The Denial Defender rebutted {4 - overrideResult.concessions}/4 challenges.
              Only {overrideResult.concessions} concession recorded — 2 required.
            </p>
          </div>
        )}
      </div>
    </AuthGate>
  );
}
