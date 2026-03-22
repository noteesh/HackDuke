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
  const nextTurn    = currentTurn + 1;
  const baseUrl     = process.env.VITE_API_URL;
  const twiml       = new twilio.twiml.VoiceResponse();

  if (!encoded) {
    twiml.say('Goodbye.');
    twiml.hangup();
    res.setHeader('Content-Type', 'text/xml');
    return res.status(200).send(twiml.toString());
  }

  const lines = decodeLines(encoded);

  if (nextTurn >= lines.length) {
    twiml.say('Goodbye.');
    twiml.hangup();
    res.setHeader('Content-Type', 'text/xml');
    return res.status(200).send(twiml.toString());
  }

  twiml.play(audioUrl(baseUrl, lines[nextTurn]));

  if (nextTurn + 1 < lines.length) {
    twiml.gather({
      input:         'speech',
      action:        `${baseUrl}/api/call/webhook/gather?lines=${encoded}&turn=${nextTurn}`,
      method:        'POST',
      timeout:       8,
      speechTimeout: 'auto',
    });
    twiml.redirect(`${baseUrl}/api/call/webhook/gather?lines=${encoded}&turn=${nextTurn}`);
  } else {
    twiml.pause({ length: 1 });
    twiml.hangup();
  }

  res.setHeader('Content-Type', 'text/xml');
  return res.status(200).send(twiml.toString());
}