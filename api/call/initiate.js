import twilio from 'twilio';

function encodeLines(lines) {
  return Buffer.from(JSON.stringify(lines)).toString('base64url');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { phone_number, lines } = req.body;

  if (!phone_number || !lines?.length) {
    return res.status(400).json({ error: 'phone_number and lines are required' });
  }

  try {
    const client  = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    const encoded = encodeLines(lines);
    const baseUrl = process.env.APP_URL || `https://${process.env.VERCEL_URL}`;

    const call = await client.calls.create({
      to:     phone_number,
      from:   process.env.TWILIO_PHONE_NUMBER,
      url:    `${baseUrl}/api/call/webhook/start?lines=${encoded}&turn=0`,
      method: 'POST',
      machineDetection: 'DetectMessageEnd',  // waits for voicemail beep before playing
    });

    return res.status(200).json({ call_sid: call.sid });
  } catch (err) {
    console.error('[call/initiate]', err);
    return res.status(500).json({ error: err.message });
  }
}