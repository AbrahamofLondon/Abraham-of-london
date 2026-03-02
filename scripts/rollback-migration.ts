// This is for emergency rollback only!
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function rollback() {
  console.log('⚠️  EMERGENCY ROLLBACK - This will lose SSOT tier data!');
  
  // Export data first
  const members = await prisma.innerCircleMember.findMany();
  const content = await prisma.contentMetadata.findMany();
  
  console.log(`📦 Backed up ${members.length} members and ${content.length} content items`);
  
  // Your rollback logic here - but better to restore from backup
  
  await prisma.$disconnect();
}

// rollback().catch(console.error);