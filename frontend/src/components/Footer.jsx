export default function Footer({ onShowImpact }) {
  return (
    <div
      className="flex-shrink-0 flex items-center justify-between px-6 h-9"
      style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: '#0a0a0b' }}
    >
      <div className="flex items-center gap-2">
        <div className="w-3.5 h-3.5 rounded flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.15)' }}>
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
        </div>
        <span className="text-[11px] font-semibold text-[#3f3f46]">VerdictX</span>
        <span className="text-[#27272a] text-[11px]">·</span>
        <span className="text-[11px] text-[#27272a]">HackDuke 2026</span>
      </div>

      <div className="flex items-center gap-3">
        {onShowImpact && (
          <>
            <button
              onClick={onShowImpact}
              className="text-[10px] text-[#3f3f46] hover:text-indigo-400 transition-colors"
            >
              Why this matters →
            </button>
            <span className="text-[#27272a] text-[11px]">·</span>
          </>
        )}
        <span className="text-[10px] text-[#27272a]">Powered by</span>
        <span className="text-[10px] font-medium text-[#3f3f46]">IBM watsonx Orchestrate</span>
        <span className="text-[#27272a] text-[11px]">·</span>
        <span className="text-[10px] text-[#27272a]">8 AI agents</span>
      </div>
    </div>
  );
}
