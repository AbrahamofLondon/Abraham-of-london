/* lib/server/audit.ts */
import prisma from "@/lib/prisma";

/**
 * AUDIT EVENT INTERFACE
 * Principled Analysis: Aligns with the SystemAuditLog database schema.
 */
export interface AuditEvent {
  actorType: "system" | "api" | "member" | "admin" | "cron" | "webhook";
  actorId?: string | null;
  actorEmail?: string | null;
  ipAddress?: string | null; // Changed from actorIp to ipAddress to match schema
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
 * Institutional classification for consistent reporting
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
 * Standardized action names for institutional consistency
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

/**
 * PERFORMANCE MONITORING INTERFACE
 */
export interface PerformanceMetrics {
  operation: string;
  durationMs: number;
  resourceType: string;
  resourceId?: string;
  metadata?: Record<string, any>;
}

/**
 * AUDIT CONTEXT MANAGER
 * Maintains request context for correlated logging
 */
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
 * Outcome: Persists high-gravity system events to the database.
 * Logic: Safely handles JSON stringification and provides a fail-soft boundary.
 */
export async function logAuditEvent(event: AuditEvent) {
  const startTime = Date.now();
  
  try {
    // Principled Normalization: 
    // Combine metadata and details, preferring details for backward compatibility
    const finalDetails = event.details || event.metadata || null;

    // Determine severity if not provided
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
        metadata: finalDetails ? finalDetails as any : null, // FIXED: Cast to any
        createdAt: new Date(),
      },
    });

    // Performance logging for audit events themselves
    const durationMs = Date.now() - startTime;
    if (durationMs > 1000) {
      console.warn(`[AUDIT_PERF_WARNING] Audit logging took ${durationMs}ms`);
    }

    return auditLog;
  } catch (error) {
    /**
     * FAIL-SOFT POLICY:
     * In an institutional environment, logging should be secondary to the action.
     * We log the failure to the console but do not throw, preventing a 'crash' 
     * of the calling function (e.g., a login or a content unlock).
     */
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("[AUDIT_CRITICAL_FAILURE] Failed to persist institutional log:", {
      event,
      error: errorMessage,
      timestamp: new Date().toISOString(),
    });
    
    // Fallback to console logging when database fails
    console.log("[AUDIT_FALLBACK]", {
      timestamp: new Date().toISOString(),
      ...event,
      severity: event.severity || determineSeverity(event.action, event.status),
    });
    
    return null;
  }
}

/**
 * Determine severity based on action and status
 */
function determineSeverity(action: string, status: string): AuditEvent['severity'] {
  // Critical actions
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

  // High severity actions
  if ([
    AUDIT_ACTIONS.CONFIGURATION_CHANGE,
    AUDIT_ACTIONS.PERMISSION_CHANGED,
    AUDIT_ACTIONS.PASSWORD_CHANGED,
    AUDIT_ACTIONS.RESTORE_INITIATED,
  ].includes(action as any)) {
    return 'high';
  }

  // Medium severity actions
  if ([
    AUDIT_ACTIONS.UPDATE,
    AUDIT_ACTIONS.EXPORT,
    AUDIT_ACTIONS.IMPORT,
    AUDIT_ACTIONS.API_ERROR,
  ].includes(action as any)) {
    return 'medium';
  }

  // Default to low
  return 'low';
}

/**
 * HELPER: Log authentication events
 */
export async function logAuthEvent(
  data: {
    actorType: AuditEvent['actorType'];
    actorId?: string;
    actorEmail?: string;
    ipAddress?: string; // Changed from actorIp to ipAddress
    action: keyof typeof AUDIT_ACTIONS;
    status: AuditEvent['status'];
    userAgent?: string;
    details?: Record<string, any>;
    errorMessage?: string;
  }
) {
  return logAuditEvent({
    ...data,
    resourceType: AUDIT_CATEGORIES.AUTHENTICATION,
    resourceId: data.actorId,
    action: AUDIT_ACTIONS[data.action],
    details: data.details,
    errorMessage: data.errorMessage,
  });
}

/**
 * HELPER: Log data access events
 */
export async function logDataAccessEvent(
  data: {
    actorType: AuditEvent['actorType'];
    actorId?: string;
    actorEmail?: string;
    resourceType: string;
    resourceId?: string;
    action: keyof typeof AUDIT_ACTIONS;
    status: AuditEvent['status'];
    userAgent?: string;
    details?: Record<string, any>;
    oldValue?: string;
    newValue?: string;
  }
) {
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

/**
 * HELPER: Log security events
 */
export async function logSecurityEvent(
  data: {
    actorType: AuditEvent['actorType'];
    actorId?: string;
    actorEmail?: string;
    ipAddress?: string; // Changed from actorIp to ipAddress
    action: keyof typeof AUDIT_ACTIONS;
    status: AuditEvent['status'];
    resourceType?: string;
    resourceId?: string;
    userAgent?: string;
    details?: Record<string, any>;
    errorMessage?: string;
  }
) {
  return logAuditEvent({
    ...data,
    resourceType: data.resourceType || AUDIT_CATEGORIES.SECURITY,
    resourceId: data.resourceId,
    action: AUDIT_ACTIONS[data.action],
    details: data.details,
    errorMessage: data.errorMessage,
  });
}

/**
 * HELPER: Log performance metrics
 */
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

/**
 * AUDIT MIDDLEWARE for Next.js API routes
 */
export function withAuditLog(
  handler: Function,
  options?: {
    resourceType?: string;
    logSuccess?: boolean;
    logErrors?: boolean;
    capturePerformance?: boolean;
  }
) {
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
      
      // Log successful operation if configured
      if (options?.logSuccess !== false) {
        await logAuditEvent({
          actorType: req.user?.id ? "member" : "api",
          actorId: req.user?.id,
          actorEmail: req.user?.email,
          ipAddress: context.getContext().userIp, // Changed from actorIp to ipAddress
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
      
      // Log errors if configured
      if (options?.logErrors !== false) {
        await logAuditEvent({
          actorType: req.user?.id ? "member" : "api",
          actorId: req.user?.id,
          actorEmail: req.user?.email,
          ipAddress: context.getContext().userIp, // Changed from actorIp to ipAddress
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

/**
 * QUERY INTERFACE for retrieving audit logs
 */
export async function queryAuditLogs(filters?: {
  actorType?: AuditEvent['actorType'];
  actorId?: string;
  action?: string;
  resourceType?: string;
  resourceId?: string;
  status?: AuditEvent['status'];
  severity?: AuditEvent['severity'];
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}) {
  try {
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

/**
 * Cleanup old audit logs (to be run periodically via cron)
 */
export async function cleanupOldAuditLogs(retentionDays: number = 90) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await prisma.systemAuditLog.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
        severity: { in: ['low', 'medium'] }, // Keep high/critical logs longer
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