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

function downloadAsPDF(text) {
  window.print();
}

export default function AppealLetter({ text, streaming }) {
  if (!text) return null;

  return (
    <div className="border-t-2 border-red-700 bg-gray-950 animate-slide-up">
      {/* Banner */}
      <div className="bg-red-950 border-b border-red-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">⚡</span>
          <div>
            <div className="text-red-400 font-black text-sm tracking-widest uppercase">
              Override Active — Appeal Letter Generated
            </div>
            <div className="text-red-600 text-xs font-mono">
              Built from conceded arguments only — arguments the defense could not rebut
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => copyToClipboard(text)}
            className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white text-sm font-semibold transition-colors border border-gray-700"
          >
            Copy Text
          </button>
          <button
            onClick={downloadAsPDF}
            className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-gray-950 text-sm font-bold transition-colors"
          >
            Print / Save PDF
          </button>
        </div>
      </div>

      {/* Letter */}
      <div className="max-w-4xl mx-auto p-8" id="appeal-print">
        <div
          className={`agent-content text-gray-200 text-sm leading-loose ${
            streaming ? 'cursor-blink' : ''
          }`}
          style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8rem' }}
        >
          {text}
        </div>
      </div>
    </div>
  );
}
