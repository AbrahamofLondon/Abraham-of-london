import type { NextApiRequest, NextApiResponse } from 'next';
import { withRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/server/rateLimit-unified';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 1. Method Guard (Pages Router doesn't separate exports by method)
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 2. Your API Logic
  return res.status(200).json({ message: 'Success' });
}

// 3. Export the wrapped handler
export default withRateLimit(
  handler,
  RATE_LIMIT_CONFIGS.API_GENERAL
);
