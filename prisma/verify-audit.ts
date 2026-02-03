// verify-audit.ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkAudit() {
  const latestLog = await prisma.systemAuditLog.findFirst({
    where: { action: 'DATABASE_SEED_COMPLETE' },
    orderBy: { createdAt: 'desc' },
  });

  console.log('📜 LATEST SYSTEM AUDIT:', JSON.stringify(latestLog, null, 2));
  await prisma.$disconnect();
}

checkAudit();