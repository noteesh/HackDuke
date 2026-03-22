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
  const nextTurn    = currentTurn + 1;
  const baseUrl     = process.env.BASE_URL;
  const twiml       = new twilio.twiml.VoiceResponse();

  if (!encoded) {
    twiml.say('Goodbye.');
    twiml.hangup();
    return res.status(200).type('text/xml').send(twiml.toString());
  }

  const lines = decodeLines(encoded);

  if (nextTurn >= lines.length) {
    twiml.say('Goodbye.');
    twiml.hangup();
    return res.status(200).type('text/xml').send(twiml.toString());
  }

  // Play next line via ElevenLabs audio endpoint
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

  return res.status(200).type('text/xml').send(twiml.toString());
}