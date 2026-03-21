import { useState, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import AuthGate from './components/AuthGate.jsx';
import DenialInput from './components/DenialInput.jsx';
import AgentCard from './components/AgentCard.jsx';
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
        // SSE messages are separated by double newline
        const parts = buffer.split('\n\n');
        buffer = parts.pop(); // keep incomplete last part

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

  // ── Input phase ──────────────────────────────────────────────────────────────
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

  // ── Analysis / complete phase ────────────────────────────────────────────────
  return (
    <AuthGate>
      <div className="h-screen bg-gray-950 text-gray-100 flex flex-col overflow-hidden">
      {showFlash && <OverrideFlash />}

      {/* ── Top bar ── */}
      <div className="flex-shrink-0 border-b border-gray-800 px-5 py-2.5 flex items-center justify-between bg-gray-950/95 backdrop-blur z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setPhase('input')}
            className="text-gray-600 hover:text-gray-400 transition-colors text-sm mr-2"
            title="Back to input"
          >
            ←
          </button>
          <span className="text-xl font-black text-white tracking-tight">⚡ THE OVERRIDE</span>
          <span className="text-gray-600 text-xs hidden sm:block">adversarial multi-agent review</span>
        </div>

        <div className="flex items-center gap-3">
          {/* User info */}
          {user && (
            <div className="text-xs text-gray-500 hidden sm:flex items-center gap-2">
              <span>{user.name}</span>
              <button
                onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
                className="text-gray-600 hover:text-gray-400 transition-colors"
              >
                Log Out
              </button>
            </div>
          )}

          {/* Phase indicator */}
          {phase === 'processing' && !overrideResult && (
            <div className="flex items-center gap-2 text-xs text-amber-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              {Object.values(rebuttals).some((r) => r.status !== 'pending')
                ? 'DEFENDER REBUTTING...'
                : 'AGENTS ARGUING...'}
            </div>
          )}

          {/* Concession counter */}
          <div
            className={`px-3 py-1.5 rounded-lg border font-mono text-sm font-bold transition-all duration-300 ${
              concessionCount >= 2
                ? 'bg-red-950 border-red-600 text-red-400'
                : concessionCount === 1
                ? 'bg-orange-950/60 border-orange-700 text-orange-400'
                : 'bg-gray-900 border-gray-700 text-gray-500'
            }`}
          >
            CONCESSIONS: {concessionCount}/4
          </div>

          {overrideResult?.triggered && (
            <div className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-black tracking-widest animate-pulse-fast">
              ⚡ OVERRIDE ACTIVE
            </div>
          )}
          {overrideResult && !overrideResult.triggered && phase === 'complete' && (
            <div className="px-3 py-1.5 rounded-lg bg-gray-800 text-gray-400 text-xs font-mono border border-gray-700">
              OVERRIDE: NOT TRIGGERED
            </div>
          )}
        </div>
      </div>

      {/* ── Three-panel body ── */}
      <div className="flex flex-1 min-h-0">

        {/* LEFT — Denial letter */}
        <div className="w-64 flex-shrink-0 border-r border-gray-800 overflow-y-auto scrollbar-thin p-4 flex flex-col gap-4">
          <div>
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
              Denial Letter
            </h2>

            {/* Parsed fields */}
            {parsedDenial ? (
              <div className="space-y-2 mb-4">
                {Object.entries(parsedDenial).map(([key, val]) => (
                  <div key={key} className="bg-gray-900 rounded-lg p-2.5 border border-gray-800">
                    <div className="text-xs text-gray-500 capitalize mb-0.5">
                      {key.replace(/_/g, ' ')}
                    </div>
                    <div className="text-xs text-white font-semibold break-words">{val || '—'}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2 mb-4 animate-pulse">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="bg-gray-900 rounded-lg p-2.5 h-12" />
                ))}
              </div>
            )}

            {/* Raw letter */}
            <div className="bg-gray-900 rounded-lg p-3 border border-gray-800">
              <div className="text-xs text-gray-500 mb-2 font-mono uppercase tracking-wider">Raw text</div>
              <pre className="text-xs text-gray-400 whitespace-pre-wrap font-sans leading-relaxed">
                {denialText}
              </pre>
            </div>
          </div>
        </div>

        {/* CENTER — Agent cards */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
            Agent Debate
          </h2>
          <div className="space-y-3">
            {/* Denial Defender first */}
            <AgentCard agentId="denial_defender" state={agents.denial_defender} />
            {/* Challengers */}
            {CHALLENGER_IDS.map((id) => (
              <AgentCard key={id} agentId={id} state={agents[id]} />
            ))}
          </div>
        </div>

        {/* RIGHT — Defender rebuttals */}
        <div className="w-72 flex-shrink-0 border-l border-gray-800 overflow-y-auto scrollbar-thin p-4">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
            Defender Rebuttals
          </h2>
          <div className="space-y-3">
            {CHALLENGER_IDS.map((id) => (
              <RebuttalCard key={id} agentId={id} state={rebuttals[id]} />
            ))}
          </div>

          {/* Verdict box */}
          {overrideResult && (
            <div
              className={`mt-4 rounded-xl border p-4 animate-slide-up ${
                overrideResult.triggered
                  ? 'border-red-700 bg-red-950/30'
                  : 'border-gray-700 bg-gray-900'
              }`}
            >
              <div
                className={`text-sm font-black uppercase tracking-widest mb-1 ${
                  overrideResult.triggered ? 'text-red-400' : 'text-gray-400'
                }`}
              >
                {overrideResult.triggered ? '⚡ Override Fired' : 'Override: Not Triggered'}
              </div>
              <div className="text-xs text-gray-500 font-mono">
                {overrideResult.concessions} of 4 challenges conceded.
                {overrideResult.triggered
                  ? ' Defense collapsed — appeal letter generated below.'
                  : ` Need 2 to trigger — defense held on ${4 - overrideResult.concessions} of 4.`}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Appeal Letter (below panels when override fires) ── */}
      {(overrideResult?.triggered) && (
        <div className="flex-shrink-0 max-h-[45vh] overflow-y-auto scrollbar-thin border-t-2 border-red-700">
          <AppealLetter text={appealLetter} streaming={appealStreaming} />
        </div>
      )}

      {/* ── No-override summary ── */}
      {overrideResult && !overrideResult.triggered && phase === 'complete' && (
        <div className="flex-shrink-0 border-t border-gray-800 bg-gray-900 px-6 py-4">
          <div className="max-w-2xl mx-auto">
            <p className="text-sm text-gray-400 font-mono">
              <span className="text-gray-300 font-bold">Override did not fire.</span>{' '}
              The Denial Defender successfully rebutted {4 - overrideResult.concessions}/4 challenges.
              Only {overrideResult.concessions} concession recorded — 2 required to trigger the override.
              The denial appears procedurally defensible under current challenge.
            </p>
          </div>
        </div>
      )}
      </div>
    </AuthGate>
  );
}
