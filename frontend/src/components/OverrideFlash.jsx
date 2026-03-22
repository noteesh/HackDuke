export default function OverrideFlash() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center override-flash pointer-events-none">
      {/* Background */}
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse at center, rgba(244,63,94,0.92) 0%, rgba(136,19,55,0.96) 60%, rgba(10,10,11,0.98) 100%)' }}
      />

      {/* Noise/grain texture overlay */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'1\'/%3E%3C/svg%3E")',
          backgroundSize: '128px 128px',
        }}
      />

      {/* Content */}
      <div className="relative text-center select-none px-8">
        {/* Icon */}
        <div className="flex items-center justify-center mb-6">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', boxShadow: '0 0 60px rgba(255,255,255,0.15)' }}
          >
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </div>
        </div>

        {/* Title */}
        <div
          className="text-5xl font-bold text-white tracking-tight mb-2"
          style={{ textShadow: '0 2px 40px rgba(255,255,255,0.3)' }}
        >
          VerdictX
        </div>
        <div
          className="text-5xl font-bold tracking-tight mb-8"
          style={{ color: 'rgba(255,255,255,0.7)', textShadow: '0 2px 40px rgba(255,255,255,0.15)' }}
        >
          Triggered
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 justify-center mb-6">
          <div className="h-px w-16" style={{ background: 'rgba(255,255,255,0.2)' }} />
          <div className="w-1.5 h-1.5 rounded-full bg-white opacity-50" />
          <div className="h-px w-16" style={{ background: 'rgba(255,255,255,0.2)' }} />
        </div>

        {/* Subtitle */}
        <div className="text-base font-medium mb-2" style={{ color: 'rgba(255,255,255,0.75)' }}>
          Defense Collapsed
        </div>
        <div className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
          2 of 4 challenges conceded — appeal letter generating
        </div>
      </div>
    </div>
  );
}
