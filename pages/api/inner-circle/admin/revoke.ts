import type { NextApiRequest, NextApiResponse } from 'next';
import { revokeInnerCircleKey } from '@/lib/server/inner-circle-store';
import { getKeySuffix, auditLog } from '@/lib/server/utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { key, adminSecret, reason } = req.body;

  // 1. Strict Authorization
  if (adminSecret !== process.env.INNER_CIRCLE_ADMIN_KEY) {
    auditLog("unauthorized_admin_attempt", { ip: req.headers['x-forwarded-for'] });
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (!key) return res.status(400).json({ error: 'Key required' });

  try {
    // 2. Perform Revocation
    const success = await revokeInnerCircleKey(key.trim());

    if (success) {
      const suffix = getKeySuffix(key);
      auditLog("key_revoked_manually", { suffix, reason: reason || 'none' });
      return res.status(200).json({ ok: true, message: `Key ending in ${suffix} revoked.` });
    }

    return res.status(404).json({ ok: false, error: 'Key not found in store' });
  } catch (error) {
    console.error('[Admin API Error]:', error);
    return res.status(500).json({ error: 'Internal storage failure' });
  }
}