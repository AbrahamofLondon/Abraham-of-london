// lib/audit/init.ts - CORRECTED
import { PrismaClient } from '.prisma/client';
import { initializeAuditLogger } from './audit-logger';

let prisma: PrismaClient;

// Initialize the audit logger on demand
export async function initAuditLogger() {
  if (!prisma) {
    const { prisma: importedPrisma } = await import('@/lib/prisma');
    prisma = importedPrisma;
  }
  
  return initializeAuditLogger({
    prisma,
    service: 'admin-system',
    environment: process.env.NODE_ENV || 'development',
    version: process.env.APP_VERSION || '1.0.0'
  });
}

// Export the auditLogger instance
export { auditLogger } from './audit-logger';