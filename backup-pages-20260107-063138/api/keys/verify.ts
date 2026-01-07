/* pages/api/keys/verify.ts */
import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { key } = req.body;

  try {
    // 1. LOCATE AND VALIDATE KEY IN NEON
    const keyRecord = await prisma.innerCircleKey.findUnique({
      where: { keyHash: key }, // Use hashed keys for production security
      include: { member: true }
    });

    if (!keyRecord || keyRecord.status !== 'active' || (keyRecord.expiresAt && keyRecord.expiresAt < new Date())) {
      return res.status(200).json({ valid: false });
    }

    // 2. AUDIT LOGGING (Outcome Focused)
    await prisma.innerCircleKey.update({
      where: { id: keyRecord.id },
      data: {
        totalUnlocks: { increment: 1 },
        lastUsedAt: new Date(),
        lastIp: req.headers['x-forwarded-for']?.toString() || req.socket.remoteAddress
      }
    });

    return res.status(200).json({ valid: true, tier: keyRecord.member.tier });
  } catch (error) {
    return res.status(500).json({ valid: false });
  }
}

