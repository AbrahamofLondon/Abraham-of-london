// lib/prisma.ts
// Prisma 7.2.0 Client with SQLite adapter

import { PrismaClient } from '@prisma/client';

// Try to load the SQLite adapter (may fail if not installed)
let prisma: PrismaClient;

try {
  // Dynamic imports for optional dependencies
  const { PrismaBetterSqlite3 } = await import('@prisma/adapter-better-sqlite3');
  const BetterSqlite3 = (await import('better-sqlite3')).default;
  
  // Get database path from environment
  const dbPath = process.env.DATABASE_URL?.replace(/^file:/, '') || './dev.db';
  
  // Create SQLite instance and adapter
  const sqlite = new BetterSqlite3(dbPath);
  const adapter = new PrismaBetterSqlite3(sqlite);
  
  // Create PrismaClient with adapter for Prisma 7
  prisma = new PrismaClient({ 
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
  });
  
  console.log('✅ Prisma Client initialized with SQLite adapter');
  
} catch (error) {
  // Fallback for development or if adapter not installed
  console.warn('⚠️ SQLite adapter not available, using default PrismaClient');
  console.warn('Install with: npm install @prisma/adapter-better-sqlite3 better-sqlite3');
  
  prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });
}

// Global singleton for development (prevents multiple instances during hot reload)
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient;
};

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;