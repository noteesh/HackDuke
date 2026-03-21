export default function OverrideFlash() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center override-flash pointer-events-none">
      <div
        className="absolute inset-0 bg-red-600"
        style={{ opacity: 0.92 }}
      />
      <div className="relative text-center select-none">
        <div className="text-[9rem] leading-none mb-4 drop-shadow-2xl">⚡</div>
        <div
          className="text-6xl font-black text-white tracking-widest uppercase drop-shadow-2xl"
          style={{ textShadow: '0 0 40px rgba(255,255,255,0.8), 0 0 80px rgba(255,200,0,0.5)' }}
        >
          OVERRIDE
        </div>
        <div
          className="text-6xl font-black text-white tracking-widest uppercase drop-shadow-2xl"
          style={{ textShadow: '0 0 40px rgba(255,255,255,0.8), 0 0 80px rgba(255,200,0,0.5)' }}
        >
          TRIGGERED
        </div>
        <div className="text-xl text-red-200 mt-6 font-mono tracking-wider">
          DEFENSE COLLAPSED — APPEAL LETTER GENERATING
        </div>
        <div className="text-sm text-red-300/70 mt-2 font-mono">
          2 of 4 challenges conceded by institution's own counsel
        </div>
      </div>
    </div>
  );
}
