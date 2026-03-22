// Vercel serverless function — user case history via MongoDB.
// GET  /api/cases?userId=auth0|xxx  → array of cases, newest first
// POST /api/cases                   → save a completed case

import { MongoClient, ObjectId } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'theoverride';
const COLLECTION = 'cases';

// Reuse connection across warm invocations (Vercel caches module scope)
let cachedClient = null;

async function getCollection() {
  if (!MONGODB_URI) throw new Error('Missing MONGODB_URI env var');
  if (!cachedClient) {
    cachedClient = new MongoClient(MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
    await cachedClient.connect();
  }
  return cachedClient.db(DB_NAME).collection(COLLECTION);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  try {
    const col = await getCollection();

    // ── GET: fetch case list or single case ───────────────────────────────────
    if (req.method === 'GET') {
      const { userId, caseId } = req.query;
      if (!userId) return res.status(400).json({ error: 'Missing userId' });

      // Single case fetch (for replay)
      if (caseId) {
        const doc = await col.findOne({ _id: new ObjectId(caseId), userId });
        if (!doc) return res.status(404).json({ error: 'Case not found' });
        return res.status(200).json(doc);
      }

      // List fetch — only the fields needed for the dashboard card
      const cases = await col
        .find({ userId }, {
          projection: {
            _id: 1, createdAt: 1, denialText: 1, parsedDenial: 1,
            overrideTriggered: 1, concessionCount: 1, concededAgents: 1,
          },
        })
        .sort({ createdAt: -1 })
        .limit(50)
        .toArray();

      return res.status(200).json(cases);
    }

    // ── POST: save a completed case ───────────────────────────────────────────
    if (req.method === 'POST') {
      const {
        userId, denialText, parsedDenial,
        agents, rebuttals, rebuttalRounds, agentRounds,
        overrideTriggered, concessionCount, concededAgents, appealLetter,
      } = req.body || {};

      if (!userId)     return res.status(400).json({ error: 'Missing userId' });
      if (!denialText) return res.status(400).json({ error: 'Missing denialText' });

      const doc = {
        userId,
        denialText,
        parsedDenial:      parsedDenial      ?? null,
        agents:            agents            ?? null,
        rebuttals:         rebuttals         ?? null,
        rebuttalRounds:    rebuttalRounds    ?? [],
        agentRounds:       agentRounds       ?? {},
        overrideTriggered: overrideTriggered ?? false,
        concessionCount:   concessionCount   ?? 0,
        concededAgents:    concededAgents    ?? [],
        appealLetter:      appealLetter      ?? '',
        createdAt:         new Date(),
      };

      const result = await col.insertOne(doc);
      return res.status(201).json({ _id: result.insertedId, ...doc });
    }

    res.status(405).json({ error: 'Method not allowed' });

  } catch (err) {
    console.error('[cases] Error:', err);
    // If MongoDB not configured, return empty list gracefully on GET
    if (req.method === 'GET') return res.status(200).json([]);
    res.status(500).json({ error: err.message });
  }
}
