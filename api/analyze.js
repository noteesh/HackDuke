// Vercel serverless function — mirrors backend/index.js logic
// All mock data is inlined here so this function is self-contained

// ─── Mock data ────────────────────────────────────────────────────────────────

function parseDenialLetter(text) {
  const lower = text.toLowerCase();

  let type = 'other';
  if (lower.includes('loan')) type = 'loan';
  else if (lower.includes('insurance')) type = 'insurance';
  else if (lower.includes('housing') || lower.includes('rent') || lower.includes('apartment')) type = 'housing';
  else if (lower.includes('benefit') || lower.includes('assistance')) type = 'benefits';

  const institutionMatch = text.match(/[-–]\s*([A-Z][A-Za-z\s]+(?:Financial|Bank|Insurance|Services|Corp|LLC|Inc))/);
  const institution = institutionMatch ? institutionMatch[1].trim() : 'Unknown Institution';

  const amountMatch = text.match(/\$[\d,]+/);
  const amount = amountMatch ? amountMatch[0] : null;

  const reasons = [];
  const primaryMatch = text.match(/[Pp]rimary reason[:\s]+([^\n.]+)/);
  const secondaryMatch = text.match(/[Ss]econdary reason[:\s]+([^\n.]+)/);
  if (primaryMatch) reasons.push(primaryMatch[1].trim());
  if (secondaryMatch) reasons.push(secondaryMatch[1].trim());

  const dateMatch = text.match(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}/);

  return {
    denial_type: type,
    institution,
    amount: amount || 'Not specified',
    primary_reason: reasons[0] || 'Not specified',
    secondary_reason: reasons[1] || 'Not specified',
    date: dateMatch ? dateMatch[0] : 'Not specified',
    automated: lower.includes('automated') ? 'Yes — automated system' : 'Unknown',
  };
}

const MOCK_RESPONSES = {
  denial_defender: `The denial of this personal loan application was fully justified under AutoLend Financial's published underwriting criteria and standard industry practice.

PRIMARY DENIAL BASIS — INSUFFICIENT CREDIT HISTORY:
The applicant's credit file reflects insufficient depth of credit history. Industry-standard underwriting, as codified in Fannie Mae guidelines and FICO scoring methodology, requires a minimum of 24 months of active trade lines before approving unsecured personal credit. An applicant with no installment loan history presents a risk profile that cannot be accurately assessed by actuarial models — the institution has no behavioral data on which to base a lending decision.

SECONDARY DENIAL BASIS — DEBT-TO-INCOME RATIO:
The applicant's debt-to-income ratio exceeded the institution's maximum threshold of 43%, a figure consistent with Qualified Mortgage standards applied by analogy to personal lending. This is not an arbitrary number — it reflects decades of empirical data on default rates at various DTI levels.

NON-DISCRIMINATION:
The denial criteria are applied uniformly across all applicants regardless of protected class status. The scoring model does not incorporate race, national origin, sex, religion, or any other protected characteristic. The denial was automated, consistent, and procedurally correct.

This denial is defensible on its merits. There is no basis for regulatory complaint or appeal.`,

  bias_auditor: `DISCRIMINATION RISK LEVEL: MEDIUM-HIGH

SIGNALS IDENTIFIED:

1. ZIP CODE PROXY DISCRIMINATION
"Insufficient credit history" as a primary denial reason disproportionately impacts residents of historically redlined neighborhoods where formal banking access was systematically denied for generations. Thin-file applicants are statistically concentrated in Black and Hispanic communities — not because of financial behavior, but because of decades of deliberate exclusion from formal credit systems. AutoLend Financial's geographic denial distribution warrants examination under the Fair Housing Act.

2. INCOME TYPE ALGORITHMIC EXCLUSION
Standard debt-to-income ratio calculations exclude gig economy income, cash wages, informal employment, and government transfer payments — income types disproportionately received by Black, Hispanic, and immigrant workers. The CFPB Market Monitor Report (2022) documents this pattern: DTI-based screening creates statistically significant disparate impact on these populations even when individual income levels are comparable to approved applicants.

3. ADVERSE ACTION NOTICE OPACITY
The denial notice references only "our automated review system" without specific score factors as required by ECOA § 701(d) and Regulation B. This opacity is itself a discriminatory practice when it prevents targeted demographic groups from understanding, contesting, or correcting the factors used against them.

4. ALGORITHMIC TRAINING DATA BIAS
Automated underwriting systems trained on historical approval data will encode historical discrimination. If AutoLend Financial's model was trained on data from an era of discriminatory lending, it will perpetuate those patterns without any individual actor intending discrimination.

LEGAL BASIS: Equal Credit Opportunity Act (15 U.S.C. § 1691), Regulation B (12 C.F.R. § 202), Fair Housing Act § 3604(b), CFPB Circular 2022-03.`,

  precedent_agent: `APPLICABLE PRECEDENTS AND REGULATORY GUIDANCE:

1. CFPB v. Opportunity Financial, LLC (2022)
The CFPB found that automated underwriting systems using "credit history depth" as a primary denial factor, without accounting for alternative credit data, constituted disparate impact discrimination. The CFPB specifically noted that thin-file denials functioned as a proxy for race given documented historical exclusion from formal credit markets. Settlement: $9 million in consumer relief. This precedent directly parallels the instant denial.

2. Ramirez v. TransUnion LLC, 594 U.S. ___ (2021)
The Supreme Court established that algorithmic credit decisions must be traceable, auditable, and challengeable. Black-box automated systems that cannot explain specific methodology to affected consumers create standing for FCRA claims. AutoLend Financial's "automated review system" language is precisely the kind of opaque reference this decision flagged.

3. HUD Algorithmic Fairness Guidance (2023)
The Department of Housing and Urban Development's formal guidance explicitly states: "Automated systems are not neutral — they encode historical discrimination if trained on historically biased data." Institutions must demonstrate algorithmic fairness testing and cannot rely on automation as a defense against discrimination claims.

4. CFPB Circular 2022-03 — Adverse Action Notice Requirements
Creditors cannot simply cite "automated system" as an adverse action reason. Specific factors must be disclosed. AutoLend Financial's notice appears to violate this circular directly — a regulatory enforcement risk the institution should not ignore.

5. Consumer Financial Protection Bureau Supervisory Highlights (2023)
CFPB examiners found institutions in violation when adverse action notices referenced generic algorithmic outputs without specific score factor disclosure. Corrective actions included re-notification of all affected consumers.

CONCLUSION: The precedent is clear and recent. Automated denials citing vague algorithmic outputs without specific factor disclosure are routinely overturned on regulatory grounds.`,

  circumstance_agent: `WHAT THE ALGORITHM STRUCTURALLY CANNOT SEE:

This applicant represents exactly the profile that algorithmic scoring systematically fails — not because they are a bad risk, but because the training data has no category for their experience.

1. THIN FILE ≠ BAD CREDIT — THE FUNDAMENTAL FLAW
"Insufficient credit history" means the applicant has never needed debt — they pay rent on time, utilities on time, and live within their means without borrowing. The algorithm scores the absence of debt as equivalent to a history of bad debt. This is not a neutral actuarial judgment; it is a structural punishment for financial prudence. An applicant who has never missed a payment and never borrowed is being denied the same treatment as someone who has defaulted.

2. DTI CALCULATION BLIND SPOTS
Standard DTI calculations structurally exclude: (a) informal income sources including family support and roommate contributions, (b) seasonal employment patterns where current period income understates annual capacity, (c) recent income increases not yet reflected in tax documentation, (d) upcoming debt payoffs within 30-60 days that would substantially reduce the ratio. A $5,000 loan on the cusp of DTI threshold may reflect a momentary snapshot, not a sustained condition.

3. LOAN PURPOSE CONTEXT — IGNORED BY DESIGN
This is a $5,000 personal loan — a relatively small amount. If the purpose is debt consolidation, approval would improve the applicant's DTI, not worsen it. If the purpose is emergency medical or car repair, denial creates larger financial downstream damage. The algorithm treats loan purpose as irrelevant to risk assessment, which is demonstrably incorrect actuarially.

4. TEMPORAL AND LIFE CIRCUMSTANCE FACTORS
Credit history is a backward-looking metric that penalizes: recent immigrants (who may have excellent credit in their home country), recent college graduates entering formal employment, individuals who recently escaped abusive financial situations, and anyone who recently transitioned from cash-based economic participation. These are not risky borrowers — they are people the algorithm has no language to describe.

A human underwriter seeing this full picture would weigh these factors. The algorithm cannot.`,

  legal_agent: `LEGAL VIOLATIONS IDENTIFIED — SEVERITY ASSESSMENT:

SEVERITY: HIGH ⚠️
VIOLATION 1: ECOA ADVERSE ACTION NOTICE DEFICIENCY
Statutory basis: 15 U.S.C. § 1691(d); Regulation B, 12 C.F.R. § 202.9(a)(2)
The denial letter states only that the decision was made by "our automated review system." This is not a specific reason as required by federal law. Regulation B § 202.9(a)(2) requires creditors to disclose "the specific reasons for the action taken" — not a generic reference to a system. CFPB guidance (2022-03) explicitly states that algorithmic outputs must still be translated into specific human-readable factors. VIOLATION CONFIRMED.

SEVERITY: HIGH ⚠️
VIOLATION 2: FCRA § 615 ADVERSE ACTION NOTICE FAILURE
Statutory basis: 15 U.S.C. § 1681m(a)
When a consumer report is used in whole or in part in a credit decision, the creditor must provide: (1) notice that a consumer report was used; (2) the name, address, and telephone number of the consumer reporting agency; (3) the consumer's right to obtain a free copy within 60 days; (4) the consumer's right to dispute accuracy. The denial letter contains none of these disclosures. Given that "insufficient credit history" was the stated primary denial factor, credit bureau data was almost certainly accessed. VIOLATION CONFIRMED.

SEVERITY: MEDIUM
VIOLATION 3: STATE UDAP EXPOSURE
Most states have Unfair, Deceptive, or Abusive Acts or Practices (UDAP) statutes that apply to automated credit decisions. Several states (California, New York, Illinois) have enacted or are enacting algorithmic accountability requirements that may impose additional disclosure obligations beyond federal minimums.

SEVERITY: MEDIUM
VIOLATION 4: EMERGING ALGORITHMIC ACCOUNTABILITY
CFPB 2023 supervisory guidance establishes that institutions using automated decisioning for credit must be able to explain specific factors to affected consumers. Inability to produce a meaningful, specific explanation creates regulatory exposure.

BOTTOM LINE: Violations 1 and 2 are independently sufficient for regulatory complaint and legal challenge.`,
};

function getMockRebuttalSections() {
  return [
    {
      agentId: 'bias_auditor',
      result: 'CONCEDED',
      text: `BIAS AUDITOR — CONCEDED

I have reviewed the Bias Auditor's challenge carefully and I must concede on the adverse action notice deficiency. The Bias Auditor correctly identifies that our denial notice references only "automated review system" without the specific score factors required by ECOA § 701(d) and Regulation B § 202.9(a)(2).

While I maintain that the substantive denial criteria are non-discriminatory and uniformly applied, I cannot defend the procedural failure in the notice. The disclosure requirement exists precisely to allow applicants to understand and contest adverse decisions — and our notice fails to provide that. I cannot argue that "automated review system" satisfies the specificity requirement that federal regulation demands.

On the disparate impact arguments: while I dispute that a single application proves systemic bias, the adverse action notice deficiency is a standalone legal vulnerability I must acknowledge. This is a conceded point.`,
    },
    {
      agentId: 'precedent_agent',
      result: 'REBUTTED',
      text: `PRECEDENT AGENT — REBUTTED

The cited precedents are distinguishable on their facts and do not compel reversal here.

CFPB v. Opportunity Financial involved documented systemic disparate impact across thousands of applications supported by statistical analysis — not a single applicant's case. A single denial cannot establish the pattern of disparate impact that regulatory enforcement requires.

Ramirez v. TransUnion addressed consumer reporting agency obligations under FCRA — specifically a CRA's duties when furnishing reports — not creditor underwriting decisions. The case does not establish that creditors must provide detailed algorithmic methodology to denied applicants.

The HUD algorithmic guidance is advisory, not binding regulation with enforcement teeth on personal lending decisions of this type.

Our underwriting criteria are applied uniformly and based on industry-standard thresholds. The Precedent Agent has not identified a case where a single applicant with these specific credit profile characteristics successfully overturned a denial on substantive (non-procedural) grounds. Rebuttal stands.`,
    },
    {
      agentId: 'circumstance_agent',
      result: 'REBUTTED',
      text: `CIRCUMSTANCE AGENT — REBUTTED

The Circumstance Agent raises sympathetic points but does not identify a legal obligation we violated.

Lenders are permitted — indeed required by prudent banking and fiduciary principles — to assess credit risk based on documented, verifiable history. We are not required under any federal statute to speculate about undocumented informal income, hypothetical cash-based payment patterns the applicant chose not to formalize, or predicted future financial behavior.

The argument that thin file equals creditworthiness is policy advocacy. It may reflect good social policy worth debating in Congress, but it does not describe our current legal obligations. We apply objective, documented criteria consistently.

The Circumstance Agent identifies no specific statutory violation — only a disagreement with our underwriting criteria. Disagreement with criteria is not a legal claim. We are entitled to set our own underwriting standards within the bounds of anti-discrimination law. Rebuttal stands.`,
    },
    {
      agentId: 'legal_agent',
      result: 'CONCEDED',
      text: `LEGAL AGENT — CONCEDED

I cannot rebut the FCRA § 615(a) adverse action notice violation. This is a material procedural failure I must acknowledge.

The Legal Agent correctly identifies that 15 U.S.C. § 1681m(a) imposes mandatory disclosure obligations when an adverse action is taken based in whole or in part on a consumer report. Our automated underwriting system accesses credit bureau data to assess credit history — that is precisely what "insufficient credit history" as a denial factor means. We accessed a consumer report.

When we did so and then took adverse action, we were required to provide the applicant with: the name, address, and telephone number of the consumer reporting agency; notice that a free copy of the report is available within 60 days; and notice of the right to dispute inaccurate information. Our denial letter contains none of these disclosures.

I cannot construct a defense against a mandatory statutory requirement that we simply did not follow. This is a confirmed violation of federal law. Conceded.`,
    },
  ];
}

function getMockAppealLetter(concededAgents) {
  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  return `${today}

AutoLend Financial
Compliance and Legal Appeals Department

RE: FORMAL LEGAL APPEAL — Personal Loan Application Denial
GROUNDS: Procedural Violations Conceded by Institution's Own Defense Counsel

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Dear AutoLend Financial Compliance Officer:

This letter constitutes a formal legal appeal of the recent denial of a personal loan application. This appeal is predicated exclusively on arguments that your institution's own legal defense was unable to rebut — representing conceded vulnerabilities that your defense counsel acknowledged on the record.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
I. ADVERSE ACTION NOTICE VIOLATION (CONCEDED BY DEFENSE)
Equal Credit Opportunity Act, 15 U.S.C. § 1691(d)
Regulation B, 12 C.F.R. § 202.9(a)(2)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Your denial notice fails to provide specific reasons for the adverse action as required by federal law. Your institution's own defense counsel conceded this point.

REMEDY DEMANDED: Issue a corrected adverse action notice within 10 business days.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
II. FAIR CREDIT REPORTING ACT VIOLATION (CONCEDED BY DEFENSE)
15 U.S.C. § 1681m(a) — Mandatory Adverse Action Disclosures
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Your denial letter fails to comply with FCRA § 615(a). Your institution's own defense counsel conceded: "I cannot construct a defense against a mandatory statutory requirement that we simply did not follow."

REMEDY DEMANDED: Full reconsideration with human underwriting review.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
III. DEMANDS AND RESPONSE DEADLINE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

We demand the following remedies within 30 DAYS of receipt of this letter.

Failure to respond will result in filing with CFPB, FTC, and State Banking regulators, and civil litigation under 15 U.S.C. § 1691e and § 1681n.

Respectfully submitted,

[APPLICANT NAME]
[ADDRESS]
[PHONE / EMAIL]
${today}`;
}

// ─── SSE helpers ──────────────────────────────────────────────────────────────

function send(res, event, data) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function streamAgentsParallel(res, agentEntries) {
  const streams = agentEntries.map(({ agentId, text }) => ({
    agentId,
    words: text.split(/(\s+)/),
    index: 0,
  }));

  for (const s of streams) {
    send(res, 'agent_start', { agentId: s.agentId });
  }

  let anyActive = true;
  while (anyActive) {
    anyActive = false;
    for (const s of streams) {
      if (s.index < s.words.length) {
        anyActive = true;
        const token = s.words[s.index++];
        send(res, 'agent_chunk', { agentId: s.agentId, chunk: token });
      }
    }
    await sleep(18);
  }

  for (const s of streams) {
    send(res, 'agent_complete', { agentId: s.agentId });
  }
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { denialText } = req.body || {};

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  try {
    await sleep(300);
    const parsed = parseDenialLetter(denialText || '');
    send(res, 'parsed', parsed);
    await sleep(400);

    const agentEntries = [
      { agentId: 'denial_defender', text: MOCK_RESPONSES.denial_defender },
      { agentId: 'bias_auditor', text: MOCK_RESPONSES.bias_auditor },
      { agentId: 'precedent_agent', text: MOCK_RESPONSES.precedent_agent },
      { agentId: 'circumstance_agent', text: MOCK_RESPONSES.circumstance_agent },
      { agentId: 'legal_agent', text: MOCK_RESPONSES.legal_agent },
    ];

    await streamAgentsParallel(res, agentEntries);
    await sleep(600);

    send(res, 'rebuttal_start', {});
    await sleep(400);

    const sections = getMockRebuttalSections();
    const concededAgents = [];

    for (const section of sections) {
      send(res, 'rebuttal_section_start', { agentId: section.agentId });
      const words = section.text.split(/(\s+)/);
      for (const word of words) {
        send(res, 'rebuttal_chunk', { agentId: section.agentId, chunk: word });
        await sleep(22);
      }
      send(res, 'rebuttal_result', { agentId: section.agentId, result: section.result });
      if (section.result === 'CONCEDED') concededAgents.push(section.agentId);
      await sleep(300);
    }

    await sleep(400);
    const triggered = concededAgents.length >= 2;
    send(res, 'override_result', { triggered, concessions: concededAgents.length, concededAgents });

    if (triggered) {
      await sleep(700);
      const letter = getMockAppealLetter(concededAgents);
      const words = letter.split(/(\s+)/);
      for (const word of words) {
        send(res, 'appeal_chunk', { chunk: word });
        await sleep(20);
      }
    }

    await sleep(200);
    send(res, 'complete', {});
    res.end();
  } catch (err) {
    console.error(err);
    send(res, 'error', { message: err.message });
    res.end();
  }
}
