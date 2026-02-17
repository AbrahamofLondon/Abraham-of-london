// lib/audit/init.ts - CORRECTED
import { auditLogger, initializeAuditLogger } from './audit-logger';

// Use any for the prisma client to avoid type issues
let prisma: any;

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
export { auditLogger };