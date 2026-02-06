/* lib/auth/key-generator.ts */
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { prisma } from '@/lib/prisma';

export async function generatePrincipalKey(memberId: string, tier: string = 'inner-circle') {
  // 1. Generate 32-byte (256-bit) high-entropy raw key
  const rawKey = `AOL-${crypto.randomBytes(24).toString('hex').toUpperCase()}`;
  
  // 2. Hash the key for the database (Institutional Standard: 12 Rounds)
  const keyHash = await bcrypt.hash(rawKey, 12);
  const keySuffix = rawKey.slice(-4); // For identification in logs

  // 3. Persist Key Metadata
  await prisma.innerCircleKey.create({
    data: {
      memberId,
      keyHash,
      keySuffix,
      status: 'active',
      keyType: tier,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 Year default
    }
  });

  // 4. Return RAW KEY (This is the only time it is visible)
  return {
    rawKey,
    keySuffix,
    instructions: "Provide this key to the Principal. It cannot be recovered once this session ends."
  };
}