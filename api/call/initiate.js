import twilio from 'twilio';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { phone_number, lines } = req.body;
  if (!phone_number || !lines?.length) return res.status(400).json({ error: 'phone_number and lines required' });

  try {
    const client  = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    const baseUrl = process.env.VITE_API_URL;

    // Build TwiML directly here instead of passing lines via URL
    const twimlLines = ['<?xml version="1.0" encoding="UTF-8"?><Response>'];
    for (const line of lines) {
      const encodedText = Buffer.from(line).toString('base64url');
      twimlLines.push(`<Play volume="20">${baseUrl}/api/call/audio?text=${encodedText}</Play>`);
      twimlLines.push('<Pause length="1"/>');
    }
    twimlLines.push('<Hangup/>');
    const twimlString = twimlLines.join('');

    const call = await client.calls.create({
      to:     phone_number,
      from:   process.env.TWILIO_PHONE_NUMBER,
      twiml:  twimlString,  // pass TwiML directly, no webhook needed
    });

    return res.status(200).json({ call_sid: call.sid });
  } catch (err) {
    console.error('[call/initiate]', err);
    return res.status(500).json({ error: err.message });
  }
}