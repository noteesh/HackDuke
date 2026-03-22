// Vercel serverless function — user profile (demographic context for agents).
// GET  /api/profile?userId=auth0|xxx  → profile doc, or { exists: false } if none
// POST /api/profile                   → create profile (first-time survey)
// PUT  /api/profile                   → update profile (edit from dashboard)

import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'theoverride';
const COLLECTION = 'profiles';

let cachedClient = null;

async function getCollection() {
  if (!MONGODB_URI) throw new Error('Missing MONGODB_URI env var');
  if (!cachedClient) {
    cachedClient = new MongoClient(MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
    await cachedClient.connect();
  }
  return cachedClient.db(DB_NAME).collection(COLLECTION);
}

const PROFILE_FIELDS = [
  'raceEthnicity', 'gender', 'ageRange', 'incomeRange',
  'employmentStatus', 'creditScoreRange', 'state',
  'priorDenials', 'disabilityStatus', 'veteranStatus',
];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  try {
    const col = await getCollection();

    // ── GET ──────────────────────────────────────────────────────────────────
    if (req.method === 'GET') {
      const { userId } = req.query;
      if (!userId) return res.status(400).json({ error: 'Missing userId' });

      const doc = await col.findOne({ userId });
      if (!doc) return res.status(200).json({ exists: false });
      return res.status(200).json(doc);
    }

    // ── POST (create) ─────────────────────────────────────────────────────────
    if (req.method === 'POST') {
      const { userId, ...fields } = req.body || {};
      if (!userId) return res.status(400).json({ error: 'Missing userId' });

      const now = new Date();
      const doc = {
        userId,
        ...Object.fromEntries(PROFILE_FIELDS.map(f => [f, fields[f] ?? (f === 'raceEthnicity' ? [] : '')])),
        createdAt: now,
        updatedAt: now,
      };

      const result = await col.insertOne(doc);
      return res.status(201).json({ _id: result.insertedId, ...doc });
    }

    // ── PUT (update) ──────────────────────────────────────────────────────────
    if (req.method === 'PUT') {
      const { userId, ...fields } = req.body || {};
      if (!userId) return res.status(400).json({ error: 'Missing userId' });

      const updates = {
        ...Object.fromEntries(PROFILE_FIELDS.map(f => [f, fields[f] ?? (f === 'raceEthnicity' ? [] : '')])),
        updatedAt: new Date(),
      };

      const result = await col.findOneAndUpdate(
        { userId },
        { $set: updates },
        { returnDocument: 'after' }
      );

      if (!result) return res.status(404).json({ error: 'Profile not found' });
      return res.status(200).json(result);
    }

    res.status(405).json({ error: 'Method not allowed' });

  } catch (err) {
    console.error('[profile] Error:', err);
    if (req.method === 'GET') return res.status(200).json({ exists: false });
    res.status(500).json({ error: err.message });
  }
}
