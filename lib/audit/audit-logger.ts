// lib/audit/audit-logger.ts - COMPLETE PRODUCTION READY
import { PrismaClient, type SystemAuditLog } from '@prisma/client';

export type AuditSeverity = 'info' | 'warning' | 'error' | 'critical';
export type AuditCategory = 'auth' | 'admin' | 'user' | 'content' | 'system' | 'security' | 'api';

export interface AuditEvent {
  // Core identification
  action: string;
  actorId?: string;
  actorType?: string;
  actorEmail?: string;
  
  // Resource being acted upon
  resourceType?: string;
  resourceId?: string;
  resourceName?: string;
  
  // Event details
  details?: Record<string, any>;
  severity: AuditSeverity;
  category?: AuditCategory;
  subCategory?: string;
  
  // Technical context
  userAgent?: string;
  ipAddress?: string;
  requestId?: string;
  sessionId?: string;
  
  // Performance
  durationMs?: number;
  
  // Status
  status?: 'success' | 'failure' | 'pending';
  errorMessage?: string;
  
  // Metadata
  tags?: string[];
  metadata?: Record<string, any>;
  
  // System
  service?: string;
  environment?: string;
  version?: string;
  
  // Timestamp will be added automatically
}

export class ProductionAuditLogger {
  private prisma: PrismaClient;
  private service: string;
  private environment: string;
  private version: string;
  private enabled: boolean;
  
  // Cache for batch operations
  private batchQueue: SystemAuditLog[] = [];
  private batchSize = 50;
  private batchTimeout: NodeJS.Timeout | null = null;
  private batchInterval = 5000; // 5 seconds

  constructor(config: { 
    prisma: PrismaClient; 
    service: string; 
    environment: string;
    version?: string;
    enabled?: boolean;
  }) {
    this.prisma = config.prisma;
    this.service = config.service;
    this.environment = config.environment;
    this.version = config.version || '1.0.0';
    this.enabled = config.enabled ?? true;
    
    // Setup batch processing
    this.setupBatchProcessing();
  }

  private setupBatchProcessing() {
    // Only enable batching in production
    if (this.environment === 'production') {
      this.batchTimeout = setInterval(async () => {
        await this.flushBatch();
      }, this.batchInterval);
    }
  }

  async log(event: Omit<AuditEvent, 'timestamp'>): Promise<SystemAuditLog | null> {
    if (!this.enabled) return null;

    try {
      const fullEvent = this.normalizeEvent(event);
      
      // In development, always log to console for visibility
      if (this.environment === 'development' || this.environment === 'test') {
        this.consoleLog(fullEvent);
      }

      // For high-severity events, log immediately
      if (event.severity === 'critical' || event.severity === 'error') {
        return await this.createLogEntry(fullEvent);
      }

      // For other events, use batching in production
      if (this.environment === 'production' && this.batchQueue) {
        const logEntry = this.createLogEntryFromEvent(fullEvent);
        this.batchQueue.push(logEntry);
        
        // Flush if batch is full
        if (this.batchQueue.length >= this.batchSize) {
          await this.flushBatch();
        }
        
        return logEntry;
      }

      // Fallback to immediate logging
      return await this.createLogEntry(fullEvent);

    } catch (error) {
      // Never fail the main operation due to audit logging
      console.error('[AuditLogger] Failed to log event:', error);
      return null;
    }
  }

  private normalizeEvent(event: Omit<AuditEvent, 'timestamp'>): AuditEvent {
    return {
      ...event,
      service: event.service || this.service,
      environment: event.environment || this.environment,
      version: event.version || this.version,
    };
  }

  private consoleLog(event: AuditEvent): void {
    const timestamp = new Date().toISOString();
    const color = this.getSeverityColor(event.severity);
    const emoji = this.getSeverityEmoji(event.severity);
    
    console.groupCollapsed(
      `%c${emoji} [AUDIT:${event.severity.toUpperCase()}] ${event.action}`,
      `color: ${color}; font-weight: bold;`
    );
    console.log('📅 Timestamp:', timestamp);
    console.log('👤 Actor:', event.actorEmail || event.actorId || 'Anonymous');
    console.log('🎯 Action:', event.action);
    console.log('📊 Category:', event.category || 'general');
    
    if (event.resourceType) {
      console.log('📦 Resource:', `${event.resourceType}${event.resourceId ? `#${event.resourceId}` : ''}`);
    }
    
    if (event.details && Object.keys(event.details).length > 0) {
      console.log('📋 Details:', event.details);
    }
    
    if (event.ipAddress || event.userAgent) {
      console.log('🌐 Context:', {
        ip: event.ipAddress,
        userAgent: event.userAgent?.substring(0, 100)
      });
    }
    
    if (event.durationMs) {
      console.log('⏱️ Duration:', `${event.durationMs}ms`);
    }
    
    console.groupEnd();
  }

  private getSeverityColor(severity: AuditSeverity): string {
    switch (severity) {
      case 'info': return '#3498db'; // Blue
      case 'warning': return '#f39c12'; // Orange
      case 'error': return '#e74c3c'; // Red
      case 'critical': return '#8b0000'; // Dark Red
      default: return '#95a5a6'; // Gray
    }
  }

  private getSeverityEmoji(severity: AuditSeverity): string {
    switch (severity) {
      case 'info': return 'ℹ️';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      case 'critical': return '🚨';
      default: return '📝';
    }
  }

  private createLogEntryFromEvent(event: AuditEvent): SystemAuditLog {
    return {
      id: '', // Will be generated by database
      actorType: event.actorType || 'system',
      actorId: event.actorId || undefined,
      actorEmail: event.actorEmail || undefined,
      ipAddress: event.ipAddress || undefined,
      action: event.action,
      resourceType: event.resourceType || 'system',
      resourceId: event.resourceId || undefined,
      oldValue: undefined,
      newValue: undefined,
      userAgent: event.userAgent || undefined,
      requestId: event.requestId || undefined,
      sessionId: event.sessionId || undefined,
      status: event.status || 'success',
      severity: event.severity || 'info',
      errorMessage: event.errorMessage || undefined,
      durationMs: event.durationMs || undefined,
      metadata: event.metadata ? JSON.stringify(event.metadata) : undefined,
      category: event.category || undefined,
      subCategory: event.subCategory || undefined,
      tags: event.tags ? JSON.stringify(event.tags) : undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as SystemAuditLog;
  }

  private async createLogEntry(event: AuditEvent): Promise<SystemAuditLog> {
    try {
      return await this.prisma.systemAuditLog.create({
        data: {
          actorType: event.actorType || 'system',
          actorId: event.actorId,
          actorEmail: event.actorEmail,
          ipAddress: event.ipAddress,
          action: event.action,
          resourceType: event.resourceType || 'system',
          resourceId: event.resourceId,
          userAgent: event.userAgent,
          requestId: event.requestId,
          sessionId: event.sessionId,
          status: event.status || 'success',
          severity: event.severity || 'info',
          errorMessage: event.errorMessage,
          durationMs: event.durationMs,
          metadata: event.metadata ? JSON.stringify(event.metadata) : undefined,
          category: event.category,
          subCategory: event.subCategory,
          tags: event.tags ? JSON.stringify(event.tags) : undefined,
        },
      });
    } catch (error) {
      console.error('[AuditLogger] Failed to create log entry:', error);
      throw error;
    }
  }

  private async flushBatch(): Promise<void> {
    if (this.batchQueue.length === 0) return;

    const batchToProcess = [...this.batchQueue];
    this.batchQueue = [];

    try {
      await this.prisma.systemAuditLog.createMany({
        data: batchToProcess,
        skipDuplicates: true,
      });
      
      if (this.environment === 'development') {
        console.log(`[AuditLogger] Flushed ${batchToProcess.length} log entries`);
      }
    } catch (error) {
      console.error('[AuditLogger] Batch insert failed:', error);
      // Optionally retry or move to dead letter queue
    }
  }

  // ==================== QUERY METHODS ====================

  async query(filters: {
    actorId?: string;
    actorEmail?: string;
    action?: string;
    resourceType?: string;
    resourceId?: string;
    severity?: AuditSeverity;
    category?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<SystemAuditLog[]> {
    const where: any = {};

    if (filters.actorId) where.actorId = filters.actorId;
    if (filters.actorEmail) where.actorEmail = filters.actorEmail;
    if (filters.action) where.action = filters.action;
    if (filters.resourceType) where.resourceType = filters.resourceType;
    if (filters.resourceId) where.resourceId = filters.resourceId;
    if (filters.severity) where.severity = filters.severity;
    if (filters.category) where.category = filters.category;
    
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    return this.prisma.systemAuditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filters.limit || 100,
      skip: filters.offset || 0,
    });
  }

  async getStats(filters: {
    startDate: Date;
    endDate: Date;
    groupBy?: 'hour' | 'day' | 'week' | 'month';
  }): Promise<any> {
    const logs = await this.prisma.systemAuditLog.findMany({
      where: {
        createdAt: {
          gte: filters.startDate,
          lte: filters.endDate,
        },
      },
      select: {
        createdAt: true,
        action: true,
        severity: true,
        status: true,
        category: true,
      },
    });

    // Group by time period
    const grouped = logs.reduce((acc, log) => {
      const date = new Date(log.createdAt);
      let key: string;
      
      switch (filters.groupBy || 'day') {
        case 'hour':
          key = date.toISOString().slice(0, 13); // YYYY-MM-DDTHH
          break;
        case 'week':
          const weekNumber = Math.ceil((date.getDate() + 6) / 7);
          key = `${date.getFullYear()}-W${weekNumber}`;
          break;
        case 'month':
          key = date.toISOString().slice(0, 7); // YYYY-MM
          break;
        case 'day':
        default:
          key = date.toISOString().slice(0, 10); // YYYY-MM-DD
      }
      
      if (!acc[key]) {
        acc[key] = {
          total: 0,
          bySeverity: { info: 0, warning: 0, error: 0, critical: 0 },
          byStatus: { success: 0, failure: 0 },
          topActions: new Map<string, number>(),
        };
      }
      
      const group = acc[key];
      group.total++;
      group.bySeverity[log.severity] = (group.bySeverity[log.severity] || 0) + 1;
      group.byStatus[log.status] = (group.byStatus[log.status] || 0) + 1;
      
      const actionCount = group.topActions.get(log.action) || 0;
      group.topActions.set(log.action, actionCount + 1);
      
      return acc;
    }, {} as Record<string, any>);

    return grouped;
  }

  async cleanupOldLogs(retentionDays: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await this.prisma.systemAuditLog.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
        severity: { not: 'critical' }, // Keep critical logs longer
      },
    });

    return result.count;
  }

  // ==================== SPECIFIC AUDIT METHODS ====================

  async logAuthEvent(
    userId: string,
    action: string,
    details: {
      success: boolean;
      method?: string;
      provider?: string;
      mfaUsed?: boolean;
      ipAddress?: string;
      userAgent?: string;
      error?: string;
    }
  ): Promise<void> {
    await this.log({
      actorId: userId,
      actorType: 'user',
      action: `AUTH_${action.toUpperCase()}`,
      category: 'auth',
      severity: details.success ? 'info' : 'warning',
      status: details.success ? 'success' : 'failure',
      details: {
        method: details.method,
        provider: details.provider,
        mfaUsed: details.mfaUsed,
      },
      ipAddress: details.ipAddress,
      userAgent: details.userAgent,
      errorMessage: details.error,
      metadata: { authEvent: true },
    });
  }

  async logAdminEvent(
    adminId: string,
    adminEmail: string,
    action: string,
    details: {
      resourceType?: string;
      resourceId?: string;
      changes?: Record<string, any>;
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<void> {
    await this.log({
      actorId: adminId,
      actorEmail: adminEmail,
      actorType: 'admin',
      action: `ADMIN_${action.toUpperCase()}`,
      resourceType: details.resourceType,
      resourceId: details.resourceId,
      category: 'admin',
      severity: 'info',
      details: details.changes,
      ipAddress: details.ipAddress,
      userAgent: details.userAgent,
      metadata: { adminEvent: true },
    });
  }

  async logSecurityEvent(
    actorId: string,
    action: string,
    details: {
      severity: AuditSeverity;
      threatType?: string;
      sourceIp?: string;
      userAgent?: string;
      blocked?: boolean;
      reason?: string;
    }
  ): Promise<void> {
    await this.log({
      actorId,
      actorType: details.severity === 'critical' ? 'attacker' : 'user',
      action: `SECURITY_${action.toUpperCase()}`,
      category: 'security',
      severity: details.severity,
      details: {
        threatType: details.threatType,
        blocked: details.blocked,
        reason: details.reason,
      },
      ipAddress: details.sourceIp,
      userAgent: details.userAgent,
      metadata: { securityEvent: true },
    });
  }

  // ==================== UTILITY METHODS ====================

  async getRecentEvents(limit: number = 50): Promise<SystemAuditLog[]> {
    return this.prisma.systemAuditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getEventById(id: string): Promise<SystemAuditLog | null> {
    return this.prisma.systemAuditLog.findUnique({
      where: { id },
    });
  }

  async searchEvents(query: string): Promise<SystemAuditLog[]> {
    return this.prisma.systemAuditLog.findMany({
      where: {
        OR: [
          { action: { contains: query, mode: 'insensitive' } },
          { actorEmail: { contains: query, mode: 'insensitive' } },
          { resourceType: { contains: query, mode: 'insensitive' } },
          { errorMessage: { contains: query, mode: 'insensitive' } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  // ==================== CLEANUP ====================

  async destroy(): Promise<void> {
    if (this.batchTimeout) {
      clearInterval(this.batchTimeout);
      this.batchTimeout = null;
    }
    
    // Flush any remaining logs
    await this.flushBatch();
    
    if (this.environment === 'development') {
      console.log('[AuditLogger] Clean shutdown completed');
    }
  }
}

// ==================== SINGLETON INSTANCE ====================

let auditLoggerInstance: ProductionAuditLogger | null = null;

export function getAuditLogger(): ProductionAuditLogger {
  if (!auditLoggerInstance) {
    throw new Error('AuditLogger not initialized. Call initializeAuditLogger first.');
  }
  return auditLoggerInstance;
}

export function initializeAuditLogger(config: {
  prisma: PrismaClient;
  service: string;
  environment?: string;
  version?: string;
}): ProductionAuditLogger {
  if (!auditLoggerInstance) {
    auditLoggerInstance = new ProductionAuditLogger({
      prisma: config.prisma,
      service: config.service,
      environment: config.environment || process.env.NODE_ENV || 'development',
      version: config.version || process.env.APP_VERSION || '1.0.0',
      enabled: process.env.AUDIT_LOGGING_ENABLED !== 'false',
    });
    
    // Handle graceful shutdown
    if (typeof process !== 'undefined') {
      process.on('SIGTERM', async () => {
        await auditLoggerInstance?.destroy();
      });
      
      process.on('SIGINT', async () => {
        await auditLoggerInstance?.destroy();
      });
    }
  }
  
  return auditLoggerInstance;
}

// ==================== SIMPLE AUDIT LOGGER FOR IMMEDIATE USE ====================
// This provides a simple interface that handles initialization automatically

export const auditLogger = {
  // Initialize the logger if not already initialized
  async ensureInitialized(): Promise<ProductionAuditLogger> {
    if (!auditLoggerInstance) {
      const { prisma } = await import('@/lib/prisma');
      return initializeAuditLogger({
        prisma,
        service: 'admin-system',
        environment: process.env.NODE_ENV || 'development',
        version: process.env.APP_VERSION || '1.0.0'
      });
    }
    return auditLoggerInstance;
  },

  async log(options: Omit<AuditEvent, 'timestamp'>): Promise<SystemAuditLog | null> {
    try {
      const logger = await this.ensureInitialized();
      return await logger.log(options);
    } catch (error) {
      console.error('[AuditLogger] Failed to log event:', error);
      return null;
    }
  },

  async logAuthEvent(
    userId: string,
    action: string,
    details: {
      success: boolean;
      method?: string;
      provider?: string;
      mfaUsed?: boolean;
      ipAddress?: string;
      userAgent?: string;
      error?: string;
    }
  ): Promise<void> {
    try {
      const logger = await this.ensureInitialized();
      await logger.logAuthEvent(userId, action, details);
    } catch (error) {
      console.error('[AuditLogger] Failed to log auth event:', error);
    }
  },

  async logSecurityEvent(
    actorId: string,
    action: string,
    details: {
      severity: AuditSeverity;
      threatType?: string;
      sourceIp?: string;
      userAgent?: string;
      blocked?: boolean;
      reason?: string;
    }
  ): Promise<void> {
    try {
      const logger = await this.ensureInitialized();
      await logger.logSecurityEvent(actorId, action, details);
    } catch (error) {
      console.error('[AuditLogger] Failed to log security event:', error);
    }
  },

  async logAdminEvent(
    adminId: string,
    adminEmail: string,
    action: string,
    details: {
      resourceType?: string;
      resourceId?: string;
      changes?: Record<string, any>;
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<void> {
    try {
      const logger = await this.ensureInitialized();
      await logger.logAdminEvent(adminId, adminEmail, action, details);
    } catch (error) {
      console.error('[AuditLogger] Failed to log admin event:', error);
    }
  },

  // Query methods
  async query(filters: {
    actorId?: string;
    actorEmail?: string;
    action?: string;
    resourceType?: string;
    resourceId?: string;
    severity?: AuditSeverity;
    category?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<SystemAuditLog[]> {
    try {
      const logger = await this.ensureInitialized();
      return await logger.query(filters);
    } catch (error) {
      console.error('[AuditLogger] Failed to query logs:', error);
      return [];
    }
  },

  async getRecentEvents(limit: number = 50): Promise<SystemAuditLog[]> {
    try {
      const logger = await this.ensureInitialized();
      return await logger.getRecentEvents(limit);
    } catch (error) {
      console.error('[AuditLogger] Failed to get recent events:', error);
      return [];
    }
  }
};

// ==================== CLIENT-SIDE AUDIT LOGGER ====================
// For browser-only logging (doesn't require Prisma)

export class ClientAuditLogger {
  private service: string;
  private environment: string;

  constructor(config: { service: string; environment?: string }) {
    this.service = config.service;
    this.environment = config.environment || 'browser';
  }

  async log(event: Omit<AuditEvent, 'timestamp'>): Promise<void> {
    const fullEvent: AuditEvent = {
      ...event,
      service: this.service,
      environment: this.environment,
    };

    // Always log to console in browser
    this.consoleLog(fullEvent);

    // Save to localStorage for debugging
    try {
      const logs = JSON.parse(localStorage.getItem('audit_logs') || '[]');
      logs.unshift(fullEvent);
      if (logs.length > 100) logs.pop();
      localStorage.setItem('audit_logs', JSON.stringify(logs));
    } catch (error) {
      console.warn('[ClientAuditLogger] Failed to save to localStorage:', error);
    }

    // Send to server if possible
    try {
      await fetch('/api/audit/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullEvent),
      });
    } catch (error) {
      // Silently fail - client logging shouldn't break the app
    }
  }

  private consoleLog(event: AuditEvent): void {
    const color = this.getSeverityColor(event.severity);
    const emoji = this.getSeverityEmoji(event.severity);
    
    console.log(
      `%c${emoji} [${this.service.toUpperCase()}] ${event.action}`,
      `color: ${color}; font-weight: bold;`,
      event.details || ''
    );
  }

  private getSeverityColor(severity: AuditSeverity): string {
    switch (severity) {
      case 'info': return '#3498db';
      case 'warning': return '#f39c12';
      case 'error': return '#e74c3c';
      case 'critical': return '#8b0000';
      default: return '#95a5a6';
    }
  }

  private getSeverityEmoji(severity: AuditSeverity): string {
    switch (severity) {
      case 'info': return 'ℹ️';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      case 'critical': return '🚨';
      default: return '📝';
    }
  }

  query(filters: Partial<AuditEvent>): AuditEvent[] {
    try {
      const logs = JSON.parse(localStorage.getItem('audit_logs') || '[]');
      return logs.filter((log: AuditEvent) => {
        return Object.entries(filters).every(([key, value]) => 
          log[key as keyof AuditEvent] === value
        );
      });
    } catch {
      return [];
    }
  }
}

// ==================== EXPORTS ====================

export default {
  ProductionAuditLogger,
  ClientAuditLogger,
  getAuditLogger,
  initializeAuditLogger,
  auditLogger
};