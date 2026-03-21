const express = require('express');
const cors = require('cors');
const { parseDenialLetter, MOCK_RESPONSES, getMockRebuttalSections, getMockAppealLetter } = require('./mockData');

const app = express();
app.use(cors());
app.use(express.json());

function send(res, event, data) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// Stream multiple texts interleaved (round-robin word by word)
async function streamAgentsParallel(res, agentEntries) {
  // agentEntries: [{agentId, text}]
  const streams = agentEntries.map(({ agentId, text }) => ({
    agentId,
    words: text.split(/(\s+)/), // preserve whitespace tokens
    index: 0,
  }));

  // Signal all agents starting simultaneously
  for (const s of streams) {
    send(res, 'agent_start', { agentId: s.agentId });
  }

  // Round-robin interleave
  let anyActive = true;
  while (anyActive) {
    anyActive = false;
    for (const s of streams) {
      if (s.index < s.words.length) {
        anyActive = true;
        const token = s.words[s.index++];
        if (token.trim()) {
          send(res, 'agent_chunk', { agentId: s.agentId, chunk: token });
        } else {
          send(res, 'agent_chunk', { agentId: s.agentId, chunk: token });
        }
      }
    }
    await sleep(18);
  }

  for (const s of streams) {
    send(res, 'agent_complete', { agentId: s.agentId });
  }
}

app.post('/api/analyze', async (req, res) => {
  const { denialText } = req.body;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  try {
    // Step 1 — Parse denial
    await sleep(300);
    const parsed = parseDenialLetter(denialText || '');
    send(res, 'parsed', parsed);
    await sleep(400);

    // Step 2 — 5 agents fire in parallel (interleaved streaming)
    const agentEntries = [
      { agentId: 'denial_defender', text: MOCK_RESPONSES.denial_defender },
      { agentId: 'bias_auditor', text: MOCK_RESPONSES.bias_auditor },
      { agentId: 'precedent_agent', text: MOCK_RESPONSES.precedent_agent },
      { agentId: 'circumstance_agent', text: MOCK_RESPONSES.circumstance_agent },
      { agentId: 'legal_agent', text: MOCK_RESPONSES.legal_agent },
    ];

    await streamAgentsParallel(res, agentEntries);
    await sleep(600);

    // Step 3 — Denial Defender rebuts each challenge sequentially
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

    // Step 4 — Override judge
    await sleep(400);
    const triggered = concededAgents.length >= 2;
    send(res, 'override_result', {
      triggered,
      concessions: concededAgents.length,
      concededAgents,
    });

    // Step 5 — Appeal letter (only if override fires)
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
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`The Override server running on http://localhost:${PORT}`);
});
