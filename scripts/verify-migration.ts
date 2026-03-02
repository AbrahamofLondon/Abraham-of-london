import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyMigration() {
  console.log('🔍 Verifying SSOT migration...');

  // Check members
  const members = await prisma.innerCircleMember.findMany({
    take: 5,
    select: { id: true, tier: true, emailHash: true }
  });

  console.log('✅ Members with new tiers:');
  members.forEach(m => {
    console.log(`   - ${m.emailHash.substring(0, 8)}...: ${m.tier}`);
  });

  // Check content
  const content = await prisma.contentMetadata.findMany({
    take: 5,
    select: { slug: true, classification: true }
  });

  console.log('✅ Content with new classifications:');
  content.forEach(c => {
    console.log(`   - ${c.slug}: ${c.classification}`);
  });

  // Count by tier
  const memberTierCounts = await prisma.innerCircleMember.groupBy({
    by: ['tier'],
    _count: true
  });

  console.log('📊 Member distribution by tier:');
  memberTierCounts.forEach(t => {
    console.log(`   - ${t.tier}: ${t._count}`);
  });

  await prisma.$disconnect();
}

verifyMigration().catch(console.error);