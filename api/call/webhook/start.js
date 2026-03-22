export default async function handler(req, res) {
  const params  = { ...req.query, ...req.body };
  const encoded = params.lines;
  const baseUrl = process.env.VITE_API_URL;

  const twiml = ['<?xml version="1.0" encoding="UTF-8"?><Response>'];

  if (!encoded) {
    twiml.push('<Say>Sorry, an error occurred. Goodbye.</Say><Hangup/>');
  } else {
    const lines = JSON.parse(Buffer.from(encoded, 'base64url').toString());
    for (const line of lines) {
      const encodedText = Buffer.from(line).toString('base64url');
      twiml.push(`<Play volume="20">${baseUrl}/api/call/audio?text=${encodedText}</Play>`);
      twiml.push('<Pause length="1"/>');
    }
    twiml.push('<Hangup/>');
  }

  twiml.push('</Response>');
  res.setHeader('Content-Type', 'text/xml');
  return res.status(200).send(twiml.join(''));
}