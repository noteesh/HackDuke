export default async function handler(req, res) {
  const params  = { ...req.query, ...req.body };
  const encoded = params.lines;

  const twiml = ['<?xml version="1.0" encoding="UTF-8"?><Response>'];

  if (!encoded) {
    twiml.push('<Say>Sorry, an error occurred. Goodbye.</Say><Hangup/>');
  } else {
    const lines = JSON.parse(Buffer.from(encoded, 'base64url').toString());
    for (const line of lines) {
      twiml.push(`<Say>${line}</Say>`);
      twiml.push('<Pause length="1"/>');
    }
    twiml.push('<Hangup/>');
  }

  twiml.push('</Response>');
  res.setHeader('Content-Type', 'text/xml');
  return res.status(200).send(twiml.join(''));
}