import twilio from 'twilio';

function decodeLines(encoded) {
  return JSON.parse(Buffer.from(encoded, 'base64url').toString());
}

function audioUrl(baseUrl, text) {
  const encodedText = Buffer.from(text).toString('base64url');
  return `${baseUrl}/api/call/audio?text=${encodedText}`;
}

export default async function handler(req, res) {
  const params      = { ...req.query, ...req.body };
  const encoded     = params.lines;
  const currentTurn = parseInt(params.turn ?? '0');
  const baseUrl     = process.env.VITE_API_URL;
  const twiml       = new twilio.twiml.VoiceResponse();

  if (!encoded) {
    twiml.say('Goodbye.');
    twiml.hangup();
    res.setHeader('Content-Type', 'text/xml');
    return res.status(200).send(twiml.toString());
  }

  const lines = decodeLines(encoded);

  twiml.play(audioUrl(baseUrl, lines[currentTurn]));

  twiml.gather({
    input:         'speech',
    action:        `${baseUrl}/api/call/webhook/gather?lines=${encoded}&turn=${currentTurn}`,
    method:        'POST',
    timeout:       8,
    speechTimeout: 'auto',
  });

  twiml.redirect(`${baseUrl}/api/call/webhook/gather?lines=${encoded}&turn=${currentTurn}`);

  res.setHeader('Content-Type', 'text/xml');
  return res.status(200).send(twiml.toString());
}