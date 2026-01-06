// pages/api/users.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { withApiRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/server/rateLimit';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Your API logic here
  res.status(200).json({ message: 'Success' });
}

export default withApiRateLimit(handler, RATE_LIMIT_CONFIGS.API_GENERAL);
