// lib/prisma.ts - WITH OPTIONAL ADAPTER SUPPORT
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient;
};

export const prisma: PrismaClient = globalForPrisma.prisma || initPrisma();

async function initPrisma(): Promise<PrismaClient> {
  let client: PrismaClient;
  
  const logLevels = process.env.NODE_ENV === 'development' 
    ? ['warn', 'error'] 
    : ['error'];

  // OPTIONALLY use SQLite adapter if available AND requested
  if (process.env.PRISMA_USE_SQLITE_ADAPTER === 'true') {
    try {
      // Dynamic import - will fail if packages not installed
      const { PrismaBetterSqlite3 } = await import('@prisma/adapter-better-sqlite3');
      const BetterSqlite3 = (await import('better-sqlite3')).default;
      
      const dbPath = process.env.DATABASE_URL?.replace(/^file:/, '') || './dev.db';
      const sqlite = new BetterSqlite3(dbPath);
      const adapter = new PrismaBetterSqlite3(sqlite);
      
      client = new PrismaClient({ 
        adapter,
        log: logLevels,
      });
      console.log('✅ Prisma Client initialized with SQLite adapter');
    } catch (error) {
      console.warn('⚠️ SQLite adapter unavailable, falling back to default');
      console.warn('Install: npm install @prisma/adapter-better-sqlite3 better-sqlite3');
      client = new PrismaClient({ log: logLevels });
    }
  } else {
    // Default - no adapter
    client = new PrismaClient({ log: logLevels });
  }

  // Store in global for hot reload
  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = client;
  }

  return client;
}

export default prisma;