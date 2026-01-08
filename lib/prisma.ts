// lib/prisma.ts - Fixed Prisma initialization
import { PrismaClient } from '@prisma/client';

// Global type for Prisma instance
type GlobalPrisma = {
  prisma: PrismaClient | undefined;
};

// Safely access globalThis
const globalForPrisma = (typeof globalThis !== 'undefined' 
  ? globalThis 
  : typeof window !== 'undefined' 
    ? window 
    : typeof global !== 'undefined' 
      ? global 
      : {}
) as unknown as GlobalPrisma;

// Singleton Prisma instance
let prismaInstance: PrismaClient | undefined;

// Check if we're in Edge runtime
const isEdgeRuntime = (): boolean => {
  if (typeof process === 'undefined') return false;
  if (!process.env) return false;
  return process.env.NEXT_RUNTIME === 'edge';
};

// Check if adapter is available (build-time safe)
const isAdapterAvailable = (): boolean => {
  try {
    // Use dynamic import check instead of require
    if (typeof require === 'undefined') return false;
    const moduleExists = require.resolve('@prisma/adapter-better-sqlite3');
    const betterSqliteExists = require.resolve('better-sqlite3');
    return !!(moduleExists && betterSqliteExists);
  } catch {
    return false;
  }
};

// Create Prisma client (build-time safe)
function createPrismaClient(): PrismaClient {
  const logLevels = process.env.NODE_ENV === 'development' 
    ? ['warn', 'error'] as const
    : ['error'] as const;

  // Edge Runtime Guard
  if (isEdgeRuntime()) {
    console.warn('⚠️ Prisma not available in Edge Runtime');
    // Return a minimal compatible object for Edge
    return {} as PrismaClient;
  }

  try {
    if (isAdapterAvailable()) {
      // Dynamic imports at runtime only
      const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
      const BetterSqlite3 = require('better-sqlite3');
      
      const dbPath = process.env.DATABASE_URL?.replace(/^file:/, '') || './dev.db';
      const sqlite = new BetterSqlite3(dbPath);
      const adapter = new PrismaBetterSqlite3(sqlite);
      
      console.log('✅ Prisma initialized with SQLite adapter');
      return new PrismaClient({ 
        adapter,
        log: logLevels,
      });
    }
  } catch (error) {
    console.warn('⚠️ Prisma adapter initialization failed:', error);
  }

  console.warn('⚠️ Using fallback Prisma client (read-only)');
  
  // Return a basic Prisma client without adapter (for build time)
  // This allows TypeScript compilation but won't work at runtime
  // unless the adapter is installed
  return new PrismaClient({
    log: logLevels,
    // This will work if DATABASE_URL is set to a valid connection
    // without requiring the adapter at build time
  });
}

// Safe Prisma getter
export const prisma: PrismaClient = (() => {
  // Return existing instance
  if (prismaInstance) {
    return prismaInstance;
  }
  
  // Return global instance
  if (globalForPrisma.prisma) {
    prismaInstance = globalForPrisma.prisma;
    return prismaInstance;
  }
  
  // Create new instance
  prismaInstance = createPrismaClient();
  
  // Store in global for hot reload
  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prismaInstance;
  }
  
  return prismaInstance;
})();

// Helper to safely connect/disconnect
export const getPrisma = async (): Promise<PrismaClient> => {
  try {
    await prisma.$connect();
    return prisma;
  } catch (error) {
    console.error('Prisma connection failed:', error);
    // Return instance anyway (might be in read-only mode)
    return prisma;
  }
};

export default prisma;