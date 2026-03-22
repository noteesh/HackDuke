import { useState } from 'react';

const RACE_OPTIONS = [
  'Black/African American', 'Hispanic/Latino', 'Asian', 'White',
  'Native American', 'Pacific Islander', 'Other', 'Prefer not to say',
];
const GENDER_OPTIONS = ['Male', 'Female', 'Non-binary', 'Other', 'Prefer not to say'];
const AGE_OPTIONS = ['18-24', '25-34', '35-44', '45-54', '55-64', '65+'];
const INCOME_OPTIONS = ['<$25k', '$25k-$50k', '$50k-$75k', '$75k-$100k', '$100k+'];
const EMPLOYMENT_OPTIONS = [
  'Employed full-time', 'Employed part-time', 'Self-employed',
  'Unemployed', 'Retired', 'Student',
];
const CREDIT_OPTIONS = [
  '<580 Poor', '580-669 Fair', '670-739 Good',
  '740-799 Very Good', '800+ Exceptional', 'Unknown/Prefer not to say',
];
const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
  'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC',
];
const YES_NO_OPTIONS = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

const EMPTY_FORM = {
  raceEthnicity: [],
  gender: '',
  ageRange: '',
  incomeRange: '',
  employmentStatus: '',
  creditScoreRange: '',
  state: '',
  priorDenials: '',
  disabilityStatus: '',
  veteranStatus: '',
};

// ── Pill button ───────────────────────────────────────────────────────────────
function Pill({ label, selected, onClick, small }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 rounded-lg font-medium transition-all text-left ${small ? 'py-1 text-[11px]' : 'py-1.5 text-xs'}`}
      style={
        selected
          ? { background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.35)' }
          : { background: 'rgba(255,255,255,0.03)', color: '#71717a', border: '1px solid rgba(255,255,255,0.07)' }
      }
    >
      {label}
    </button>
  );
}

// ── Section header ────────────────────────────────────────────────────────────
function SectionLabel({ children }) {
  return (
    <p className="text-[10px] font-semibold text-[#52525b] uppercase tracking-widest mb-3 mt-6 first:mt-0">
      {children}
    </p>
  );
}

// ── Field wrapper ─────────────────────────────────────────────────────────────
function Field({ label, hint, children }) {
  return (
    <div className="mb-4">
      <p className="text-xs font-medium text-[#a1a1aa] mb-1.5">{label}</p>
      {hint && <p className="text-[11px] text-[#52525b] mb-2">{hint}</p>}
      {children}
    </div>
  );
}

export default function ProfileSurvey({ userId, initialData, onComplete, onSkip }) {
  const [formData, setFormData] = useState(() => ({
    ...EMPTY_FORM,
    ...(initialData ?? {}),
    raceEthnicity: initialData?.raceEthnicity ?? [],
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const isEdit = !!initialData;

  function setField(key, value) {
    setFormData(prev => ({ ...prev, [key]: value }));
  }

  function toggleRace(val) {
    setFormData(prev => {
      const cur = prev.raceEthnicity;
      return {
        ...prev,
        raceEthnicity: cur.includes(val) ? cur.filter(v => v !== val) : [...cur, val],
      };
    });
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/profile', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...formData }),
      });
      if (res.ok) {
        const saved = await res.json();
        onComplete(saved);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Failed to save. Please try again.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-8 px-4"
      style={{ background: '#0a0a0b' }}
    >
      <div className="w-full max-w-xl">

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <span className="text-base font-semibold text-white">
                {isEdit ? 'Edit Your Profile' : 'Set Up Your Profile'}
              </span>
            </div>
            <p className="text-xs text-[#52525b] leading-relaxed max-w-sm">
              {isEdit
                ? 'Update your details — agents use this to find bias specific to your situation.'
                : 'This helps AI agents identify bias and discrimination specific to your situation. All fields are optional.'}
            </p>
          </div>
          {onSkip && (
            <button
              onClick={onSkip}
              className="text-xs text-[#3f3f46] hover:text-[#71717a] transition-colors flex-shrink-0 ml-4 mt-1"
            >
              Skip for now
            </button>
          )}
        </div>

        {/* Form card */}
        <div
          className="rounded-2xl p-6"
          style={{ background: '#111113', border: '1px solid rgba(255,255,255,0.07)' }}
        >

          {/* ── Section 1: About You ── */}
          <SectionLabel>About You</SectionLabel>

          <Field label="Race / Ethnicity" hint="Select all that apply">
            <div className="flex flex-wrap gap-2">
              {RACE_OPTIONS.map(opt => (
                <Pill
                  key={opt}
                  label={opt}
                  selected={formData.raceEthnicity.includes(opt)}
                  onClick={() => toggleRace(opt)}
                />
              ))}
            </div>
          </Field>

          <Field label="Gender">
            <div className="flex flex-wrap gap-2">
              {GENDER_OPTIONS.map(opt => (
                <Pill key={opt} label={opt} selected={formData.gender === opt} onClick={() => setField('gender', opt)} />
              ))}
            </div>
          </Field>

          <Field label="Age Range">
            <div className="flex flex-wrap gap-2">
              {AGE_OPTIONS.map(opt => (
                <Pill key={opt} label={opt} selected={formData.ageRange === opt} onClick={() => setField('ageRange', opt)} />
              ))}
            </div>
          </Field>

          {/* ── Section 2: Financial Context ── */}
          <SectionLabel>Financial Context</SectionLabel>

          <Field label="Annual Income Range">
            <div className="flex flex-wrap gap-2">
              {INCOME_OPTIONS.map(opt => (
                <Pill key={opt} label={opt} selected={formData.incomeRange === opt} onClick={() => setField('incomeRange', opt)} />
              ))}
            </div>
          </Field>

          <Field label="Employment Status">
            <div className="flex flex-wrap gap-2">
              {EMPLOYMENT_OPTIONS.map(opt => (
                <Pill key={opt} label={opt} selected={formData.employmentStatus === opt} onClick={() => setField('employmentStatus', opt)} />
              ))}
            </div>
          </Field>

          <Field label="Credit Score Range">
            <div className="flex flex-wrap gap-2">
              {CREDIT_OPTIONS.map(opt => (
                <Pill key={opt} label={opt} selected={formData.creditScoreRange === opt} onClick={() => setField('creditScoreRange', opt)} />
              ))}
            </div>
          </Field>

          {/* ── Section 3: Additional Context ── */}
          <SectionLabel>Additional Context</SectionLabel>

          <Field label="State of Residence">
            <div className="flex flex-wrap gap-1.5">
              {US_STATES.map(s => (
                <Pill key={s} label={s} small selected={formData.state === s} onClick={() => setField('state', s)} />
              ))}
            </div>
          </Field>

          <Field label="Prior denials in the last 2 years?">
            <div className="flex gap-2">
              {YES_NO_OPTIONS.map(({ value, label }) => (
                <Pill key={value} label={label} selected={formData.priorDenials === value} onClick={() => setField('priorDenials', value)} />
              ))}
            </div>
          </Field>

          <Field label="Disability Status">
            <div className="flex gap-2">
              {YES_NO_OPTIONS.map(({ value, label }) => (
                <Pill key={value} label={label} selected={formData.disabilityStatus === value} onClick={() => setField('disabilityStatus', value)} />
              ))}
            </div>
          </Field>

          <Field label="Veteran Status">
            <div className="flex gap-2">
              {YES_NO_OPTIONS.map(({ value, label }) => (
                <Pill key={value} label={label} selected={formData.veteranStatus === value} onClick={() => setField('veteranStatus', value)} />
              ))}
            </div>
          </Field>

          {/* Error */}
          {error && (
            <div className="mt-4 px-4 py-3 rounded-lg text-xs"
              style={{ background: 'rgba(239,68,68,0.08)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.2)' }}>
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between mt-6 pt-5"
            style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-[11px] text-[#3f3f46]">
              Stored privately — only used to improve AI analysis
            </p>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white transition-all"
              style={{
                background: saving ? 'rgba(99,102,241,0.4)' : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                border: '1px solid rgba(99,102,241,0.3)',
                cursor: saving ? 'not-allowed' : 'pointer',
              }}
            >
              {saving ? (
                <>
                  <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  Saving…
                </>
              ) : isEdit ? 'Save Changes' : 'Save Profile'}
            </button>
          </div>
        </div>

        {/* Privacy note */}
        <p className="text-center text-[11px] text-[#3f3f46] mt-4">
          Your data is stored securely and never shared. You can update this anytime from the dashboard.
        </p>
      </div>
    </div>
  );
}
