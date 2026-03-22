const HERO_STATS = [
  { value: '80%',   label: 'more likely to be denied a mortgage', sub: 'Black applicants vs. white — controlling for 17 risk factors' },
  { value: '$700M', label: 'secured by EEOC for bias victims',    sub: 'FY 2024 — a single-year record' },
  { value: '90%',   label: 'error rate on AI health denials',     sub: '9 out of 10 reversed on appeal — 0.2% ever appeal' },
  { value: '60%',   label: 'of victims never notice',            sub: 'People trust automated systems more than human reviewers' },
];

const CATEGORIES = [
  {
    title: 'Mortgage & Lending',
    icon: '🏠',
    stat: '80% more likely denied',
    statColor: '#fb7185',
    finding: 'Controlling for 17 risk factors, Black applicants are 80% more likely to be denied a mortgage than comparable white applicants. Minority borrowers pay approximately $450 million per year in extra interest — a structural racial tax encoded into the algorithm.',
    links: [
      { label: 'Georgetown Poverty Journal', url: 'https://www.law.georgetown.edu/poverty-journal/blog/the-discriminatory-impacts-of-ai-powered-tenant-screening-programs/' },
      { label: 'Quinn Emanuel: AI Bias Lawsuits', url: 'https://www.quinnemanuel.com/the-firm/publications/when-machines-discriminate-the-rise-of-ai-bias-lawsuits/' },
    ],
  },
  {
    title: 'Health Insurance Denials',
    icon: '🏥',
    stat: '90% error rate',
    statColor: '#fb7185',
    finding: 'The "nH Predict" algorithm reportedly has a 90% error rate — meaning nine out of ten denials are reversed on appeal. Yet only 0.2% of patients file an appeal. Some insurers use "the dial" to adjust thresholds that automatically trigger more denials.',
    links: [
      { label: 'The Guardian: AI Health Insurers', url: 'https://www.theguardian.com/us-news/2025/jan/25/health-insurers-ai' },
      { label: 'ProPublica: Prior Authorizations', url: 'https://www.propublica.org/article/evicore-health-insurance-denials-cigna-unitedhealthcare-aetna-prior-authorizations' },
    ],
  },
  {
    title: 'Auto Insurance',
    icon: '🚗',
    stat: '70% higher premiums',
    statColor: '#fbbf24',
    finding: 'Premiums in predominantly Black ZIP codes average 70% higher than in predominantly white areas — regardless of individual driving records. In Washington D.C., researchers found an unexplained $271 premium gap between Black and white drivers after controlling for claims history.',
    links: [
      { label: 'Insurance Journal', url: 'https://www.insurancejournal.com/news/east/2024/11/21/802047.htm' },
      { label: 'Consumer Federation Report', url: 'https://consumerfed.org/press_release/landmark-washington-report-on-unintentional-bias-finds-racial-premium-gap-in-auto-insurance-pricing-in-washington-d-c/' },
    ],
  },
  {
    title: 'Unemployment Benefits',
    icon: '📋',
    stat: '24% less likely to receive',
    statColor: '#fbbf24',
    finding: 'Black workers are 24% less likely to receive unemployment benefits than white workers who lost their jobs under identical conditions. Black claimants also receive an 18% lower replacement rate due to work-history requirements and stricter rules in states with large Black populations.',
    links: [
      { label: 'CBC Finance: Unemployment Gaps', url: 'https://www.cbcfinc.org/capstones/economic-opportunity/a-net-with-gapping-holes-unemployment-insurance-and-racial-inequality/' },
      { label: 'NBER Working Paper', url: 'https://www.nber.org/system/files/working_papers/w30252/w30252.pdf' },
    ],
  },
  {
    title: 'Housing & Rental',
    icon: '🏢',
    stat: '22% false records used',
    statColor: '#fbbf24',
    finding: 'Approximately 22% of state eviction records used in algorithmic tenant screening are estimated to be false or ambiguous. Automated tools routinely fail to distinguish between dismissed charges and actual convictions — disproportionately harming Black and Latino renters.',
    links: [
      { label: 'NCLC: Digital Denials Report', url: 'https://www.nclc.org/wp-content/uploads/2023/09/202309_Report_Digital-Denials.pdf' },
      { label: 'HUD Fair Housing AI Guidance', url: 'https://www.cohnreznick.com/insights/hud-offers-fair-housing-act-guidance-on-ai-applications' },
    ],
  },
  {
    title: 'Government Benefits',
    icon: '🏛️',
    stat: '21.5% vs 16.4% disenrolled',
    statColor: '#fbbf24',
    finding: 'During the 2023 Medicaid unwinding, disenrollment rates were significantly higher for Asian (24.2%), Black (21.5%), and Hispanic (21.4%) adults than for white adults (16.4%). "Level of Care" algorithms often function as budgetary tools to restrict access rather than clinical needs.',
    links: [
      { label: 'PMC: Medicaid Unwinding', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11803064/' },
    ],
  },
  {
    title: 'Employment & Hiring',
    icon: '💼',
    stat: '$700M secured in FY2024',
    statColor: '#fb7185',
    finding: 'EEOC filed 111 lawsuits in FY2024, securing a record $700 million for discrimination victims. High-profile cases challenge AI hiring tools programmed to auto-reject older applicants — one case resulted in a $365,000 settlement for over 200 rejected tutors.',
    links: [
      { label: 'EEOC 2024 Annual Report', url: 'https://www.eeoc.gov/2024-annual-performance-report' },
      { label: 'Quinn Emanuel: AI Bias Lawsuits', url: 'https://www.quinnemanuel.com/the-firm/publications/when-machines-discriminate-the-rise-of-ai-bias-lawsuits/' },
    ],
  },
  {
    title: 'Credit & Fintech',
    icon: '💳',
    stat: '50% of loans via fintech',
    statColor: '#818cf8',
    finding: 'Fintech now controls roughly 50% of the personal loan market. Black and low-income individuals receive lower credit scores even when they have no future delinquencies — structural racism in credit history length continues to suppress wealth-building for Black and Latinx borrowers.',
    links: [
      { label: 'FinWise: 2025 Lending Trends', url: 'https://www.finwise.bank/news/fintech/2025-lending-trends-automation-embedded-finance-economic-shifts/' },
      { label: 'Opportunity Insights Paper', url: 'https://opportunityinsights.org/wp-content/uploads/2025/07/CreditAccess_Paper.pdf' },
    ],
  },
  {
    title: 'Scale & Awareness',
    icon: '📊',
    stat: '85% of banks use AI',
    statColor: '#818cf8',
    finding: 'Approximately 85% of global banks now use AI to automate lending decisions. Research suggests roughly 60% of people affected by algorithmic bias do not notice it — often because individuals trust automated systems more than human decision-makers, creating a systemic "bias blind spot."',
    links: [
      { label: 'HES FinTech: AI Lending Trends', url: 'https://hesfintech.com/blog/all-legislative-trends-regulating-ai-in-lending/' },
      { label: 'PMC: Bias Blind Spot', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11420529/' },
    ],
  },
];

import Footer from './Footer.jsx';

function CategoryCard({ cat }) {
  return (
    <div
      className="rounded-xl overflow-hidden flex flex-col"
      style={{ background: '#111113', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      {/* Card header */}
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#18181b' }}
      >
        <div className="flex items-center gap-2.5">
          <span className="text-base">{cat.icon}</span>
          <span className="text-sm font-semibold text-white">{cat.title}</span>
        </div>
        <span
          className="text-[11px] font-bold px-2.5 py-0.5 rounded-full"
          style={{ color: cat.statColor, background: `${cat.statColor}18`, border: `1px solid ${cat.statColor}33` }}
        >
          {cat.stat}
        </span>
      </div>

      {/* Finding */}
      <div className="px-4 py-3 flex-1">
        <p className="text-xs text-[#a1a1aa] leading-relaxed">{cat.finding}</p>
      </div>

      {/* Sources */}
      <div className="px-4 pb-3 flex flex-wrap gap-2">
        {cat.links.map((l) => (
          <a
            key={l.url}
            href={l.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-[#52525b] hover:text-[#818cf8] transition-colors underline underline-offset-2"
          >
            {l.label}
          </a>
        ))}
      </div>
    </div>
  );
}

export default function ImpactPage({ onBack }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0a0a0b', color: '#f4f4f5' }}>
      {/* Top bar */}
      <div
        className="flex-shrink-0 px-5 h-12 flex items-center justify-between z-10 sticky top-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(10,10,11,0.97)', backdropFilter: 'blur(8px)' }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center justify-center w-7 h-7 rounded-lg transition-colors text-[#52525b] hover:text-[#a1a1aa]"
            style={{ background: 'rgba(255,255,255,0.05)' }}
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
            <span className="text-[#3f3f46] text-xs hidden sm:block">/ why this matters</span>
          </div>
        </div>
        <button
          onClick={onBack}
          className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
          style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.22)' }}
        >
          ← Back to tool
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-10 space-y-10">

          {/* Hero */}
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <div
              className="inline-block text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-2"
              style={{ background: 'rgba(244,63,94,0.10)', color: '#fb7185', border: '1px solid rgba(244,63,94,0.22)' }}
            >
              Research Summary · 2024–2025
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight leading-snug">
              Algorithmic discrimination affects<br />millions of Americans — invisibly.
            </h1>
            <p className="text-sm text-[#71717a] leading-relaxed">
              Automated systems now make or influence decisions on loans, insurance, housing, healthcare, and employment.
              Across every domain, the data shows the same pattern: minority applicants are denied more often,
              charged more, and have less recourse — with no human ever reviewing the decision.
            </p>
          </div>

          {/* Hero stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {HERO_STATS.map((s) => (
              <div
                key={s.value}
                className="rounded-xl p-4 text-center"
                style={{ background: '#18181b', border: '1px solid rgba(244,63,94,0.15)' }}
              >
                <div className="text-2xl font-black text-white mb-1" style={{ color: '#fb7185' }}>{s.value}</div>
                <div className="text-xs font-semibold text-[#e4e4e7] leading-snug mb-1">{s.label}</div>
                <div className="text-[10px] text-[#52525b] leading-snug">{s.sub}</div>
              </div>
            ))}
          </div>

          {/* Section heading */}
          <div className="flex items-center gap-3">
            <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.07)' }} />
            <p className="text-[10px] font-semibold text-[#52525b] uppercase tracking-widest">By sector</p>
            <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.07)' }} />
          </div>

          {/* Category grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {CATEGORIES.map((cat) => (
              <CategoryCard key={cat.title} cat={cat} />
            ))}
          </div>

          {/* Bottom CTA */}
          <div
            className="rounded-2xl p-6 text-center"
            style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.18)' }}
          >
            <p className="text-white font-semibold mb-1">You were denied. The algorithm won't explain itself.</p>
            <p className="text-sm text-[#71717a] mb-4 max-w-xl mx-auto">
              The Override uses AI to fight AI — analyzing your denial for bias, legal violations, and precedents,
              then generating a formal appeal letter if the defense can't hold.
            </p>
            <button
              onClick={onBack}
              className="px-6 py-2.5 rounded-xl font-semibold text-sm text-white transition-all"
              style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'linear-gradient(135deg, #818cf8 0%, #6366f1 100%)'}
              onMouseLeave={e => e.currentTarget.style.background = 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)'}
            >
              Try The Override →
            </button>
          </div>

        </div>
      </div>
      <Footer />
    </div>
  );
}
