const TOKEN_URL = 'https://iam.platform.saas.ibm.com/siusermgr/api/1.0/apikeys/token';

let cachedToken = null;
let tokenExpiresAt = 0;

const REASONING_INSTRUCTION = '\n\nBe thorough, specific, and well-structured in your response.';

function extractTrace(content) {
  const traceMatch = content.match(/<trace>([\s\S]*?)<\/trace>/i);
  return traceMatch ? traceMatch[1].trim() : null;
}

async function getJWT() {
  const API_KEY = process.env.IBM_KEY?.trim();
  if (!API_KEY) throw new Error('Missing IBM_KEY in .env');

  if (cachedToken && Date.now() < tokenExpiresAt - 60_000) return cachedToken;

  const res = await fetch(TOKEN_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body:    JSON.stringify({ apikey: API_KEY }),
  });

  if (!res.ok) throw new Error(`JWT exchange failed ${res.status}: ${await res.text()}`);

  const data      = await res.json();
  cachedToken     = data.token ?? data.access_token ?? data.jwt ?? data.id_token;
  const expiresIn = data.expires_in ?? data.expiration ?? 3600;
  tokenExpiresAt  = Date.now() + expiresIn * 1000;

  if (!cachedToken) throw new Error(`JWT exchange: no token field — ${JSON.stringify(data)}`);
  console.log('[orchestrateClient] JWT token refreshed');
  return cachedToken;
}

async function invokeAgent(agentId, userMsg) {
  const BASE_URL = process.env.SERVER_INSTANCE?.trim();
  const API_KEY  = process.env.IBM_KEY?.trim();

  if (!BASE_URL || !API_KEY) throw new Error('Missing SERVER_INSTANCE or IBM_KEY in .env');
  if (!agentId)              throw new Error(`Missing agent ID`);

  const jwt = await getJWT();
  const url = `${BASE_URL}/v1/orchestrate/${agentId}/chat/completions`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${jwt}`,
      'Content-Type':  'application/json',
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
  const content = data?.choices?.[0]?.message?.content
    ?? data?.output?.text
    ?? data?.response
    ?? JSON.stringify(data);

  const trace = extractTrace(content);
  return { content, trace };
}

module.exports = { invokeAgent };
