function copyToClipboard(text) {
  navigator.clipboard.writeText(text).catch(() => {
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
  });
}

function downloadAsPDF() {
  window.print();
}

export default function AppealLetter({ text, streaming }) {
  if (!text) return null;

  return (
    <div className="animate-slide-up" style={{ background: '#0a0a0b' }}>
      {/* Banner */}
      <div
        className="px-6 py-3 flex items-center justify-between"
        style={{ background: 'rgba(244,63,94,0.06)', borderBottom: '1px solid rgba(244,63,94,0.15)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(244,63,94,0.12)', border: '1px solid rgba(244,63,94,0.25)' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fb7185" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </div>
          <div>
            <div className="text-sm font-semibold text-white">Appeal Letter Generated</div>
            <div className="text-xs" style={{ color: '#71717a' }}>
              Built from conceded arguments — the defense could not rebut these
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => copyToClipboard(text)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{ background: 'rgba(255,255,255,0.06)', color: '#a1a1aa', border: '1px solid rgba(255,255,255,0.08)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.09)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            Copy
          </button>
          <button
            onClick={downloadAsPDF}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all text-white"
            style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', border: '1px solid rgba(99,102,241,0.3)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'linear-gradient(135deg, #818cf8, #6366f1)'}
            onMouseLeave={e => e.currentTarget.style.background = 'linear-gradient(135deg, #6366f1, #4f46e5)'}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Save PDF
          </button>
        </div>
      </div>

      {/* Letter content */}
      <div className="max-w-4xl mx-auto p-8" id="appeal-print">
        <div
          className={`agent-content text-sm leading-loose ${streaming ? 'cursor-blink' : ''}`}
          style={{ color: '#d4d4d8', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8rem' }}
        >
          {text}
        </div>
      </div>
    </div>
  );
}
