// Vercel serverless function — mirrors backend/index.js exactly.
// No express/dotenv needed; Vercel injects env vars and handles HTTP natively.

const TOKEN_URL = 'https://iam.platform.saas.ibm.com/siusermgr/api/1.0/apikeys/token';
const REASONING_INSTRUCTION = '\n\nBe thorough, specific, and well-structured in your response.';

// ── IBM JWT + agent client ────────────────────────────────────────────────────

let cachedToken = null;
let tokenExpiresAt = 0;

async function getJWT() {
  const API_KEY = process.env.IBM_KEY?.trim();
  if (!API_KEY) throw new Error('Missing IBM_KEY env var');

  if (cachedToken && Date.now() < tokenExpiresAt - 60_000) return cachedToken;

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ apikey: API_KEY }),
  });

  if (!res.ok) throw new Error(`JWT exchange failed ${res.status}: ${await res.text()}`);

  const data = await res.json();
  cachedToken = data.token ?? data.access_token ?? data.jwt ?? data.id_token;
  const expiresIn = data.expires_in ?? data.expiration ?? 3600;
  tokenExpiresAt = Date.now() + expiresIn * 1000;

  if (!cachedToken) throw new Error(`JWT exchange: no token field — ${JSON.stringify(data)}`);
  return cachedToken;
}

async function invokeAgent(agentId, userMsg) {
  const BASE_URL = process.env.SERVER_INSTANCE?.trim();
  const API_KEY = process.env.IBM_KEY?.trim();

  if (!BASE_URL || !API_KEY) throw new Error('Missing SERVER_INSTANCE or IBM_KEY env var');
  if (!agentId) throw new Error('Missing agent ID');

  const jwt = await getJWT();
  const url = `${BASE_URL}/v1/orchestrate/${agentId}/chat/completions`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${jwt}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages: [{ role: 'user', content: userMsg + REASONING_INSTRUCTION }],
      stream: false,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Orchestrate API error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  const content =
    data?.choices?.[0]?.message?.content ??
    data?.output?.text ??
    data?.response ??
    JSON.stringify(data);

  return { content };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function send(res, event, data) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function tryParseJSON(content) {
  try {
    const match = content.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : null;
  } catch {
    return null;
  }
}

function parseDenialLetter(text) {
  const lower = text.toLowerCase();
  let type = 'other';
  if (lower.includes('loan')) type = 'loan';
  else if (lower.includes('insurance')) type = 'insurance';
  else if (lower.includes('housing') || lower.includes('rent') || lower.includes('apartment')) type = 'housing';
  else if (lower.includes('benefit') || lower.includes('assistance')) type = 'benefits';

  const institutionMatch = text.match(/[-–]\s*([A-Z][A-Za-z\s]+(?:Financial|Bank|Insurance|Services|Corp|LLC|Inc))/);
  const amountMatch = text.match(/\$[\d,]+/);
  const reasons = [];
  const primaryMatch = text.match(/[Pp]rimary reason[:\s]+([^\n.]+)/);
  const secondaryMatch = text.match(/[Ss]econdary reason[:\s]+([^\n.]+)/);
  if (primaryMatch) reasons.push(primaryMatch[1].trim());
  if (secondaryMatch) reasons.push(secondaryMatch[1].trim());
  const dateMatch = text.match(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}/);

  return {
    denial_type: type,
    institution: institutionMatch ? institutionMatch[1].trim() : 'Unknown Institution',
    amount: amountMatch ? amountMatch[0] : 'Not specified',
    primary_reason: reasons[0] || 'Not specified',
    secondary_reason: reasons[1] || 'Not specified',
    date: dateMatch ? dateMatch[0] : 'Not specified',
    automated: lower.includes('automated') ? 'Yes — automated system' : 'Unknown',
  };
}

function formatAgentText(agentKey, json, rawFallback) {
  if (!json) return rawFallback ?? '';
  const lines = [];

  switch (agentKey) {
    case 'bias': {
      if (json.overall_discrimination_risk) lines.push(`DISCRIMINATION RISK: ${json.overall_discrimination_risk}`);
      if (json.risk_summary) lines.push('', json.risk_summary);
      for (const f of json.findings ?? []) {
        const text = typeof f === 'string' ? f
          : [f.signal, f.protected_class ? `(${f.protected_class})` : null, f.citation ? `— ${f.citation}` : null].filter(Boolean).join(' ');
        if (text.trim()) lines.push('', `• ${text}`);
      }
      if (json.strongest_argument) lines.push('', 'KEY ARGUMENT:', json.strongest_argument);
      break;
    }
    case 'precedent': {
      const strength = json.overall_precedent_strength ?? json.overall_precedence_strength;
      if (strength) lines.push(`PRECEDENT STRENGTH: ${strength}`);
      if (json.precedent_summary) lines.push('', json.precedent_summary);
      for (const c of json.cases ?? []) {
        const name = typeof c === 'string' ? c : `${c.name ?? 'Case'}${c.citation ? ` (${c.citation})` : ''}`;
        lines.push('', `• ${name}`);
      }
      for (const e of json.enforcement_actions ?? []) {
        const name = typeof e === 'string' ? e : (e.name ?? e.title ?? '');
        if (name) lines.push(`• Enforcement: ${name}`);
      }
      if (json.strongest_precedent) lines.push('', 'STRONGEST PRECEDENT:', json.strongest_precedent);
      break;
    }
    case 'circumstance': {
      if (json.overall_circumstance_strength) lines.push(`CIRCUMSTANCE STRENGTH: ${json.overall_circumstance_strength}`);
      if (json.circumstance_summary) lines.push('', json.circumstance_summary);
      for (const e of json.alternative_credit_evidence ?? []) {
        const text = typeof e === 'string' ? e : (e.argument ?? e.description ?? '');
        if (text) lines.push('', `• ${text}`);
      }
      for (const b of json.algorithm_blind_spots ?? []) {
        const text = typeof b === 'string' ? b : (b.blind_spot ?? b.description ?? b.argument ?? b.factor ?? '');
        if (text) lines.push(`• Blind spot: ${text}`);
      }
      if (json.strongest_argument) lines.push('', 'KEY ARGUMENT:', json.strongest_argument);
      break;
    }
    case 'legal': {
      if (json.overall_legal_risk) lines.push(`LEGAL RISK: ${json.overall_legal_risk}`);
      if (json.legal_summary) lines.push('', json.legal_summary);
      for (const v of json.violations ?? []) {
        const text = typeof v === 'string' ? v
          : `${v.law ?? ''} ${v.section ?? ''}: ${v.violation ?? ''} — Severity: ${v.severity ?? 'N/A'}`;
        lines.push('', `• ${text}`);
      }
      if (json.strongest_violation) lines.push('', 'KEY VIOLATION:', json.strongest_violation);
      break;
    }
    case 'defender': {
      if (json.overall_defense_confidence) lines.push(`DEFENSE CONFIDENCE: ${json.overall_defense_confidence}`);
      const pj = json.primary_justification;
      if (pj) {
        const arg = typeof pj === 'string' ? pj : (pj.argument ?? '');
        const cite = typeof pj === 'object' ? (pj.citation ?? '') : '';
        if (arg) lines.push('', 'PRIMARY ARGUMENT:', arg);
        if (cite) lines.push(`Citation: ${cite}`);
      }
      if (json.weakest_point) lines.push('', 'WEAKEST POINT:', json.weakest_point);
      break;
    }
    default:
      return rawFallback ?? '';
  }

  return lines.join('\n').trim() || rawFallback || '';
}

async function streamAgentsParallel(res, agentEntries) {
  for (const s of agentEntries) {
    send(res, 'agent_start', { agentId: s.agentId });
  }

  const streams = agentEntries.map(({ agentId, text, data }) => ({
    agentId, data, words: text.split(/(\s+)/), index: 0,
  }));

  let anyActive = true;
  while (anyActive) {
    anyActive = false;
    for (const s of streams) {
      if (s.index < s.words.length) {
        anyActive = true;
        send(res, 'agent_chunk', { agentId: s.agentId, chunk: s.words[s.index++] });
      }
    }
    await sleep(18);
  }

  for (const s of streams) {
    send(res, 'agent_complete', { agentId: s.agentId, data: s.data ?? null });
  }
}

// ── Handler ───────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { denialText, userProfile } = req.body || {};

  function buildProfileContext(profile) {
    if (!profile) return '';
    const lines = ['\n\nAPPLICANT PROFILE (use this to identify potential bias and tailor arguments):'];
    if (profile.raceEthnicity?.length)  lines.push(`Race/Ethnicity: ${profile.raceEthnicity.join(', ')}`);
    if (profile.gender)                 lines.push(`Gender: ${profile.gender}`);
    if (profile.ageRange)               lines.push(`Age Range: ${profile.ageRange}`);
    if (profile.incomeRange)            lines.push(`Income Range: ${profile.incomeRange}`);
    if (profile.employmentStatus)       lines.push(`Employment: ${profile.employmentStatus}`);
    if (profile.creditScoreRange)       lines.push(`Credit Score Range: ${profile.creditScoreRange}`);
    if (profile.state)                  lines.push(`State: ${profile.state}`);
    if (profile.priorDenials)           lines.push(`Prior Denials (last 2 years): ${profile.priorDenials}`);
    if (profile.disabilityStatus)       lines.push(`Disability Status: ${profile.disabilityStatus}`);
    if (profile.veteranStatus)          lines.push(`Veteran Status: ${profile.veteranStatus}`);
    return lines.length > 1 ? lines.join('\n') : '';
  }

  const profileContext = buildProfileContext(userProfile);

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  const AGENTS = {
    parse:        process.env.PARSE_AGENT_ID,
    bias:         process.env.BIAS_AGENT_ID,
    precedent:    process.env.PRECEDENT_AGENT_ID,
    circumstance: process.env.CIRCUMSTANCE_AGENT_ID,
    legal:        process.env.LEGAL_AGENT_ID,
    defender:     process.env.DEFENDER_AGENT_ID,
    judge:        process.env.JUDGE_AGENT_ID,
    appeal:       process.env.APPEAL_AGENT_ID,
  };

  try {
    // ── Wave 1: Parser ───────────────────────────────────────────────────────
    let parserOutput;
    if (AGENTS.parse) {
      const { content } = await invokeAgent(AGENTS.parse, `Parse this denial letter and return structured JSON:\n\n${denialText}`);
      parserOutput = tryParseJSON(content) ?? parseDenialLetter(denialText || '');
    } else {
      parserOutput = parseDenialLetter(denialText || '');
    }

    send(res, 'parsed', parserOutput);
    await sleep(400);
    const parserJSON = JSON.stringify(parserOutput);

    // ── Wave 2: 4 Attackers in parallel ─────────────────────────────────────
    const [biasResult, precedentResult, circumstanceResult, legalResult] = await Promise.all([
      AGENTS.bias        ? invokeAgent(AGENTS.bias,         `Analyze this denial for discrimination signals: ${parserJSON}${profileContext}`) : Promise.resolve(null),
      AGENTS.precedent   ? invokeAgent(AGENTS.precedent,    `Find precedent for challenging this denial: ${parserJSON}${profileContext}`)     : Promise.resolve(null),
      AGENTS.circumstance? invokeAgent(AGENTS.circumstance, `Identify circumstance arguments for this denial: ${parserJSON}${profileContext}`) : Promise.resolve(null),
      AGENTS.legal       ? invokeAgent(AGENTS.legal,        `Identify legal violations in this denial: ${parserJSON}${profileContext}`)       : Promise.resolve(null),
    ]);

    const biasJSON         = biasResult         ? tryParseJSON(biasResult.content)         : null;
    const precedentJSON    = precedentResult    ? tryParseJSON(precedentResult.content)    : null;
    const circumstanceJSON = circumstanceResult ? tryParseJSON(circumstanceResult.content) : null;
    const legalJSON        = legalResult        ? tryParseJSON(legalResult.content)        : null;

    // ── Wave 3a: Defender initial defense ────────────────────────────────────
    let defenderWave2JSON = null;
    let defenderWave2Raw  = '';

    if (AGENTS.defender) {
      const { content } = await invokeAgent(AGENTS.defender, `Build the strongest possible defense of this denial: ${parserJSON}`);
      defenderWave2JSON = tryParseJSON(content);
      defenderWave2Raw  = content;
    }

    const agentEntries = [
      { agentId: 'denial_defender',   text: formatAgentText('defender',    defenderWave2JSON, defenderWave2Raw),            data: defenderWave2JSON },
      { agentId: 'bias_auditor',      text: formatAgentText('bias',        biasJSON,          biasResult?.content ?? ''),   data: biasJSON },
      { agentId: 'precedent_agent',   text: formatAgentText('precedent',   precedentJSON,     precedentResult?.content ?? ''), data: precedentJSON },
      { agentId: 'circumstance_agent',text: formatAgentText('circumstance',circumstanceJSON,  circumstanceResult?.content ?? ''), data: circumstanceJSON },
      { agentId: 'legal_agent',       text: formatAgentText('legal',       legalJSON,         legalResult?.content ?? ''),  data: legalJSON },
    ].filter(e => e.text.trim());

    await streamAgentsParallel(res, agentEntries);
    await sleep(600);

    // ── Wave 3b: Defender rebuttals ──────────────────────────────────────────
    await sleep(400);

    let defenderWave3JSON = null;

    if (AGENTS.defender) {
      const rebuttalPrompt = `You previously defended this denial:\n${JSON.stringify(defenderWave2JSON ?? defenderWave2Raw)}

Now rebut each of these challenges:

BIAS AUDITOR: ${JSON.stringify(biasJSON ?? biasResult?.content)}
PRECEDENT AGENT: ${JSON.stringify(precedentJSON ?? precedentResult?.content)}
CIRCUMSTANCE AGENT: ${JSON.stringify(circumstanceJSON ?? circumstanceResult?.content)}
LEGAL AGENT: ${JSON.stringify(legalJSON ?? legalResult?.content)}`;

      const { content } = await invokeAgent(AGENTS.defender, rebuttalPrompt);
      defenderWave3JSON = tryParseJSON(content);

      const REBUTTAL_ORDER = ['bias_auditor', 'precedent_agent', 'circumstance_agent', 'legal_agent'];

      // Determine which agents actually have rebuttals
      const activeAgents = REBUTTAL_ORDER.filter(id => defenderWave3JSON?.rebuttals?.[id]);

      // Send round_start so the frontend initialises rebuttalRounds state
      send(res, 'round_start', { round: 1, total: 1, activeAgents });
      await sleep(200);

      // Send rebuttal_start (round 1) so the frontend captures attacker content
      send(res, 'rebuttal_start', { round: 1 });
      await sleep(200);

      for (const agentId of REBUTTAL_ORDER) {
        const rebuttal = defenderWave3JSON?.rebuttals?.[agentId];
        if (!rebuttal) continue;

        send(res, 'rebuttal_section_start', { agentId, round: 1 });

        const rebuttalText = [
          `${agentId.replace(/_/g, ' ').toUpperCase()} — ${rebuttal.verdict}`,
          '',
          rebuttal.reasoning ?? '',
          rebuttal.citation ? `\nCitation: ${rebuttal.citation}` : '',
        ].filter(Boolean).join('\n');

        for (const word of rebuttalText.split(/(\s+)/)) {
          send(res, 'rebuttal_chunk', { agentId, chunk: word, round: 1 });
          await sleep(22);
        }

        send(res, 'rebuttal_result', { agentId, result: rebuttal.verdict, round: 1 });
        await sleep(300);
      }
    }

    // ── Wave 4: Override Judge ───────────────────────────────────────────────
    await sleep(400);
    let judgeJSON = null;

    if (AGENTS.judge) {
      const judgePrompt = `Evaluate these rebuttals and determine if override fires:

ORIGINAL DENIAL: ${parserJSON}
DEFENDER WAVE 2: ${JSON.stringify(defenderWave2JSON ?? defenderWave2Raw)}
DEFENDER WAVE 3 REBUTTALS: ${JSON.stringify(defenderWave3JSON)}
BIAS AUDITOR: ${JSON.stringify(biasJSON ?? biasResult?.content)}
PRECEDENT AGENT: ${JSON.stringify(precedentJSON ?? precedentResult?.content)}
CIRCUMSTANCE AGENT: ${JSON.stringify(circumstanceJSON ?? circumstanceResult?.content)}
LEGAL AGENT: ${JSON.stringify(legalJSON ?? legalResult?.content)}${profileContext}`;

      const { content } = await invokeAgent(AGENTS.judge, judgePrompt);
      judgeJSON = tryParseJSON(content);
    }

    let concededAgents = [];
    let triggered = false;

    // Always derive concessions from actual rebuttal verdicts — never trust the judge
    // LLM to count correctly. The judge output is display-only.
    if (defenderWave3JSON?.rebuttals) {
      concededAgents = Object.entries(defenderWave3JSON.rebuttals)
        .filter(([, r]) => r.verdict === 'CONCEDED')
        .map(([k]) => k);
    } else if (judgeJSON?.conceded_arguments?.length) {
      concededAgents = judgeJSON.conceded_arguments;
    }
    triggered = concededAgents.length >= 2;

    send(res, 'override_result', { triggered, concessions: concededAgents.length, concededAgents, judgeOutput: judgeJSON });

    // ── Wave 5: Appeal Letter (conditional) ──────────────────────────────────
    if (triggered) {
      await sleep(700);
      let appealText = '';

      if (AGENTS.appeal) {
        try {
          const concededOutputs = {};
          if (concededAgents.includes('bias_auditor'))       concededOutputs.bias_auditor       = biasJSON       ?? biasResult?.content;
          if (concededAgents.includes('precedent_agent'))    concededOutputs.precedent_agent    = precedentJSON  ?? precedentResult?.content;
          if (concededAgents.includes('circumstance_agent')) concededOutputs.circumstance_agent = circumstanceJSON ?? circumstanceResult?.content;
          if (concededAgents.includes('legal_agent'))        concededOutputs.legal_agent        = legalJSON      ?? legalResult?.content;

          const appealPrompt = `Write the appeal letter using only these arguments:

ORIGINAL DENIAL: ${parserJSON}
OVERRIDE JUDGE OUTPUT: ${JSON.stringify(judgeJSON)}
CONCEDED AGENT OUTPUTS: ${JSON.stringify(concededOutputs)}${profileContext}`;

          const { content } = await invokeAgent(AGENTS.appeal, appealPrompt);
          const appealJSON = tryParseJSON(content);

          if (appealJSON?.letter?.body) {
            appealText = [
              appealJSON.letter.date ?? '',
              '',
              `Re: ${appealJSON.letter.subject ?? 'Formal Appeal'}`,
              '',
              appealJSON.letter.body,
              appealJSON.letter.cc?.length ? `\ncc: ${appealJSON.letter.cc.join(', ')}` : '',
            ].filter(s => s !== undefined).join('\n');
          } else {
            appealText = content;
          }
        } catch (appealErr) {
          console.error('[analyze] Appeal agent error — using fallback:', appealErr.message);
        }
      }

      // Fallback: generate a structured appeal letter from available data
      if (!appealText) {
        const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        const institution = parserOutput.institution ?? parserOutput.institution_name ?? 'The Institution';
        const amount = parserOutput.amount ?? parserOutput.loan_amount ?? '';
        const primaryReason = parserOutput.primary_reason ?? parserOutput.stated_reasons?.[0] ?? 'the stated reasons';

        const concededSections = [];
        if (concededAgents.includes('bias_auditor') && biasJSON) {
          const arg = biasJSON.strongest_argument ?? biasJSON.risk_summary ?? 'The denial reflects discriminatory patterns that violate the Equal Credit Opportunity Act.';
          concededSections.push(`Discrimination Concern: ${arg}`);
        }
        if (concededAgents.includes('precedent_agent') && precedentJSON) {
          const arg = precedentJSON.strongest_precedent ?? precedentJSON.precedent_summary ?? 'Established precedent supports reconsideration of this denial.';
          concededSections.push(`Legal Precedent: ${arg}`);
        }
        if (concededAgents.includes('circumstance_agent') && circumstanceJSON) {
          const arg = circumstanceJSON.strongest_argument ?? circumstanceJSON.circumstance_summary ?? 'My individual circumstances were not adequately considered in the automated review.';
          concededSections.push(`Mitigating Circumstances: ${arg}`);
        }
        if (concededAgents.includes('legal_agent') && legalJSON) {
          const arg = legalJSON.strongest_violation ?? legalJSON.legal_summary ?? 'This denial appears to violate applicable consumer protection statutes.';
          concededSections.push(`Legal Violation: ${arg}`);
        }

        const bodyParagraphs = [
          `I am writing to formally appeal the recent denial of my application${amount ? ` for ${amount}` : ''}. Your records will reflect this denial was issued on the basis of ${primaryReason}.`,
          '',
          `An independent adversarial review of this denial identified ${concededAgents.length} argument${concededAgents.length !== 1 ? 's' : ''} that your institution's own defense could not rebut:`,
          '',
          ...concededSections.map((s, i) => `${i + 1}. ${s}`),
          '',
          `Given that the defense conceded ${concededAgents.length} of 4 challenges, I respectfully request a full human review of my application. I am prepared to provide any supplemental documentation that would support reconsideration.`,
          '',
          `I request a written response within 30 days as provided under applicable consumer protection law.`,
          '',
          `Respectfully,`,
          `[Applicant Signature]`,
        ];

        appealText = [
          today,
          '',
          `To: ${institution}`,
          `Re: Formal Appeal of Application Denial`,
          '',
          ...bodyParagraphs,
        ].join('\n');
      }

      for (const word of appealText.split(/(\s+)/)) {
        send(res, 'appeal_chunk', { chunk: word });
        await sleep(20);
      }
    }

    await sleep(200);
    send(res, 'complete', {});
    res.end();
  } catch (err) {
    console.error('[analyze] Error:', err);
    send(res, 'error', { message: err.message });
    res.end();
  }
}
