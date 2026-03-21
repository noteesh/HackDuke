require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { parseDenialLetter } = require('./mockData');
const { invokeAgent } = require('./orchestrateClient');

const app = express();
app.use(cors());
app.use(express.json());

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

// ── Helpers ──────────────────────────────────────────────────────────────────

function send(res, event, data) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function tryParseJSON(content) {
  try {
    const match = content.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : null;
  } catch {
    return null;
  }
}

// Convert each agent's structured JSON output into human-readable text for streaming
function formatAgentText(agentKey, json, rawFallback) {
  if (!json) return rawFallback ?? '';

  switch (agentKey) {
    case 'bias':
      return [
        `DISCRIMINATION RISK LEVEL: ${json.overall_discrimination_risk ?? 'UNKNOWN'}`,
        '',
        ...(json.findings ?? []).map(f => [
          `${(f.finding_type ?? 'FINDING').toUpperCase()}: ${f.signal ?? ''}`,
          `Protected class: ${f.protected_class ?? 'N/A'} | Strength: ${f.strength ?? 'N/A'}`,
          `Citation: ${f.citation ?? 'N/A'}`,
        ].join('\n')),
        '',
        json.strongest_argument ? `STRONGEST ARGUMENT:\n${json.strongest_argument}` : '',
      ].filter(Boolean).join('\n\n');

    case 'precedent':
      return [
        `PRECEDENT STRENGTH: ${json.overall_precedent_strength ?? 'UNKNOWN'}`,
        '',
        ...(json.cases ?? []).map(c => [
          `${c.name ?? 'Case'} (${c.citation ?? ''})`,
          `Applicability: ${c.applicability ?? 'N/A'} | Strength: ${c.strength ?? 'N/A'}`,
        ].join('\n')),
        '',
        json.strongest_precedent ? `STRONGEST PRECEDENT:\n${json.strongest_precedent}` : '',
      ].filter(Boolean).join('\n\n');

    case 'circumstance':
      return [
        `CIRCUMSTANCE STRENGTH: ${json.overall_circumstance_strength ?? 'UNKNOWN'}`,
        '',
        ...(json.alternative_credit_evidence ?? []).map(e => [
          `${(e.evidence_type ?? 'EVIDENCE').toUpperCase()}: ${e.argument ?? ''}`,
          `Citation: ${e.citation ?? 'N/A'}`,
        ].join('\n')),
        ...(json.algorithm_blind_spots ?? []).map(b =>
          `BLIND SPOT: ${typeof b === 'string' ? b : JSON.stringify(b)}`
        ),
        '',
        json.strongest_argument ? `STRONGEST ARGUMENT:\n${json.strongest_argument}` : '',
      ].filter(Boolean).join('\n\n');

    case 'legal':
      return [
        `LEGAL RISK LEVEL: ${json.overall_legal_risk ?? 'UNKNOWN'}`,
        '',
        ...(json.violations ?? []).map(v => [
          `${v.law ?? ''} — ${v.section ?? ''}`,
          `VIOLATION: ${v.violation ?? ''}`,
          `Severity: ${v.severity ?? 'N/A'} | Private right of action: ${v.private_right_of_action ? 'YES' : 'NO'}`,
        ].join('\n')),
        '',
        json.strongest_violation ? `STRONGEST VIOLATION:\n${json.strongest_violation}` : '',
      ].filter(Boolean).join('\n\n');

    case 'defender':
      return [
        json.primary_justification
          ? `PRIMARY JUSTIFICATION:\n${json.primary_justification.argument ?? ''}\nCitation: ${json.primary_justification.citation ?? 'N/A'}`
          : '',
        `DEFENSE CONFIDENCE: ${json.overall_defense_confidence ?? 'UNKNOWN'}`,
        json.weakest_point ? `WEAKEST POINT:\n${json.weakest_point}` : '',
      ].filter(Boolean).join('\n\n');

    default:
      return rawFallback ?? '';
  }
}

// Stream multiple agent texts interleaved (round-robin word by word)
async function streamAgentsParallel(res, agentEntries) {
  for (const s of agentEntries) {
    send(res, 'agent_start', { agentId: s.agentId });
  }

  const streams = agentEntries.map(({ agentId, text }) => ({
    agentId,
    words: text.split(/(\s+)/),
    index: 0,
  }));

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

// ── Route ─────────────────────────────────────────────────────────────────────

app.post('/api/analyze', async (req, res) => {
  const { denialText } = req.body;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  try {
    // ── Wave 1: Parser ───────────────────────────────────────────────────────
    console.log('[analyze] Wave 1: Parser');
    let parserOutput;

    if (AGENTS.parse) {
      const { content } = await invokeAgent(
        AGENTS.parse,
        `Parse this denial letter and return structured JSON:\n\n${denialText}`
      );
      parserOutput = tryParseJSON(content);
      if (!parserOutput) {
        console.warn('[analyze] Parser returned non-JSON — falling back to local parser');
        parserOutput = parseDenialLetter(denialText || '');
      }
    } else {
      parserOutput = parseDenialLetter(denialText || '');
    }

    send(res, 'parsed', parserOutput);
    await sleep(400);

    const parserJSON = JSON.stringify(parserOutput);

    // ── Wave 2: 4 Attackers in parallel ─────────────────────────────────────
    console.log('[analyze] Wave 2: Attackers in parallel');

    const [biasResult, precedentResult, circumstanceResult, legalResult] = await Promise.all([
      AGENTS.bias
        ? invokeAgent(AGENTS.bias,         `Analyze this denial for discrimination signals: ${parserJSON}`)
        : Promise.resolve(null),
      AGENTS.precedent
        ? invokeAgent(AGENTS.precedent,    `Find precedent for challenging this denial: ${parserJSON}`)
        : Promise.resolve(null),
      AGENTS.circumstance
        ? invokeAgent(AGENTS.circumstance, `Identify circumstance arguments for this denial: ${parserJSON}`)
        : Promise.resolve(null),
      AGENTS.legal
        ? invokeAgent(AGENTS.legal,        `Identify legal violations in this denial: ${parserJSON}`)
        : Promise.resolve(null),
    ]);

    const biasJSON         = biasResult        ? tryParseJSON(biasResult.content)         : null;
    const precedentJSON    = precedentResult   ? tryParseJSON(precedentResult.content)    : null;
    const circumstanceJSON = circumstanceResult ? tryParseJSON(circumstanceResult.content) : null;
    const legalJSON        = legalResult       ? tryParseJSON(legalResult.content)        : null;

    // ── Wave 3a: Defender builds initial defense ─────────────────────────────
    console.log('[analyze] Wave 3a: Defender — initial defense');
    let defenderWave2JSON = null;
    let defenderWave2Raw  = '';

    if (AGENTS.defender) {
      const { content } = await invokeAgent(
        AGENTS.defender,
        `Build the strongest possible defense of this denial: ${parserJSON}`
      );
      defenderWave2JSON = tryParseJSON(content);
      defenderWave2Raw  = content;
    }

    // Stream all 5 agents interleaved (wave 2 attackers + wave 3a defender)
    const agentEntries = [
      {
        agentId: 'denial_defender',
        text: formatAgentText('defender', defenderWave2JSON, defenderWave2Raw),
      },
      {
        agentId: 'bias_auditor',
        text: formatAgentText('bias', biasJSON, biasResult?.content ?? ''),
      },
      {
        agentId: 'precedent_agent',
        text: formatAgentText('precedent', precedentJSON, precedentResult?.content ?? ''),
      },
      {
        agentId: 'circumstance_agent',
        text: formatAgentText('circumstance', circumstanceJSON, circumstanceResult?.content ?? ''),
      },
      {
        agentId: 'legal_agent',
        text: formatAgentText('legal', legalJSON, legalResult?.content ?? ''),
      },
    ].filter(e => e.text.trim());

    await streamAgentsParallel(res, agentEntries);
    await sleep(600);

    // ── Wave 3b: Defender rebuts all attackers ───────────────────────────────
    console.log('[analyze] Wave 3b: Defender — rebuttal');
    send(res, 'rebuttal_start', {});
    await sleep(400);

    let defenderWave3JSON = null;

    if (AGENTS.defender) {
      const rebuttalPrompt =
        `You previously defended this denial:\n${JSON.stringify(defenderWave2JSON ?? defenderWave2Raw)}

Now rebut each of these challenges:

BIAS AUDITOR: ${JSON.stringify(biasJSON ?? biasResult?.content)}
PRECEDENT AGENT: ${JSON.stringify(precedentJSON ?? precedentResult?.content)}
CIRCUMSTANCE AGENT: ${JSON.stringify(circumstanceJSON ?? circumstanceResult?.content)}
LEGAL AGENT: ${JSON.stringify(legalJSON ?? legalResult?.content)}`;

      const { content } = await invokeAgent(AGENTS.defender, rebuttalPrompt);
      defenderWave3JSON = tryParseJSON(content);

      // Stream each rebuttal individually
      const REBUTTAL_ORDER = [
        'bias_auditor',
        'precedent_agent',
        'circumstance_agent',
        'legal_agent',
      ];

      for (const agentId of REBUTTAL_ORDER) {
        const rebuttal = defenderWave3JSON?.rebuttals?.[agentId];
        if (!rebuttal) continue;

        send(res, 'rebuttal_section_start', { agentId });

        const rebuttalText = [
          `${agentId.replace(/_/g, ' ').toUpperCase()} — ${rebuttal.verdict}`,
          '',
          rebuttal.reasoning ?? '',
          rebuttal.citation ? `\nCitation: ${rebuttal.citation}` : '',
        ].filter(Boolean).join('\n');

        const words = rebuttalText.split(/(\s+)/);
        for (const word of words) {
          send(res, 'rebuttal_chunk', { agentId, chunk: word });
          await sleep(22);
        }

        send(res, 'rebuttal_result', { agentId, result: rebuttal.verdict });
        await sleep(300);
      }
    }

    // ── Wave 4: Override Judge ───────────────────────────────────────────────
    console.log('[analyze] Wave 4: Override Judge');
    await sleep(400);

    let judgeJSON = null;

    if (AGENTS.judge) {
      const judgePrompt =
        `Evaluate these rebuttals and determine if override fires:

ORIGINAL DENIAL: ${parserJSON}
DEFENDER WAVE 2: ${JSON.stringify(defenderWave2JSON ?? defenderWave2Raw)}
DEFENDER WAVE 3 REBUTTALS: ${JSON.stringify(defenderWave3JSON)}
BIAS AUDITOR: ${JSON.stringify(biasJSON ?? biasResult?.content)}
PRECEDENT AGENT: ${JSON.stringify(precedentJSON ?? precedentResult?.content)}
CIRCUMSTANCE AGENT: ${JSON.stringify(circumstanceJSON ?? circumstanceResult?.content)}
LEGAL AGENT: ${JSON.stringify(legalJSON ?? legalResult?.content)}`;

      const { content } = await invokeAgent(AGENTS.judge, judgePrompt);
      judgeJSON = tryParseJSON(content);
    }

    // Resolve concessions: prefer judge output, fall back to wave 3 rebuttals
    let concededAgents = [];
    let triggered = false;

    if (judgeJSON) {
      triggered = judgeJSON.override_decision === 'OVERRIDE_FIRED'
        || judgeJSON.override_threshold_met === true;
      concededAgents = judgeJSON.conceded_arguments ?? [];
    } else if (defenderWave3JSON?.rebuttals) {
      concededAgents = Object.entries(defenderWave3JSON.rebuttals)
        .filter(([, r]) => r.verdict === 'CONCEDED')
        .map(([k]) => k);
      triggered = concededAgents.length >= 2;
    }

    send(res, 'override_result', {
      triggered,
      concessions: concededAgents.length,
      concededAgents,
      judgeOutput: judgeJSON,
    });

    // ── Wave 5: Appeal Letter Writer (conditional) ───────────────────────────
    if (triggered) {
      console.log('[analyze] Wave 5: Appeal Letter Writer');
      await sleep(700);

      let appealText = '';

      if (AGENTS.appeal) {
        const concededOutputs = {};
        if (concededAgents.includes('bias_auditor'))
          concededOutputs.bias_auditor       = biasJSON       ?? biasResult?.content;
        if (concededAgents.includes('precedent_agent'))
          concededOutputs.precedent_agent    = precedentJSON  ?? precedentResult?.content;
        if (concededAgents.includes('circumstance_agent'))
          concededOutputs.circumstance_agent = circumstanceJSON ?? circumstanceResult?.content;
        if (concededAgents.includes('legal_agent'))
          concededOutputs.legal_agent        = legalJSON      ?? legalResult?.content;

        const appealPrompt =
          `Write the appeal letter using only these arguments:

ORIGINAL DENIAL: ${parserJSON}
OVERRIDE JUDGE OUTPUT: ${JSON.stringify(judgeJSON)}
CONCEDED AGENT OUTPUTS: ${JSON.stringify(concededOutputs)}`;

        const { content } = await invokeAgent(AGENTS.appeal, appealPrompt);
        const appealJSON = tryParseJSON(content);

        if (appealJSON?.letter?.body) {
          appealText = [
            appealJSON.letter.date ?? '',
            '',
            `Re: ${appealJSON.letter.subject ?? 'Formal Appeal'}`,
            '',
            appealJSON.letter.body,
            appealJSON.letter.cc?.length
              ? `\ncc: ${appealJSON.letter.cc.join(', ')}`
              : '',
          ].filter(s => s !== undefined).join('\n');
        } else {
          appealText = content; // use raw if JSON didn't parse
        }
      }

      if (appealText) {
        const words = appealText.split(/(\s+)/);
        for (const word of words) {
          send(res, 'appeal_chunk', { chunk: word });
          await sleep(20);
        }
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
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`The Override server running on http://localhost:${PORT}`);
});
