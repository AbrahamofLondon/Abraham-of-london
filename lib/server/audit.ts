/* lib/server/audit.ts */
// NOTE: Removed top-level prisma import to prevent Edge Runtime crashes
// import prisma from "@/lib/prisma"; 

/**
 * AUDIT EVENT INTERFACE
 * Principled Analysis: Aligns with the SystemAuditLog database schema.
 */
export interface AuditEvent {
  actorType: "system" | "api" | "member" | "admin" | "cron" | "webhook";
  actorId?: string | null;
  actorEmail?: string | null;
  ipAddress?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  status: "success" | "failed" | "warning" | "pending";
  severity?: "low" | "medium" | "high" | "critical";
  userAgent?: string | null;
  requestId?: string | null;
  sessionId?: string | null;
  oldValue?: string | null;
  newValue?: string | null;
  metadata?: Record<string, any> | null;
  details?: Record<string, any> | null;
  durationMs?: number;
  errorMessage?: string | null;
}

/**
 * AUDIT EVENT CATEGORIES
 */
export const AUDIT_CATEGORIES = {
  AUTHENTICATION: "authentication",
  AUTHORIZATION: "authorization",
  DATA_ACCESS: "data_access",
  DATA_MODIFICATION: "data_modification",
  SYSTEM_OPERATION: "system_operation",
  SECURITY: "security",
  COMPLIANCE: "compliance",
  PERFORMANCE: "performance",
  USER_ACTION: "user_action",
  API_CALL: "api_call",
  ADMIN_ACTION: "admin_action",
} as const;

/**
 * COMMON AUDIT ACTIONS
 */
export const AUDIT_ACTIONS = {
  // Authentication
  LOGIN_SUCCESS: "login_success",
  LOGIN_FAILED: "login_failed",
  LOGOUT: "logout",
  SESSION_CREATED: "session_created",
  SESSION_EXPIRED: "session_expired",
  
  // Authorization
  ACCESS_GRANTED: "access_granted",
  ACCESS_DENIED: "access_denied",
  PERMISSION_CHANGED: "permission_changed",
  
  // Data Operations
  CREATE: "create",
  READ: "read",
  UPDATE: "update",
  DELETE: "delete",
  EXPORT: "export",
  IMPORT: "import",
  
  // System Operations
  CONFIGURATION_CHANGE: "configuration_change",
  MAINTENANCE_START: "maintenance_start",
  MAINTENANCE_END: "maintenance_end",
  BACKUP_CREATED: "backup_created",
  RESTORE_INITIATED: "restore_initiated",
  
  // Security
  RATE_LIMIT_HIT: "rate_limit_hit",
  SUSPICIOUS_ACTIVITY: "suspicious_activity",
  IP_BLOCKED: "ip_blocked",
  USER_BLOCKED: "user_blocked",
  
  // User Actions
  PROFILE_UPDATED: "profile_updated",
  PASSWORD_CHANGED: "password_changed",
  EMAIL_VERIFIED: "email_verified",
  
  // API Operations
  API_CALL: "api_call",
  API_ERROR: "api_error",
  WEBHOOK_RECEIVED: "webhook_received",
  WEBHOOK_PROCESSED: "webhook_processed",
} as const;

export interface PerformanceMetrics {
  operation: string;
  durationMs: number;
  resourceType: string;
  resourceId?: string;
  metadata?: Record<string, any>;
}

export class AuditContext {
  private context: {
    requestId?: string;
    sessionId?: string;
    userId?: string;
    userEmail?: string;
    userIp?: string;
    userAgent?: string;
    startTime: number;
  };

  constructor(context?: Partial<Omit<AuditContext['context'], 'startTime'>>) {
    this.context = {
      requestId: this.generateRequestId(),
      startTime: Date.now(),
      ...context,
    };
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getContext() {
    return { ...this.context };
  }

  updateContext(updates: Partial<Omit<AuditContext['context'], 'startTime'>>) {
    this.context = { ...this.context, ...updates };
  }

  getDuration(): number {
    return Date.now() - this.context.startTime;
  }
}

/**
 * INSTITUTIONAL AUDIT LOGGER
 * EDGE SAFE: Uses dynamic imports to prevent crashing Middleware
 */
export async function logAuditEvent(event: AuditEvent) {
  // 1. Guard against Edge Runtime
  if (process.env.NEXT_RUNTIME === 'edge') {
    return null; 
  }

  const startTime = Date.now();
  
  try {
    // 2. DYNAMIC IMPORT - Allows this file to be imported in Edge contexts
    const { default: prisma } = await import("@/lib/prisma");

    const finalDetails = event.details || event.metadata || null;
    const severity = event.severity || determineSeverity(event.action, event.status);

    const auditLog = await prisma.systemAuditLog.create({
      data: {
        actorType: event.actorType,
        actorId: event.actorId || null,
        actorEmail: event.actorEmail || null,
        ipAddress: event.ipAddress || null,
        action: event.action,
        resourceType: event.resourceType,
        resourceId: event.resourceId || null,
        status: event.status,
        severity,
        userAgent: event.userAgent || null,
        requestId: event.requestId || null,
        sessionId: event.sessionId || null,
        oldValue: event.oldValue || null,
        newValue: event.newValue || null,
        errorMessage: event.errorMessage || null,
        durationMs: event.durationMs || null,
        metadata: finalDetails ? finalDetails as any : null,
        createdAt: new Date(),
      },
    });

    const durationMs = Date.now() - startTime;
    if (durationMs > 1000) {
      console.warn(`[AUDIT_PERF_WARNING] Audit logging took ${durationMs}ms`);
    }

    return auditLog;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("[AUDIT_CRITICAL_FAILURE] Failed to persist institutional log:", {
      event,
      error: errorMessage,
      timestamp: new Date().toISOString(),
    });
    
    // Fallback console log
    console.log("[AUDIT_FALLBACK]", {
      timestamp: new Date().toISOString(),
      ...event,
      severity: event.severity || determineSeverity(event.action, event.status),
    });
    
    return null;
  }
}

function determineSeverity(action: string, status: string): AuditEvent['severity'] {
  if ([
    AUDIT_ACTIONS.LOGIN_FAILED,
    AUDIT_ACTIONS.ACCESS_DENIED,
    AUDIT_ACTIONS.DELETE,
    AUDIT_ACTIONS.SUSPICIOUS_ACTIVITY,
    AUDIT_ACTIONS.IP_BLOCKED,
    AUDIT_ACTIONS.USER_BLOCKED,
  ].includes(action as any)) {
    return status === 'failed' ? 'critical' : 'high';
  }

  if ([
    AUDIT_ACTIONS.CONFIGURATION_CHANGE,
    AUDIT_ACTIONS.PERMISSION_CHANGED,
    AUDIT_ACTIONS.PASSWORD_CHANGED,
    AUDIT_ACTIONS.RESTORE_INITIATED,
  ].includes(action as any)) {
    return 'high';
  }

  if ([
    AUDIT_ACTIONS.UPDATE,
    AUDIT_ACTIONS.EXPORT,
    AUDIT_ACTIONS.IMPORT,
    AUDIT_ACTIONS.API_ERROR,
  ].includes(action as any)) {
    return 'medium';
  }

  return 'low';
}

// ... Helpers (logAuthEvent, etc) remain the same ...
// They all call logAuditEvent, so they are safe now.

export async function logAuthEvent(data: any) {
  return logAuditEvent({
    ...data,
    resourceType: AUDIT_CATEGORIES.AUTHENTICATION,
    resourceId: data.actorId,
    action: AUDIT_ACTIONS[data.action],
    details: data.details,
    errorMessage: data.errorMessage,
  });
}

export async function logDataAccessEvent(data: any) {
  return logAuditEvent({
    ...data,
    resourceType: data.resourceType,
    resourceId: data.resourceId,
    action: AUDIT_ACTIONS[data.action],
    details: data.details,
    oldValue: data.oldValue,
    newValue: data.newValue,
  });
}

export async function logSecurityEvent(data: any) {
  return logAuditEvent({
    ...data,
    resourceType: data.resourceType || AUDIT_CATEGORIES.SECURITY,
    resourceId: data.resourceId,
    action: AUDIT_ACTIONS[data.action],
    details: data.details,
    errorMessage: data.errorMessage,
  });
}

export async function logPerformanceMetrics(metrics: PerformanceMetrics) {
  return logAuditEvent({
    actorType: "system",
    action: AUDIT_ACTIONS.API_CALL,
    resourceType: AUDIT_CATEGORIES.PERFORMANCE,
    resourceId: metrics.resourceId,
    status: "success",
    severity: "low",
    durationMs: metrics.durationMs,
    details: {
      operation: metrics.operation,
      durationMs: metrics.durationMs,
      ...metrics.metadata,
    },
  });
}

export function withAuditLog(handler: Function, options?: any) {
  return async (req: any, res: any, ...args: any[]) => {
    const context = new AuditContext({
      userId: req.user?.id,
      userEmail: req.user?.email,
      userIp: req.headers['x-forwarded-for']?.split(',')[0]?.trim(),
      userAgent: req.headers['user-agent'],
    });

    const startTime = Date.now();
    let status: AuditEvent['status'] = 'success';
    let errorMessage: string | undefined;

    try {
      const result = await handler(req, res, ...args);
      
      if (options?.logSuccess !== false) {
        await logAuditEvent({
          actorType: req.user?.id ? "member" : "api",
          actorId: req.user?.id,
          actorEmail: req.user?.email,
          ipAddress: context.getContext().userIp,
          action: `${req.method.toLowerCase()}_request`,
          resourceType: options?.resourceType || 'api_endpoint',
          resourceId: req.url?.split('?')[0],
          status: 'success',
          userAgent: context.getContext().userAgent,
          requestId: context.getContext().requestId,
          durationMs: Date.now() - startTime,
          details: {
            method: req.method,
            path: req.url,
            statusCode: res.statusCode,
          },
        });
      }

      return result;
    } catch (error) {
      status = 'failed';
      errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (options?.logErrors !== false) {
        await logAuditEvent({
          actorType: req.user?.id ? "member" : "api",
          actorId: req.user?.id,
          actorEmail: req.user?.email,
          ipAddress: context.getContext().userIp,
          action: `${req.method.toLowerCase()}_request`,
          resourceType: options?.resourceType || 'api_endpoint',
          resourceId: req.url?.split('?')[0],
          status: 'failed',
          severity: 'high',
          userAgent: context.getContext().userAgent,
          requestId: context.getContext().requestId,
          errorMessage,
          durationMs: Date.now() - startTime,
          details: {
            method: req.method,
            path: req.url,
            error: errorMessage,
          },
        });
      }

      throw error;
    }
  };
}

export async function queryAuditLogs(filters?: any) {
  // Edge Guard
  if (process.env.NEXT_RUNTIME === 'edge') return { success: false, error: 'Not supported in Edge' };

  try {
    const { default: prisma } = await import("@/lib/prisma"); // Dynamic Import
    
    const where: any = {};
    if (filters?.actorType) where.actorType = filters.actorType;
    if (filters?.actorId) where.actorId = filters.actorId;
    if (filters?.action) where.action = { contains: filters.action, mode: 'insensitive' };
    if (filters?.resourceType) where.resourceType = filters.resourceType;
    if (filters?.resourceId) where.resourceId = filters.resourceId;
    if (filters?.status) where.status = filters.status;
    if (filters?.severity) where.severity = filters.severity;
    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters?.startDate) where.createdAt.gte = filters.startDate;
      if (filters?.endDate) where.createdAt.lte = filters.endDate;
    }

    const [logs, total] = await Promise.all([
      prisma.systemAuditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: filters?.limit || 100,
        skip: filters?.offset || 0,
      }),
      prisma.systemAuditLog.count({ where }),
    ]);

    return {
      success: true,
      data: logs,
      pagination: {
        total,
        limit: filters?.limit || 100,
        offset: filters?.offset || 0,
      },
    };
  } catch (error) {
    console.error('[AUDIT_QUERY_ERROR]', error);
    return {
      success: false,
      error: 'Failed to query audit logs',
    };
  }
}

export async function cleanupOldAuditLogs(retentionDays: number = 90) {
  // Edge Guard
  if (process.env.NEXT_RUNTIME === 'edge') return null;

  try {
    const { default: prisma } = await import("@/lib/prisma"); // Dynamic Import

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await prisma.systemAuditLog.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
        severity: { in: ['low', 'medium'] },
      },
    });

    console.log(`[AUDIT_CLEANUP] Deleted ${result.count} audit logs older than ${retentionDays} days`);
    return result;
  } catch (error) {
    console.error('[AUDIT_CLEANUP_ERROR]', error);
    return null;
  }
}

export default {
  logAuditEvent,
  logAuthEvent,
  logDataAccessEvent,
  logSecurityEvent,
  logPerformanceMetrics,
  withAuditLog,
  queryAuditLogs,
  cleanupOldAuditLogs,
  AUDIT_CATEGORIES,
  AUDIT_ACTIONS,
  AuditContext,
};