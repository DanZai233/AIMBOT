import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from '@upstash/redis';

const VALID_MODES = ['GRIDSHOT', 'SPIDERSHOT', 'MICROFLICK', 'TRACKING', 'FPS3D'];
const MAX_ENTRIES = 200;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return res.status(503).json({ error: 'Leaderboard not configured' });
  }

  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });

  try {
    if (req.method === 'POST') {
      const { mode, name, tag, score, accuracy, hits, misses } = req.body ?? {};
      if (!mode || !name || !tag || score == null || !VALID_MODES.includes(mode)) {
        return res.status(400).json({ error: 'Invalid payload' });
      }
      if (typeof score !== 'number' || score < 0 || score > 999999) {
        return res.status(400).json({ error: 'Invalid score' });
      }

      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const entry = JSON.stringify({
        id, name: String(name).slice(0, 20), tag: String(tag).slice(0, 30),
        score: Math.round(score),
        accuracy: Math.round((Number(accuracy) || 0) * 10) / 10,
        hits: Number(hits) || 0, misses: Number(misses) || 0,
        ts: Date.now(),
      });

      await redis.zadd(`lb:${mode}`, { score: Math.round(score), member: entry });

      const count = await redis.zcard(`lb:${mode}`);
      if (count > MAX_ENTRIES) {
        await redis.zremrangebyrank(`lb:${mode}`, 0, count - MAX_ENTRIES - 1);
      }

      return res.status(200).json({ ok: true, id });
    }

    if (req.method === 'GET') {
      const mode = req.query.mode as string;
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
      if (!mode || !VALID_MODES.includes(mode)) {
        return res.status(400).json({ error: 'Invalid mode' });
      }

      const raw = await redis.zrange(`lb:${mode}`, 0, limit - 1, { rev: true });
      const entries = (raw as string[]).map((member, i) => {
        try {
          const data = typeof member === 'string' ? JSON.parse(member) : member;
          return { rank: i + 1, ...data };
        } catch { return null; }
      }).filter(Boolean);

      return res.status(200).json(entries);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Leaderboard error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
