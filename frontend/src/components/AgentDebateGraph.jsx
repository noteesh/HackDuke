import { useState, useRef, useCallback, useEffect } from 'react';

const AGENT_META = {
  denial_defender: {
    name: 'Denial Defender',
    role: 'Defense',
    accentColor: '#6366f1',
    accentBg: 'rgba(99,102,241,0.08)',
    accentBorder: 'rgba(99,102,241,0.25)',
    dotColor: '#818cf8',
  },
  bias_auditor: {
    name: 'Bias Auditor',
    role: 'Challenger',
    accentColor: '#f59e0b',
    accentBg: 'rgba(245,158,11,0.06)',
    accentBorder: 'rgba(245,158,11,0.22)',
    dotColor: '#fbbf24',
  },
  precedent_agent: {
    name: 'Precedent Agent',
    role: 'Challenger',
    accentColor: '#f59e0b',
    accentBg: 'rgba(245,158,11,0.06)',
    accentBorder: 'rgba(245,158,11,0.22)',
    dotColor: '#fbbf24',
  },
  circumstance_agent: {
    name: 'Circumstance Agent',
    role: 'Challenger',
    accentColor: '#f59e0b',
    accentBg: 'rgba(245,158,11,0.06)',
    accentBorder: 'rgba(245,158,11,0.22)',
    dotColor: '#fbbf24',
  },
  legal_agent: {
    name: 'Legal Agent',
    role: 'Challenger',
    accentColor: '#f59e0b',
    accentBg: 'rgba(245,158,11,0.06)',
    accentBorder: 'rgba(245,158,11,0.22)',
    dotColor: '#fbbf24',
  },
};

// X-shape positions: Defender center, challengers at 4 corners
const NODE_POSITIONS = {
  denial_defender:   { x: 250, y: 210 },
  bias_auditor:      { x: 80,  y: 80  },
  precedent_agent:   { x: 420, y: 80  },
  circumstance_agent:{ x: 80,  y: 340 },
  legal_agent:       { x: 420, y: 340 },
};

const CHALLENGER_IDS = ['bias_auditor', 'precedent_agent', 'circumstance_agent', 'legal_agent'];

// Box half-dimensions for hit-testing
const BOX_W = 110;
const BOX_H = 48;

// Calculate edge intersection point for line from center to box
function getBoxEdgePoint(fromX, fromY, toX, toY) {
  const dx = toX - fromX;
  const dy = toY - fromY;
  const angle = Math.atan2(dy, dx);
  
  // Calculate intersection with box edges
  const halfW = BOX_W / 2;
  const halfH = BOX_H / 2;
  
  // Check which edge the line intersects
  const tx = Math.abs(dx) > 0.001 ? halfW / Math.abs(Math.cos(angle)) : Infinity;
  const ty = Math.abs(dy) > 0.001 ? halfH / Math.abs(Math.sin(angle)) : Infinity;
  
  const t = Math.min(tx, ty);
  
  return {
    x: toX - Math.cos(angle) * t,
    y: toY - Math.sin(angle) * t
  };
}

function getLineColor(rebuttalResult, status) {
  if (rebuttalResult === 'CONCEDED') return { stroke: '#34d399', glow: 'rgba(52,211,153,0.5)' };
  if (rebuttalResult === 'REBUTTED') return { stroke: '#fb7185', glow: 'rgba(251,113,133,0.4)' };
  if (status === 'arguing' || status === 'done') return { stroke: '#818cf8', glow: 'rgba(129,140,248,0.4)' };
  return { stroke: 'rgba(255,255,255,0.1)', glow: 'transparent' };
}

function getBorderStyle(agentId, state) {
  const { status, rebuttalResult } = state || {};
  const meta = AGENT_META[agentId];
  if (rebuttalResult === 'CONCEDED') return { border: '1.5px solid rgba(52,211,153,0.6)', bg: 'rgba(52,211,153,0.07)', glow: '0 0 16px rgba(52,211,153,0.3)' };
  if (rebuttalResult === 'REBUTTED') return { border: '1.5px solid rgba(244,63,94,0.5)', bg: 'rgba(244,63,94,0.06)', glow: '0 0 14px rgba(244,63,94,0.25)' };
  if (status === 'arguing') return { border: `1.5px solid ${meta.accentColor}`, bg: meta.accentBg, glow: `0 0 18px ${meta.accentColor}55`, pulse: true };
  if (status === 'done') return { border: '1.5px solid rgba(255,255,255,0.14)', bg: 'rgba(255,255,255,0.03)', glow: 'none' };
  return { border: '1.5px solid rgba(255,255,255,0.07)', bg: '#111113', glow: 'none' };
}

function StatusBadge({ status, rebuttalResult }) {
  if (rebuttalResult === 'CONCEDED') return (
    <span style={{ background: 'rgba(52,211,153,0.15)', color: '#34d399', border: '1px solid rgba(52,211,153,0.3)', borderRadius: 99, padding: '1px 7px', fontSize: 10, fontWeight: 600 }}>
      Conceded
    </span>
  );
  if (rebuttalResult === 'REBUTTED') return (
    <span style={{ background: 'rgba(244,63,94,0.12)', color: '#fb7185', border: '1px solid rgba(244,63,94,0.25)', borderRadius: 99, padding: '1px 7px', fontSize: 10, fontWeight: 600 }}>
      Rebutted
    </span>
  );
  if (status === 'arguing') return (
    <span style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 99, padding: '1px 7px', fontSize: 10, fontWeight: 600 }}>
      Arguing
    </span>
  );
  if (status === 'done') return (
    <span style={{ background: 'rgba(255,255,255,0.05)', color: '#71717a', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 99, padding: '1px 7px', fontSize: 10, fontWeight: 600 }}>
      Done
    </span>
  );
  return (
    <span style={{ background: 'rgba(255,255,255,0.03)', color: '#52525b', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 99, padding: '1px 7px', fontSize: 10, fontWeight: 600 }}>
      Pending
    </span>
  );
}

// A single dot animating along a line between two SVG points
function LineDot({ x1, y1, x2, y2, color, delay = 0, duration = 2.4 }) {
  const id = `dot-${x1}-${y1}-${x2}-${y2}-${delay}`;
  return (
    <circle r="3" fill={color} opacity="0.9" filter={`url(#glow-${color.replace('#', '')})`}>
      <animateMotion
        dur={`${duration}s`}
        repeatCount="indefinite"
        begin={`${delay}s`}
        path={`M ${x1} ${y1} L ${x2} ${y2}`}
        keyPoints="0;1"
        keyTimes="0;1"
        calcMode="linear"
      />
      <animate attributeName="opacity" values="0;1;1;0" dur={`${duration}s`} repeatCount="indefinite" begin={`${delay}s`} />
    </circle>
  );
}

// Detail overlay shown on agent click
function DetailOverlay({ agentId, state, svgX, svgY, svgWidth, svgHeight, onClose }) {
  const meta = AGENT_META[agentId];
  const { status, content, rebuttalResult } = state || {};
  const closeTimer = useRef(null);
  const overlayRef = useRef(null);

  // Convert SVG coordinates to % for positioning
  const xPct = svgX / svgWidth;
  const yPct = svgY / svgHeight;

  // Overlay is 320px wide. Position to the side of node.
  const overlayWidth = 320;
  const overlayStyle = {
    position: 'absolute',
    width: overlayWidth,
    zIndex: 20,
    top: `${Math.max(4, Math.min(yPct * 100 - 15, 65))}%`,
    ...(xPct > 0.5
      ? { right: `${Math.max(4, (1 - xPct) * 100 + 18)}%` }
      : { left: `${Math.max(4, xPct * 100 + 18)}%` }),
  };

  const handleMouseLeave = useCallback(() => {
    closeTimer.current = setTimeout(onClose, 750);
  }, [onClose]);

  const handleMouseEnter = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  useEffect(() => () => { if (closeTimer.current) clearTimeout(closeTimer.current); }, []);

  const isConceded = rebuttalResult === 'CONCEDED';
  const isRebutted = rebuttalResult === 'REBUTTED';
  const borderCol = isConceded ? 'rgba(52,211,153,0.4)' : isRebutted ? 'rgba(244,63,94,0.35)' : meta.accentBorder;
  const bgCol = isConceded ? 'rgba(52,211,153,0.07)' : isRebutted ? 'rgba(244,63,94,0.05)' : '#18181b';

  return (
    <div
      ref={overlayRef}
      style={{
        ...overlayStyle,
        background: bgCol,
        border: `1px solid ${borderCol}`,
        borderRadius: 12,
        boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Header */}
      <div style={{ borderBottom: `1px solid ${borderCol}`, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: isConceded ? 'rgba(52,211,153,0.06)' : isRebutted ? 'rgba(244,63,94,0.04)' : meta.accentBg, borderRadius: '12px 12px 0 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: isConceded ? '#34d399' : isRebutted ? '#fb7185' : meta.dotColor, flexShrink: 0 }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>{meta.name}</span>
          <span style={{ fontSize: 10, fontWeight: 600, color: meta.accentColor, background: `${meta.accentColor}18`, borderRadius: 99, padding: '1px 6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{meta.role}</span>
        </div>
        <StatusBadge status={status} rebuttalResult={rebuttalResult} />
      </div>
      {/* Content */}
      <div style={{ padding: '10px 14px', maxHeight: 200, overflowY: 'auto', scrollbarWidth: 'thin' }}>
        {(!content || status === 'pending') ? (
          <p style={{ fontSize: 11, color: '#3f3f46', fontStyle: 'italic' }}>Waiting to fire...</p>
        ) : (
          <p style={{
            fontSize: 11.5,
            lineHeight: 1.65,
            color: isConceded ? '#6ee7b7' : isRebutted ? '#fda4af' : '#a1a1aa',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            fontFamily: 'Inter, sans-serif',
          }}
            className={status === 'arguing' ? 'cursor-blink' : ''}
          >
            {content}
          </p>
        )}
      </div>
    </div>
  );
}

export default function AgentDebateGraph({ agents }) {
  const [activeAgent, setActiveAgent] = useState(null);
  const containerRef = useRef(null);
  const closeTimer = useRef(null);

  // SVG viewport
  const SVG_W = 500;
  const SVG_H = 420;

  const handleNodeClick = useCallback((agentId) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setActiveAgent(prev => prev === agentId ? null : agentId);
  }, []);

  const handleOverlayClose = useCallback(() => setActiveAgent(null), []);

  useEffect(() => () => { if (closeTimer.current) clearTimeout(closeTimer.current); }, []);

  const defenderState = agents.denial_defender || {};
  const defPos = NODE_POSITIONS.denial_defender;

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: '#0a0a0b' }}>
      <style>{`
        @keyframes pulseRing {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50%       { opacity: 0.15; transform: scale(1.18); }
        }
        @keyframes gradientShift {
          0%, 100% { transform: translate(-50%, -50%) rotate(0deg) scale(1); }
          33% { transform: translate(-50%, -50%) rotate(120deg) scale(1.1); }
          66% { transform: translate(-50%, -50%) rotate(240deg) scale(0.95); }
        }
        @keyframes floatOrb {
          0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0.4; }
          25% { transform: translateY(-20px) translateX(10px); opacity: 0.6; }
          50% { transform: translateY(-10px) translateX(-15px); opacity: 0.5; }
          75% { transform: translateY(-25px) translateX(5px); opacity: 0.7; }
        }
        @keyframes meshPulse {
          0%, 100% { opacity: 0.03; }
          50% { opacity: 0.08; }
        }
      `}</style>
      
      {/* Advanced Animated Background Layers */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {/* Gradient Mesh Background */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '150%',
          height: '150%',
          background: 'radial-gradient(circle at 30% 40%, rgba(99,102,241,0.15) 0%, transparent 50%), radial-gradient(circle at 70% 60%, rgba(245,158,11,0.12) 0%, transparent 50%), radial-gradient(circle at 50% 50%, rgba(52,211,153,0.08) 0%, transparent 60%)',
          filter: 'blur(60px)',
          animation: 'gradientShift 20s ease-in-out infinite',
          transformOrigin: 'center',
        }} />
        
        {/* Floating Orbs */}
        {[...Array(8)].map((_, i) => (
          <div key={`orb-${i}`} style={{
            position: 'absolute',
            left: `${15 + (i * 12)}%`,
            top: `${20 + (i % 3) * 25}%`,
            width: `${80 + (i % 3) * 40}px`,
            height: `${80 + (i % 3) * 40}px`,
            borderRadius: '50%',
            background: i % 3 === 0 
              ? 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, rgba(99,102,241,0.05) 40%, transparent 70%)'
              : i % 3 === 1
              ? 'radial-gradient(circle, rgba(245,158,11,0.15) 0%, rgba(245,158,11,0.04) 40%, transparent 70%)'
              : 'radial-gradient(circle, rgba(52,211,153,0.18) 0%, rgba(52,211,153,0.05) 40%, transparent 70%)',
            filter: 'blur(20px)',
            animation: `floatOrb ${8 + i * 2}s ease-in-out infinite`,
            animationDelay: `${i * 0.5}s`,
          }} />
        ))}
        
        {/* Particle System */}
        {[...Array(25)].map((_, i) => {
          const leftPos = Math.random() * 100;
          const size = 2 + Math.random() * 3;
          const duration = 15 + Math.random() * 20;
          const delay = Math.random() * 10;
          const drift = (Math.random() - 0.5) * 100;
          const particleId = `particle-${i}-${Math.random().toString(36).substr(2, 9)}`;
          
          return (
            <div key={`particle-${i}`}>
              <style>{`
                @keyframes ${particleId} {
                  0% { transform: translateY(0px) translateX(0px); opacity: 0; }
                  10% { opacity: 0.8; }
                  90% { opacity: 0.8; }
                  100% { transform: translateY(-100vh) translateX(${drift}px); opacity: 0; }
                }
              `}</style>
              <div style={{
                position: 'absolute',
                left: `${leftPos}%`,
                bottom: '-10px',
                width: `${size}px`,
                height: `${size}px`,
                borderRadius: '50%',
                background: i % 4 === 0 ? '#818cf8' : i % 4 === 1 ? '#fbbf24' : i % 4 === 2 ? '#34d399' : '#fb7185',
                boxShadow: `0 0 ${4 + Math.random() * 6}px currentColor`,
                animation: `${particleId} ${duration}s linear infinite`,
                animationDelay: `${delay}s`,
              }} />
            </div>
          );
        })}
        
        {/* Grid Pattern Overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99,102,241,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          animation: 'meshPulse 8s ease-in-out infinite',
        }} />
        
        
        {/* Vignette */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at center, transparent 0%, rgba(10,10,11,0.4) 100%)',
        }} />
      </div>

      <svg
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        style={{ width: '100%', height: '100%', overflow: 'visible', position: 'relative', zIndex: 1 }}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Glow filter for dots */}
          <filter id="dotGlow" x="-200%" y="-200%" width="500%" height="500%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          {/* Line glow */}
          <filter id="lineGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* ── Lines from defender to each challenger ── */}
        {CHALLENGER_IDS.map((id) => {
          const pos = NODE_POSITIONS[id];
          const state = agents[id] || {};
          const { stroke, glow } = getLineColor(state.rebuttalResult, state.status);
          const isActive = state.status === 'arguing' || state.status === 'done' || state.rebuttalResult;
          
          // Calculate edge points for both boxes
          const defenderEdge = getBoxEdgePoint(pos.x, pos.y, defPos.x, defPos.y);
          const challengerEdge = getBoxEdgePoint(defPos.x, defPos.y, pos.x, pos.y);
          
          return (
            <g key={id}>
              {/* Glow line behind */}
              <line
                x1={defenderEdge.x} y1={defenderEdge.y}
                x2={challengerEdge.x} y2={challengerEdge.y}
                stroke={glow}
                strokeWidth="4"
                filter="url(#lineGlow)"
                opacity={isActive ? 0.6 : 0}
                style={{ transition: 'all 0.6s ease' }}
              />
              {/* Main line */}
              <line
                x1={defenderEdge.x} y1={defenderEdge.y}
                x2={challengerEdge.x} y2={challengerEdge.y}
                stroke={stroke}
                strokeWidth="1.5"
                strokeDasharray={isActive ? 'none' : '5 5'}
                style={{ transition: 'all 0.6s ease' }}
              />
              {/* Traveling dots along the line */}
              {isActive && (
                <>
                  <LineDot x1={defenderEdge.x} y1={defenderEdge.y} x2={challengerEdge.x} y2={challengerEdge.y} color={stroke} delay={0} duration={2.2} />
                  <LineDot x1={defenderEdge.x} y1={defenderEdge.y} x2={challengerEdge.x} y2={challengerEdge.y} color={stroke} delay={0.8} duration={2.2} />
                  <LineDot x1={challengerEdge.x} y1={challengerEdge.y} x2={defenderEdge.x} y2={defenderEdge.y} color={stroke} delay={0.4} duration={2.2} />
                </>
              )}
            </g>
          );
        })}

        {/* ── Defender node ── */}
        {(() => {
          const pos = defPos;
          const state = defenderState;
          const style = getBorderStyle('denial_defender', state);
          const isArguing = state.status === 'arguing';
          return (
            <g
              key="denial_defender"
              style={{ cursor: 'pointer' }}
              onClick={() => handleNodeClick('denial_defender')}
            >
              {/* Pulse ring when arguing */}
              {isArguing && (
                <rect
                  x={pos.x - BOX_W / 2 - 6} y={pos.y - BOX_H / 2 - 6}
                  width={BOX_W + 12} height={BOX_H + 12}
                  rx="14"
                  fill="none"
                  stroke="#6366f1"
                  strokeWidth="1.5"
                  style={{ animation: 'pulseRing 1.2s ease-in-out infinite' }}
                />
              )}
              {/* Box fill */}
              <rect
                x={pos.x - BOX_W / 2} y={pos.y - BOX_H / 2}
                width={BOX_W} height={BOX_H}
                rx="10"
                fill={style.bg}
                stroke={style.border.replace('1.5px solid ', '')}
                strokeWidth="1.5"
                style={{ filter: style.glow !== 'none' ? `drop-shadow(0 0 8px ${AGENT_META.denial_defender.accentColor}44)` : 'none', transition: 'all 0.4s' }}
              />
              {/* Active dot */}
              {isArguing && (
                <circle cx={pos.x - BOX_W / 2 + 10} cy={pos.y - 8} r="3" fill="#818cf8" filter="url(#dotGlow)">
                  <animate attributeName="opacity" values="1;0.2;1" dur="0.9s" repeatCount="indefinite" />
                </circle>
              )}
              {/* Name */}
              <text x={pos.x} y={pos.y - 6} textAnchor="middle" fill="#f4f4f5" fontSize="11" fontWeight="600" fontFamily="Inter, sans-serif">
                Denial Defender
              </text>
              {/* Role badge */}
              <text x={pos.x} y={pos.y + 10} textAnchor="middle" fill="#818cf8" fontSize="9.5" fontWeight="600" fontFamily="Inter, sans-serif" letterSpacing="0.06em">
                DEFENSE
              </text>
              {/* Status */}
              <text x={pos.x} y={pos.y + 24} textAnchor="middle" fill={state.status === 'arguing' ? '#818cf8' : state.status === 'done' ? '#52525b' : '#3f3f46'} fontSize="9" fontFamily="Inter, sans-serif">
                {state.status === 'arguing' ? '● Arguing' : state.status === 'done' ? '✓ Done' : '○ Pending'}
              </text>
            </g>
          );
        })()}

        {/* ── Challenger nodes ── */}
        {CHALLENGER_IDS.map((id) => {
          const pos = NODE_POSITIONS[id];
          const meta = AGENT_META[id];
          const state = agents[id] || {};
          const style = getBorderStyle(id, state);
          const isArguing = state.status === 'arguing';
          const isConceded = state.rebuttalResult === 'CONCEDED';
          const isRebutted = state.rebuttalResult === 'REBUTTED';

          const statusText = isConceded ? '✓ Conceded'
            : isRebutted ? '✗ Rebutted'
            : state.status === 'arguing' ? '● Arguing'
            : state.status === 'done' ? '✓ Done'
            : '○ Pending';
          const statusColor = isConceded ? '#34d399' : isRebutted ? '#fb7185' : state.status === 'arguing' ? '#fbbf24' : state.status === 'done' ? '#52525b' : '#3f3f46';

          return (
            <g
              key={id}
              style={{ cursor: 'pointer' }}
              onClick={() => handleNodeClick(id)}
            >
              {/* Pulse ring when arguing */}
              {isArguing && (
                <rect
                  x={pos.x - BOX_W / 2 - 6} y={pos.y - BOX_H / 2 - 6}
                  width={BOX_W + 12} height={BOX_H + 12}
                  rx="14"
                  fill="none"
                  stroke={meta.accentColor}
                  strokeWidth="1.5"
                  style={{ animation: 'pulseRing 1.2s ease-in-out infinite' }}
                />
              )}
              {/* Box */}
              <rect
                x={pos.x - BOX_W / 2} y={pos.y - BOX_H / 2}
                width={BOX_W} height={BOX_H}
                rx="10"
                fill={style.bg}
                stroke={style.border.replace('1.5px solid ', '')}
                strokeWidth="1.5"
                style={{ filter: style.glow !== 'none' ? `drop-shadow(0 0 8px ${meta.accentColor}44)` : 'none', transition: 'all 0.4s' }}
              />
              {/* Active dot */}
              {isArguing && (
                <circle cx={pos.x - BOX_W / 2 + 10} cy={pos.y - 8} r="3" fill={meta.accentColor} filter="url(#dotGlow)">
                  <animate attributeName="opacity" values="1;0.2;1" dur="0.9s" repeatCount="indefinite" />
                </circle>
              )}
              {/* Name */}
              <text x={pos.x} y={pos.y - 6} textAnchor="middle" fill="#f4f4f5" fontSize="11" fontWeight="600" fontFamily="Inter, sans-serif">
                {meta.name}
              </text>
              {/* Role */}
              <text x={pos.x} y={pos.y + 10} textAnchor="middle" fill={meta.accentColor} fontSize="9.5" fontWeight="600" fontFamily="Inter, sans-serif" letterSpacing="0.06em">
                CHALLENGER
              </text>
              {/* Status */}
              <text x={pos.x} y={pos.y + 24} textAnchor="middle" fill={statusColor} fontSize="9" fontFamily="Inter, sans-serif">
                {statusText}
              </text>
            </g>
          );
        })}
      </svg>

      {/* ── Detail overlay ── */}
      {activeAgent && (
        <DetailOverlay
          agentId={activeAgent}
          state={agents[activeAgent]}
          svgX={NODE_POSITIONS[activeAgent].x}
          svgY={NODE_POSITIONS[activeAgent].y}
          svgWidth={SVG_W}
          svgHeight={SVG_H}
          onClose={handleOverlayClose}
        />
      )}
    </div>
  );
}
