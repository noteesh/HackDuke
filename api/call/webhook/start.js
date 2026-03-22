export default async function handler(req, res) {
  const params     = { ...req.query, ...req.body };
  const encoded    = params.lines;
  const answeredBy = params.AnsweredBy; // set by Twilio if machineDetection is on

  const twiml = ['<?xml version="1.0" encoding="UTF-8"?><Response>'];

  // If voicemail detected, leave a shorter message
  if (answeredBy === 'machine_end_beep' || answeredBy === 'machine_end_silence') {
    twiml.push('<Say volume="10">Hello, this is an automated message from VerdictX. A formal appeal letter has been generated for your client. Please check your email for the full letter. Thank you.</Say>');
    twiml.push('<Hangup/>');
  } else if (!encoded) {
    twiml.push('<Say>Sorry, an error occurred. Goodbye.</Say><Hangup/>');
  } else {
    const lines = JSON.parse(Buffer.from(encoded, 'base64url').toString());
    for (const line of lines) {
      twiml.push(`<Say volume="10">${line}</Say>`);
      twiml.push('<Pause length="1"/>');
    }
    twiml.push('<Hangup/>');
  }

  twiml.push('</Response>');
  res.setHeader('Content-Type', 'text/xml');
  return res.status(200).send(twiml.join(''));
}