import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

try {
    const memberCount = await prisma.innerCircleMember.count();
    console.log('✅ InnerCircleMember count:', memberCount);
    
    const contentCount = await prisma.contentMetadata.count();
    console.log('✅ ContentMetadata count:', contentCount);
    
    const tables = await prisma.$queryRaw`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name`;
    console.log('✅ User tables found:', tables.length);
    
    await prisma.$disconnect();
} catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
}