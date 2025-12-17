import type { NextApiRequest, NextApiResponse } from 'next';
import { revokeInnerCircleKey } from '@/lib/inner-circle';
import { getKeySuffix } from '@/lib/server/utils'; // Use your utils for logging

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { key, adminSecret } = req.body;

  if (adminSecret !== process.env.INNER_CIRCLE_ADMIN_KEY) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const success = await revokeInnerCircleKey(key.trim());

    if (success) {
      // Use your suffix helper for the log
      const suffix = getKeySuffix(key);
      console.info(`[Admin] Revoked key ending in: ${suffix}`);
      
      return res.status(200).json({ ok: true });
    }
    return res.status(404).json({ ok: false, error: 'Key not found' });
  } catch (error) {
    return res.status(500).json({ error: 'System failure' });
  }
}