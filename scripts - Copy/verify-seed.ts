// scripts/verify-seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  adapter: {
    kind: 'sqlite',
    url: 'file:./prisma/dev.db',
  },
});

async function verify() {
  console.log('🔍 Verifying seed data...\n');
  
  try {
    // Count records
    const configCount = await prisma.systemConfig.count();
    const memberCount = await prisma.innerCircleMember.count();
    const contentCount = await prisma.contentMetadata.count();
    const keyCount = await prisma.innerCircleKey.count();
    const auditCount = await prisma.systemAuditLog.count();
    
    console.log('📊 Record Counts:');
    console.log(`   System Configs: ${configCount}`);
    console.log(`   Members: ${memberCount}`);
    console.log(`   Content Items: ${contentCount}`);
    console.log(`   Access Keys: ${keyCount}`);
    console.log(`   Audit Logs: ${auditCount}`);
    
    // Show some sample data
    console.log('\n📝 Sample Data:');
    
    const sampleConfig = await prisma.systemConfig.findFirst();
    console.log(`   Config: ${sampleConfig?.key} = ${sampleConfig?.value}`);
    
    const sampleMember = await prisma.innerCircleMember.findFirst();
    console.log(`   Member: ${sampleMember?.name} (${sampleMember?.tier})`);
    
    const sampleContent = await prisma.contentMetadata.findFirst();
    console.log(`   Content: ${sampleContent?.title}`);
    
    console.log('\n✅ Verification complete!');
    
  } catch (error: any) {
    console.error('❌ Verification failed:', error.message);
  }
}

verify()
  .finally(() => prisma.$disconnect());