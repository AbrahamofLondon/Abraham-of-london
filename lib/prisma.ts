// lib/prisma.ts - Lazy Prisma initialization to avoid build-time errors
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

let prismaInstance: PrismaClient | undefined = undefined;

function createPrismaClient(): PrismaClient {
  const logLevels = process.env.NODE_ENV === 'development' 
    ? ['warn', 'error'] as const
    : ['error'] as const;

  try {
    // Try to use adapter if packages are installed
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
  } catch (adapterError) {
    console.warn('⚠️ Prisma adapter not available');
    console.warn('Install with: pnpm add @prisma/adapter-better-sqlite3');
    
    // Return a mock client that won't crash but won't work either
    // This allows the build to complete
    return new Proxy({} as PrismaClient, {
      get: (target, prop) => {
        if (prop === '$connect' || prop === '$disconnect') {
          return async () => {
            console.warn('Prisma not properly initialized - adapter required');
          };
        }
        return () => {
          throw new Error(
            'Prisma requires @prisma/adapter-better-sqlite3. ' +
            'Install with: pnpm add @prisma/adapter-better-sqlite3'
          );
        };
      }
    });
  }
}

// Lazy getter - only initializes when accessed
export const prisma = new Proxy({} as PrismaClient, {
  get: (target, prop) => {
    // Initialize on first access, not at import time
    if (!prismaInstance) {
      prismaInstance = globalForPrisma.prisma ?? createPrismaClient();
      
      if (process.env.NODE_ENV !== 'production') {
        globalForPrisma.prisma = prismaInstance;
      }
    }
    
    return (prismaInstance as any)[prop];
  }
});

export default prisma;