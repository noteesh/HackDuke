import { useAuth0 } from '@auth0/auth0-react';
import Footer from './Footer.jsx';

// Sample A — weak case for the challenger agents. Specific metrics, full disclosures,
// multiple independent disqualifiers. Defense should hold easily.
const SAMPLE_DENIAL_WEAK = `Date: March 14, 2026
Applicant: Jordan M. Casey
Application ID: FNB-2026-001847
Application Type: Personal Loan — $12,000
Institution: First National Bank, N.A.

Dear Mr. Casey,

Thank you for your application for a personal loan of $12,000. After a thorough review of your credit profile, we are unable to approve your request at this time.

SPECIFIC REASONS FOR DENIAL:

  1. Credit score below minimum threshold
     Your current FICO Score 8 is 541 (obtained from Equifax on March 13, 2026).
     Our minimum required score for this loan product is 640.

  2. Debt-to-income ratio exceeds maximum
     Your verified monthly debt obligations total $3,840 against a gross monthly
     income of $4,200, resulting in a DTI of 91.4%. Our maximum permitted DTI
     for unsecured personal loans is 43%.

  3. Recent derogatory credit events
     Our review identified three open collection accounts totaling $7,214,
     a Chapter 7 bankruptcy discharge dated September 2024 (within our 36-month
     lookback period), and two accounts 90+ days past due in the last 12 months.

NOTICE OF ADVERSE ACTION:

This notice is issued pursuant to the Equal Credit Opportunity Act (ECOA), 15 U.S.C. § 1691, and the Fair Credit Reporting Act (FCRA), 15 U.S.C. § 1681m. You have the right to request the specific reasons for this decision within 60 days of receiving this notice.

Credit reporting agency: Equifax Information Services LLC
P.O. Box 740256, Atlanta, GA 30374 · 1-800-685-1111

You may obtain a free copy of your credit report from the agency above. If you believe any information in your report is inaccurate, you have the right to dispute it directly with the agency.

To discuss alternative products or future eligibility, please contact our lending team at 1-800-555-0147 or visit any branch location.

Sincerely,
First National Bank, N.A.
Consumer Lending Division · NMLS #112358`;

// Sample B — strong case for the challenger agents. Vague reasons, no disclosed metrics,
// algorithmic opacity, protected-class indicators, ECOA notice deficiencies.
const SAMPLE_DENIAL_STRONG = `Date: March 14, 2026
Applicant: Marcus J. Williams
Application ID: ALF-2026-084471
Application Type: Personal Loan — $18,500
Institution: AutoLend Financial Services, N.A.

Dear Mr. Williams,

After careful review, we regret to inform you that your application for a personal loan in the amount of $18,500 has been denied. This decision was rendered by our automated underwriting system on March 14, 2026.

REASONS FOR DENIAL:

  1. Insufficient credit history
  2. Debt-to-income ratio exceeds acceptable threshold
  3. Insufficient credit score

NOTICE OF ADVERSE ACTION:

This notice is provided pursuant to the Equal Credit Opportunity Act (ECOA), 15 U.S.C. § 1691, and the Fair Credit Reporting Act (FCRA), 15 U.S.C. § 1681. You have the right to request, within 60 days of this notice, a statement of specific reasons for the denial. You also have the right to a free copy of your credit report from the reporting agency used in this decision.

Credit reporting agency used: Experian
Address: P.O. Box 4500, Allen, TX 75013
Phone: 1-888-397-3742

No specific score threshold, applicant metric, or algorithmic weighting was disclosed as part of this decision. AutoLend Financial's proprietary risk model incorporates factors including but not limited to payment history, outstanding balances, and length of credit relationships.

If you have questions, contact our loan servicing department at 1-800-555-0192.

Sincerely,
AutoLend Financial Services, N.A.
Automated Lending Division
NMLS #389204`;

export default function DenialInput({ denialText, onTextChange, onSubmit, onShowImpact }) {
  const { user, logout } = useAuth0();

  return (
    <div className="min-h-screen bg-[#0a0a0b] flex flex-col">

      {/* ── Top bar ── */}
      <div
        className="flex-shrink-0 px-5 h-12 flex items-center justify-between z-10 sticky top-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(10,10,11,0.97)', backdropFilter: 'blur(8px)' }}
      >
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.15)' }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-white">VerdictX</span>
          <span className="text-[#3f3f46] text-xs hidden sm:block">/ new case</span>
        </div>

        <div className="flex items-center gap-3">
          {onShowImpact && (
            <button
              onClick={onShowImpact}
              className="text-xs text-[#52525b] hover:text-[#a1a1aa] transition-colors hidden sm:block"
            >
              Why this matters
            </button>
          )}
          {user && (
            <div className="flex items-center gap-2 pl-3" style={{ borderLeft: '1px solid rgba(255,255,255,0.07)' }}>
              <span className="text-xs text-[#52525b]">{user.email}</span>
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

      {/* Subtle radial glow behind content */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(99,102,241,0.07) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 w-full max-w-xl mx-auto flex-1 flex flex-col items-center justify-center p-6">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 mb-5">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-3">
            VerdictX
          </h1>
          <p className="text-[#71717a] text-sm max-w-sm mx-auto leading-relaxed">
            Paste an algorithmic denial. Five AI agents will challenge it in parallel.
            If the institution's defense concedes 2+ arguments, VerdictX fires.
          </p>
        </div>

        {/* How it works */}
        <div className="grid grid-cols-3 gap-2.5 mb-7">
          {[
            { step: '01', label: 'Paste denial', sub: 'loan · insurance · housing' },
            { step: '02', label: 'Agents debate', sub: 'bias · precedent · law' },
            { step: '03', label: 'VerdictX fires', sub: '2+ concessions trigger' },
          ].map((item) => (
            <div
              key={item.step}
              className="rounded-xl p-4 border"
              style={{ background: '#111113', borderColor: 'rgba(255,255,255,0.07)' }}
            >
              <div className="text-[10px] font-bold text-[#6366f1] uppercase tracking-widest mb-2">{item.step}</div>
              <div className="text-white text-xs font-semibold mb-1">{item.label}</div>
              <div className="text-[#52525b] text-[11px] leading-snug">{item.sub}</div>
            </div>
          ))}
        </div>

        {/* Input card */}
        <div
          className="rounded-2xl border p-5"
          style={{ background: '#111113', borderColor: 'rgba(255,255,255,0.08)' }}
        >
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider">
              Denial Letter
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onTextChange(SAMPLE_DENIAL_STRONG)}
                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
              >
                Strong case
              </button>
              <span className="text-[#3f3f46] text-xs">·</span>
              <button
                onClick={() => onTextChange(SAMPLE_DENIAL_WEAK)}
                className="text-xs text-[#52525b] hover:text-[#71717a] transition-colors font-medium"
              >
                Weak case
              </button>
            </div>
          </div>
          <textarea
            value={denialText}
            onChange={(e) => onTextChange(e.target.value)}
            placeholder="Paste the denial letter here..."
            rows={9}
            className="w-full rounded-xl p-4 text-sm text-[#e4e4e7] placeholder-[#3f3f46] resize-none focus:outline-none transition-colors leading-relaxed font-sans"
            style={{
              background: '#0a0a0b',
              border: '1px solid rgba(255,255,255,0.07)',
            }}
            onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.5)'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.07)'}
          />
          <button
            onClick={onSubmit}
            disabled={!denialText.trim()}
            className="mt-4 w-full py-3.5 rounded-xl font-semibold text-sm tracking-wide transition-all text-white
              disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' }}
            onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.background = 'linear-gradient(135deg, #818cf8 0%, #6366f1 100%)'; }}
            onMouseLeave={e => { if (!e.currentTarget.disabled) e.currentTarget.style.background = 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)'; }}
          >
            Initiate VerdictX
          </button>
        </div>

        <div className="flex items-center justify-center gap-4 mt-5">
          <p className="text-[#3f3f46] text-xs">
            Powered by IBM watsonx Orchestrate — 8 AI agents
          </p>
          <span className="text-[#3f3f46] text-xs">·</span>
          <button
            onClick={onShowImpact}
            className="text-xs text-indigo-500 hover:text-indigo-400 transition-colors font-medium"
          >
            Why this matters →
          </button>
        </div>
      </div>
      <div className="fixed bottom-0 left-0 right-0 z-10">
        <Footer onShowImpact={onShowImpact} />
      </div>
    </div>
  );
}
