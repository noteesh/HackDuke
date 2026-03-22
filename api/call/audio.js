// Twilio calls this endpoint to fetch audio for each line.
// The text is passed as a base64url-encoded query param so no storage is needed.

export default async function handler(req, res) {
  const { text: encodedText } = req.query;

  if (!encodedText) {
    return res.status(400).send('Missing text param');
  }

  const text    = Buffer.from(encodedText, 'base64url').toString();
  const voiceId = process.env.ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL';

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method:  'POST',
        headers: {
          'xi-api-key':   process.env.ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          model_id:       'eleven_turbo_v2',
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      console.error('[call/audio] ElevenLabs error:', err);
      return res.status(502).send('ElevenLabs error');
    }

    const audioBuffer = Buffer.from(await response.arrayBuffer());
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.send(audioBuffer);
  } catch (err) {
    console.error('[call/audio]', err);
    return res.status(500).send(err.message);
  }
}