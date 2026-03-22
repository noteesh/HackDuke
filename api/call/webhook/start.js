import twilio from 'twilio';

function decodeLines(encoded) {
  return JSON.parse(Buffer.from(encoded, 'base64url').toString());
}

function audioUrl(baseUrl, text) {
  const encodedText = Buffer.from(text).toString('base64url');
  return `${baseUrl}/api/call/audio?text=${encodedText}`;
}

export default async function handler(req, res) {
  const { lines: encoded, turn = '0' } = req.query;
  const currentTurn = parseInt(turn);
  const baseUrl     = process.env.VITE_API_URL;
  const twiml       = new twilio.twiml.VoiceResponse();

  if (!encoded) {
    twiml.say('Goodbye.');
    twiml.hangup();
    return res.status(200).type('text/xml').send(twiml.toString());
  }

  const lines = decodeLines(encoded);

  // Play current line via ElevenLabs audio endpoint
  twiml.play(audioUrl(baseUrl, lines[currentTurn]));

  // Gather user response
  twiml.gather({
    input:         'speech',
    action:        `${baseUrl}/api/call/webhook/gather?lines=${encoded}&turn=${currentTurn}`,
    method:        'POST',
    timeout:       8,
    speechTimeout: 'auto',
  });

  twiml.redirect(`${baseUrl}/api/call/webhook/gather?lines=${encoded}&turn=${currentTurn}`);

  return res.status(200).type('text/xml').send(twiml.toString());
}