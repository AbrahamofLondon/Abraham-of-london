// pages/api/inner-circle/verify.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyInnerCircleKey, recordInnerCircleUnlock } from '@/lib/inner-circle';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { key } = req.body;

  if (!key || typeof key !== 'string') {
    return res.status(400).json({ message: 'Access key is required' });
  }

  try {
    // 1. Check if the key exists and is active
    const result = await verifyInnerCircleKey(key);

    if (!result.valid) {
      return res.status(401).json({ 
        success: false, 
        message: result.reason || 'Invalid or expired key' 
      });
    }

    // 2. Log the access event (Increment total_unlocks and update last_ip)
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    await recordInnerCircleUnlock(key, ip);

    // 3. Return success
    return res.status(200).json({
      success: true,
      memberId: result.memberId,
      keySuffix: result.keySuffix
    });

  } catch (error) {
    console.error('InnerCircle Verification Error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}