// lib/prisma.ts - Simplified Prisma initialization without adapter dependencies
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

// Check if we're in a browser
const isBrowser = (): boolean => {
  return typeof window !== 'undefined';
};

// Create Prisma client (build-time safe)
function createPrismaClient(): PrismaClient {
  const logLevels = process.env.NODE_ENV === 'development' 
    ? ['warn', 'error'] as const
    : ['error'] as const;

  // Browser/Edge Runtime Guard
  if (isBrowser() || isEdgeRuntime()) {
    console.warn('⚠️ Prisma not available in Browser/Edge Runtime');
    // Return a minimal compatible object
    return new Proxy({} as PrismaClient, {
      get: (target, prop) => {
        if (prop === '$connect' || prop === '$disconnect' || prop === '$transaction') {
          return async () => ({});
        }
        if (prop === '$queryRaw' || prop === '$executeRaw') {
          return async () => [];
        }
        // Return mock functions for all other properties
        return () => {
          throw new Error('Prisma is not available in this runtime. Use server-side only.');
        };
      }
    });
  }

  // Server-side: Try to create real Prisma client
  try {
    console.log('✅ Prisma initialized');
    return new PrismaClient({
      log: logLevels,
      // Let Prisma handle the adapter automatically based on DATABASE_URL
      // No need to manually specify adapter
    });
  } catch (error) {
    console.error('⚠️ Prisma initialization failed:', error);
    
    // Return a mock client that won't crash
    return new Proxy({} as PrismaClient, {
      get: (target, prop) => {
        if (prop === '$connect' || prop === '$disconnect') {
          return async () => {
            console.warn('Prisma not properly initialized');
            return undefined;
          };
        }
        if (prop === '$queryRaw' || prop === '$executeRaw') {
          return async () => {
            console.warn('Prisma not properly initialized');
            return [];
          };
        }
        return () => {
          throw new Error(
            'Prisma requires proper database configuration. ' +
            'Set DATABASE_URL in your environment variables.'
          );
        };
      }
    });
  }
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

// Safe query helper
export async function safePrismaQuery<T>(query: () => Promise<T>): Promise<T | null> {
  try {
    if (isBrowser() || isEdgeRuntime()) {
      return null;
    }
    return await query();
  } catch (error) {
    console.error('Prisma query failed:', error);
    return null;
  }
}

export default prisma;