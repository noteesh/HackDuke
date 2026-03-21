require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { Resend } = require('resend');
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

// Convert each agent's structured JSON output into human-readable text for streaming.
// Uses the agent's summary/prose fields first to avoid raw JSON fragments.
function formatAgentText(agentKey, json, rawFallback) {
  if (!json) return rawFallback ?? '';

  const lines = [];

  switch (agentKey) {
    case 'bias': {
      if (json.overall_discrimination_risk)
        lines.push(`DISCRIMINATION RISK: ${json.overall_discrimination_risk}`);
      if (json.risk_summary) lines.push('', json.risk_summary);
      for (const f of (json.findings ?? [])) {
        const text = typeof f === 'string' ? f
          : [f.signal, f.protected_class ? `(${f.protected_class})` : null, f.citation ? `— ${f.citation}` : null]
              .filter(Boolean).join(' ');
        if (text.trim()) lines.push('', `• ${text}`);
      }
      if (json.strongest_argument) lines.push('', 'KEY ARGUMENT:', json.strongest_argument);
      break;
    }

    case 'precedent': {
      // agents return either overall_precedent_strength or overall_precedence_strength
      const strength = json.overall_precedent_strength ?? json.overall_precedence_strength;
      if (strength) lines.push(`PRECEDENT STRENGTH: ${strength}`);
      if (json.precedent_summary) lines.push('', json.precedent_summary);
      for (const c of (json.cases ?? [])) {
        const name = typeof c === 'string' ? c : `${c.name ?? 'Case'}${c.citation ? ` (${c.citation})` : ''}`;
        lines.push('', `• ${name}`);
      }
      for (const e of (json.enforcement_actions ?? [])) {
        const name = typeof e === 'string' ? e : (e.name ?? e.title ?? '');
        if (name) lines.push(`• Enforcement: ${name}`);
      }
      if (json.strongest_precedent) lines.push('', 'STRONGEST PRECEDENT:', json.strongest_precedent);
      break;
    }

    case 'circumstance': {
      if (json.overall_circumstance_strength)
        lines.push(`CIRCUMSTANCE STRENGTH: ${json.overall_circumstance_strength}`);
      if (json.circumstance_summary) lines.push('', json.circumstance_summary);
      for (const e of (json.alternative_credit_evidence ?? [])) {
        const text = typeof e === 'string' ? e : (e.argument ?? e.description ?? '');
        if (text) lines.push('', `• ${text}`);
      }
      for (const b of (json.algorithm_blind_spots ?? [])) {
        // never stringify objects — extract prose field
        const text = typeof b === 'string' ? b
          : (b.blind_spot ?? b.description ?? b.argument ?? b.factor ?? '');
        if (text) lines.push(`• Blind spot: ${text}`);
      }
      if (json.strongest_argument) lines.push('', 'KEY ARGUMENT:', json.strongest_argument);
      break;
    }

    case 'legal': {
      if (json.overall_legal_risk) lines.push(`LEGAL RISK: ${json.overall_legal_risk}`);
      if (json.legal_summary) lines.push('', json.legal_summary);
      for (const v of (json.violations ?? [])) {
        const text = typeof v === 'string' ? v
          : `${v.law ?? ''} ${v.section ?? ''}: ${v.violation ?? ''} — Severity: ${v.severity ?? 'N/A'}`;
        lines.push('', `• ${text}`);
      }
      if (json.strongest_violation) lines.push('', 'KEY VIOLATION:', json.strongest_violation);
      break;
    }

    case 'defender': {
      if (json.overall_defense_confidence)
        lines.push(`DEFENSE CONFIDENCE: ${json.overall_defense_confidence}`);
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

  const result = lines.join('\n').trim();
  return result || rawFallback || '';
}

// Stream multiple agent texts interleaved (round-robin word by word).
// agentEntries: [{ agentId, text, data }] — data is the parsed JSON sent in agent_complete.
async function streamAgentsParallel(res, agentEntries) {
  for (const s of agentEntries) {
    send(res, 'agent_start', { agentId: s.agentId });
  }

  const streams = agentEntries.map(({ agentId, text, data }) => ({
    agentId,
    data,
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
    // Include the structured JSON so the frontend can render rich UI from it
    send(res, 'agent_complete', { agentId: s.agentId, data: s.data ?? null });
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
        data: defenderWave2JSON,
      },
      {
        agentId: 'bias_auditor',
        text: formatAgentText('bias', biasJSON, biasResult?.content ?? ''),
        data: biasJSON,
      },
      {
        agentId: 'precedent_agent',
        text: formatAgentText('precedent', precedentJSON, precedentResult?.content ?? ''),
        data: precedentJSON,
      },
      {
        agentId: 'circumstance_agent',
        text: formatAgentText('circumstance', circumstanceJSON, circumstanceResult?.content ?? ''),
        data: circumstanceJSON,
      },
      {
        agentId: 'legal_agent',
        text: formatAgentText('legal', legalJSON, legalResult?.content ?? ''),
        data: legalJSON,
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

// ── Email Sending Endpoint ───────────────────────────────────────────────────

app.post('/api/send-appeal', async (req, res) => {
  try {
    const { recipientEmail, recipientName, subject, appealText, userEmail } = req.body;

    // Validation
    if (!recipientEmail || !recipientEmail.includes('@')) {
      return res.status(400).json({ error: 'Valid recipient email is required' });
    }

    if (!appealText || appealText.trim().length === 0) {
      return res.status(400).json({ error: 'Appeal text is required' });
    }

    // Email configuration
    const resendApiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.MAIL_FROM || 'onboarding@resend.dev';
    const appName = process.env.APP_NAME || 'The Override';
    const defaultSubject = 'Formal Appeal Regarding Denial Decision';

    // Construct email body with intro
    const emailBody = `Dear ${recipientName || 'Legal Counsel'},

I am writing to formally appeal a recent denial decision. Please find the complete appeal letter below.

────────────────────────────────────────────────────────────────────────────

${appealText}

────────────────────────────────────────────────────────────────────────────

This appeal was prepared with the assistance of ${appName}, an AI-powered legal analysis tool.

Best regards`;

    // Check if Resend is configured
    if (!resendApiKey) {
      console.log('[send-appeal] RESEND_API_KEY not configured. Email details:');
      console.log('  From:', fromEmail);
      console.log('  To:', recipientEmail);
      console.log('  Reply-To:', userEmail || 'Not provided');
      console.log('  Subject:', subject || defaultSubject);
      console.log('  Body length:', emailBody.length, 'characters');
      console.log('\n--- Email Preview ---');
      console.log(emailBody.substring(0, 500) + '...\n');

      return res.status(400).json({ 
        error: 'Email service not configured',
        message: 'RESEND_API_KEY is required in .env file'
      });
    }

    // Initialize Resend client
    const resend = new Resend(resendApiKey);

    // Send email using Resend SDK
    try {
      const emailData = {
        from: fromEmail,
        to: recipientEmail,
        subject: subject || defaultSubject,
        text: emailBody,
      };

      // Add reply-to if user email is available
      if (userEmail) {
        emailData.reply_to = userEmail;
      }

      const { data, error } = await resend.emails.send(emailData);

      if (error) {
        console.error('[send-appeal] Resend error:', error);
        return res.status(500).json({ 
          error: 'Failed to send email',
          details: error.message || 'Unknown error from Resend'
        });
      }

      console.log('[send-appeal] Email sent successfully via Resend:', data.id);
      return res.json({ 
        success: true, 
        message: 'Appeal sent successfully to ' + recipientEmail,
        emailId: data.id 
      });

    } catch (emailError) {
      console.error('[send-appeal] Resend SDK error:', emailError);
      return res.status(500).json({ 
        error: 'Failed to send email',
        details: emailError.message 
      });
    }

  } catch (err) {
    console.error('[send-appeal] Error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`The Override server running on http://localhost:${PORT}`);
});
