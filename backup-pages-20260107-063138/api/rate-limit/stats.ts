// pages/api/admin/rate-limit/stats.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getRateLimiterStats, resetRateLimit, unblock } from '@/lib/rate-limit';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // TODO: Add admin authentication here
  // if (!isAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });

  if (req.method === 'GET') {
    // Get stats
    const stats = getRateLimiterStats();
    return res.status(200).json(stats);
  }

  if (req.method === 'POST') {
    const { action, key } = req.body;

    if (!key) {
      return res.status(400).json({ error: 'Key required' });
    }

    switch (action) {
      case 'reset':
        const resetSuccess = resetRateLimit(key);
        return res.status(200).json({ 
          success: resetSuccess,
          message: resetSuccess ? 'Rate limit reset' : 'Key not found'
        });

      case 'unblock':
        unblock(key);
        return res.status(200).json({ 
          success: true,
          message: 'Key unblocked'
        });

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

