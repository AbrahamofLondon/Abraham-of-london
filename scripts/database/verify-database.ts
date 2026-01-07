/* scripts/database/verify-database.ts */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyDatabase() {
  console.log('🔍 Verifying database connection and structure...');

  try {
    // Test connection
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database connection successful');

    // Check if tables exist (example for a users table)
    try {
      const tables = await prisma.$queryRaw`
        SELECT name FROM sqlite_master 
        WHERE type='table' 
        AND name NOT LIKE 'sqlite_%'
        AND name NOT LIKE '_prisma_%'
      `;
      
      console.log(`📊 Found ${(tables as any[]).length} tables`);
      (tables as any[]).forEach((table: any) => {
        console.log(`   - ${table.name}`);
      });
    } catch (error) {
      console.log('📊 Cannot list tables (might be PostgreSQL or other issue)');
    }

    // Verify environment
    console.log('\n📋 Environment check:');
    console.log(`   DATABASE_URL: ${process.env.DATABASE_URL?.split('@')[0]}@***`);
    console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
    
    console.log('\n✅ Database verification passed!');
  } catch (error) {
    console.error('❌ Database verification failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

verifyDatabase()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));