require('dotenv').config();

const { invokeAgent } = require('./orchestrateClient');

const AGENTS = {
  parse:        { id: process.env.PARSE_AGENT_ID,        name: 'Parser'               },
  bias:         { id: process.env.BIAS_AGENT_ID,         name: 'Bias Auditor'         },
  precedent:    { id: process.env.PRECEDENT_AGENT_ID,    name: 'Precedent Agent'      },
  circumstance: { id: process.env.CIRCUMSTANCE_AGENT_ID, name: 'Circumstance Agent'   },
  legal:        { id: process.env.LEGAL_AGENT_ID,        name: 'Legal Agent'          },
  defender:     { id: process.env.DEFENDER_AGENT_ID,     name: 'Denial Defender'      },
  judge:        { id: process.env.JUDGE_AGENT_ID,        name: 'Override Judge'       },
  appeal:       { id: process.env.APPEAL_AGENT_ID,       name: 'Appeal Letter Writer' },
};

const SAMPLE_DENIAL = `
March 11, 2026

Dear Applicant,

We regret to inform you that your application for a personal loan of $5,000 has been denied.

Primary reason: Insufficient credit history
Secondary reason: Debt-to-income ratio exceeds threshold

This decision was made by our automated review system.

Sincerely,
AutoLend Financial
`;

const SAMPLE_PARSER_JSON = {
  denial_type: "loan",
  institution_name: "AutoLend Financial",
  stated_reasons: ["Insufficient credit history", "Debt-to-income ratio exceeds threshold"],
  referenced_scores: [],
  adverse_action_notice_present: false,
  parsing_confidence: "HIGH",
  raw_text: SAMPLE_DENIAL.trim(),
};

function truncate(str, n = 300) {
  if (!str) return '(empty)';
  return str.length > n ? str.slice(0, n) + '...' : str;
}

function tryParseJSON(content) {
  try {
    const match = content.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : null;
  } catch {
    return null;
  }
}

async function testAgent(key, prompt) {
  const agent = AGENTS[key];
  if (!agent.id) {
    console.log(`  [SKIP] ${agent.name} — no agent ID set`);
    return null;
  }

  process.stdout.write(`  [CALL] ${agent.name} (${agent.id.slice(0, 8)}...)  `);
  const start = Date.now();

  try {
    const { content } = await invokeAgent(agent.id, prompt);
    const ms = Date.now() - start;
    const parsed = tryParseJSON(content);
    console.log(`✓  ${ms}ms  |  JSON: ${parsed ? 'YES' : 'NO (raw text)'}`);
    console.log(`         Preview: ${truncate(content)}`);
    if (parsed) console.log(`         Keys:    ${Object.keys(parsed).join(', ')}`);
    console.log();
    return { content, parsed };
  } catch (err) {
    const ms = Date.now() - start;
    console.log(`✗  ${ms}ms  |  ERROR: ${err.message}`);
    console.log();
    return null;
  }
}

async function run() {
  console.log('='.repeat(70));
  console.log(' The Override — Agent Pipeline Test');
  console.log('='.repeat(70));
  console.log(`SERVER_INSTANCE: ${process.env.SERVER_INSTANCE}`);
  console.log(`IBM_KEY:         ${process.env.IBM_KEY ? process.env.IBM_KEY.slice(0, 10) + '...' : 'NOT SET'}`);
  console.log();

  // Wave 1 — Parser
  console.log('── Wave 1: Parser ──────────────────────────────────────────────────');
  const parseResult = await testAgent('parse', `Parse this denial letter and return structured JSON:\n\n${SAMPLE_DENIAL}`);
  const parserJSON = parseResult?.parsed ?? SAMPLE_PARSER_JSON;
  const parserStr = JSON.stringify(parserJSON);

  // Wave 2 — Attackers in parallel
  console.log('── Wave 2: Attackers (parallel) ────────────────────────────────────');
  const [biasResult, precedentResult, circumstanceResult, legalResult] = await Promise.all([
    testAgent('bias',        `Analyze this denial for discrimination signals: ${parserStr}`),
    testAgent('precedent',   `Find precedent for challenging this denial: ${parserStr}`),
    testAgent('circumstance',`Identify circumstance arguments for this denial: ${parserStr}`),
    testAgent('legal',       `Identify legal violations in this denial: ${parserStr}`),
  ]);

  // Wave 3a — Defender initial defense
  console.log('── Wave 3a: Defender — Initial Defense ─────────────────────────────');
  const defenderWave2 = await testAgent('defender', `Build the strongest possible defense of this denial: ${parserStr}`);
  const defenderWave2Str = JSON.stringify(defenderWave2?.parsed ?? defenderWave2?.content ?? '');

  // Wave 3b — Defender rebuttal
  console.log('── Wave 3b: Defender — Rebuttal ────────────────────────────────────');
  const rebuttalPrompt = `You previously defended this denial:\n${defenderWave2Str}

Now rebut each of these challenges:

BIAS AUDITOR: ${JSON.stringify(biasResult?.parsed ?? biasResult?.content)}
PRECEDENT AGENT: ${JSON.stringify(precedentResult?.parsed ?? precedentResult?.content)}
CIRCUMSTANCE AGENT: ${JSON.stringify(circumstanceResult?.parsed ?? circumstanceResult?.content)}
LEGAL AGENT: ${JSON.stringify(legalResult?.parsed ?? legalResult?.content)}`;
  const defenderWave3 = await testAgent('defender', rebuttalPrompt);

  // Wave 4 — Judge
  console.log('── Wave 4: Override Judge ──────────────────────────────────────────');
  const judgePrompt = `Evaluate these rebuttals and determine if override fires:

ORIGINAL DENIAL: ${parserStr}
DEFENDER WAVE 2: ${defenderWave2Str}
DEFENDER WAVE 3 REBUTTALS: ${JSON.stringify(defenderWave3?.parsed ?? defenderWave3?.content)}
BIAS AUDITOR: ${JSON.stringify(biasResult?.parsed ?? biasResult?.content)}
PRECEDENT AGENT: ${JSON.stringify(precedentResult?.parsed ?? precedentResult?.content)}
CIRCUMSTANCE AGENT: ${JSON.stringify(circumstanceResult?.parsed ?? circumstanceResult?.content)}
LEGAL AGENT: ${JSON.stringify(legalResult?.parsed ?? legalResult?.content)}`;
  const judgeResult = await testAgent('judge', judgePrompt);

  // Wave 5 — Appeal (only if override fired)
  const overrideFired = judgeResult?.parsed?.override_decision === 'OVERRIDE_FIRED'
    || judgeResult?.parsed?.override_threshold_met === true;

  console.log('── Wave 5: Appeal Letter Writer ────────────────────────────────────');
  if (overrideFired || true) { // force-run for testing even if judge didn't fire
    const concededOutputs = {
      bias_auditor:       biasResult?.parsed       ?? biasResult?.content,
      legal_agent:        legalResult?.parsed      ?? legalResult?.content,
    };
    const appealPrompt = `Write the appeal letter using only these arguments:

ORIGINAL DENIAL: ${parserStr}
OVERRIDE JUDGE OUTPUT: ${JSON.stringify(judgeResult?.parsed ?? judgeResult?.content)}
CONCEDED AGENT OUTPUTS: ${JSON.stringify(concededOutputs)}`;
    await testAgent('appeal', appealPrompt);
  } else {
    console.log('  [SKIP] Override did not fire — appeal not triggered\n');
  }

  console.log('='.repeat(70));
  console.log(' Test complete');
  console.log('='.repeat(70));
}

run().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
