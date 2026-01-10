/* lib/server/audit.ts - PRODUCTION SAFE UPGRADE */
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

// SAFE: Environment detection without crashing
const isEdgeRuntime = (): boolean => {
  if (typeof process === 'undefined') return false;
  if (!process.env) return false;
  return process.env.NEXT_RUNTIME === 'edge';
};

const isProduction = (): boolean => {
  if (typeof process === 'undefined') return false;
  if (!process.env) return false;
  return process.env.NODE_ENV === 'production';
};

const isDevelopment = (): boolean => {
  if (typeof process === 'undefined') return false;
  if (!process.env) return false;
  return process.env.NODE_ENV === 'development';
};

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
      ...this.sanitizeContext(context || {}),
    };
  }

  private sanitizeContext(context: Partial<Omit<AuditContext['context'], 'startTime'>>) {
    // SAFE: Sanitize all string inputs to prevent injection
    const sanitized: any = {};
    
    const sanitizeString = (str: string, maxLength: number): string => {
      return String(str || '').slice(0, maxLength).replace(/[^\w\-_@.]/g, '');
    };

    if (context.requestId && typeof context.requestId === 'string') {
      sanitized.requestId = sanitizeString(context.requestId, 100);
    }
    
    if (context.sessionId && typeof context.sessionId === 'string') {
      sanitized.sessionId = sanitizeString(context.sessionId, 100);
    }
    
    if (context.userId && typeof context.userId === 'string') {
      sanitized.userId = sanitizeString(context.userId, 255);
    }
    
    if (context.userEmail && typeof context.userEmail === 'string') {
      sanitized.userEmail = sanitizeString(context.userEmail, 255);
    }
    
    if (context.userIp && typeof context.userIp === 'string') {
      // Basic IP sanitization
      sanitized.userIp = String(context.userIp).slice(0, 45).replace(/[^\d.:]/g, '');
    }
    
    if (context.userAgent && typeof context.userAgent === 'string') {
      sanitized.userAgent = String(context.userAgent).slice(0, 500);
    }
    
    return sanitized;
  }

  private generateRequestId(): string {
    try {
      // SAFE: Use crypto.randomUUID if available (modern browsers/Node)
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return `req_${crypto.randomUUID()}`;
      }
    } catch {
      // Fall through to timestamp method
    }
    
    // Fallback: timestamp + random (still safe for production)
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).slice(2, 10);
    return `req_${timestamp}_${random}`;
  }

  getContext() {
    return { ...this.context };
  }

  updateContext(updates: Partial<Omit<AuditContext['context'], 'startTime'>>) {
    this.context = { 
      ...this.context, 
      ...this.sanitizeContext(updates) 
    };
  }

  getDuration(): number {
    return Date.now() - this.context.startTime;
  }
}

/**
 * SAFE: Sanitize audit event data before processing
 */
function sanitizeAuditEvent(event: AuditEvent): AuditEvent {
  const sanitized: any = { ...event };
  
  // String length limits and sanitization
  const sanitizeField = (field: any, maxLength: number): any => {
    if (typeof field === 'string') {
      return field.slice(0, maxLength).replace(/[\x00-\x1F\x7F]/g, '');
    }
    return field;
  };

  sanitized.actorId = sanitizeField(sanitized.actorId, 255);
  sanitized.actorEmail = sanitizeField(sanitized.actorEmail, 255);
  sanitized.ipAddress = sanitizeField(sanitized.ipAddress, 45);
  sanitized.action = sanitizeField(sanitized.action, 100);
  sanitized.resourceType = sanitizeField(sanitized.resourceType, 100);
  sanitized.resourceId = sanitizeField(sanitized.resourceId, 255);
  sanitized.userAgent = sanitizeField(sanitized.userAgent, 500);
  sanitized.requestId = sanitizeField(sanitized.requestId, 100);
  sanitized.sessionId = sanitizeField(sanitized.sessionId, 100);
  sanitized.errorMessage = sanitizeField(sanitized.errorMessage, 1000);

  // SAFE: JSON size limits to prevent memory issues
  const limitJsonSize = (obj: any, maxSize: number): any => {
    try {
      const jsonStr = JSON.stringify(obj);
      if (jsonStr.length > maxSize) {
        return { 
          _truncated: true, 
          originalSize: jsonStr.length,
          maxSize,
          timestamp: new Date().toISOString()
        };
      }
      return obj;
    } catch {
      return { _invalidJson: true };
    }
  };

  sanitized.oldValue = limitJsonSize(sanitized.oldValue, 10000);
  sanitized.newValue = limitJsonSize(sanitized.newValue, 10000);
  sanitized.metadata = limitJsonSize(sanitized.metadata, 5000);
  sanitized.details = limitJsonSize(sanitized.details, 5000);

  // Numeric bounds
  if (typeof sanitized.durationMs === 'number') {
    sanitized.durationMs = Math.max(0, Math.min(999999, sanitized.durationMs));
  }

  return sanitized;
}

/**
 * INSTITUTIONAL AUDIT LOGGER
 * EDGE SAFE: Uses dynamic imports to prevent crashing Middleware
 * PRODUCTION SAFE: With comprehensive fallbacks and error handling
 */
export async function logAuditEvent(event: AuditEvent): Promise<any> {
  const startTime = Date.now();
  
  // SAFE: Always sanitize event data first
  const sanitizedEvent = sanitizeAuditEvent(event);
  
  try {
    // CRITICAL: Edge Runtime Guard
    if (isEdgeRuntime()) {
      // Fallback to console log in Edge (safe for production)
      const edgeLog = {
        timestamp: new Date().toISOString(),
        actorType: sanitizedEvent.actorType,
        action: sanitizedEvent.action,
        resourceType: sanitizedEvent.resourceType,
        status: sanitizedEvent.status,
        _edge: true,
        _fallback: true
      };
      
      if (isDevelopment()) {
        console.log('[AUDIT_EDGE_FALLBACK]', edgeLog);
      }
      
      return { success: true, edge: true, logged: edgeLog };
    }

    // SAFE: Dynamic Import - Prevents Edge runtime crashes
    const { default: prisma } = await import("@/lib/prisma");
    
    const finalDetails = sanitizedEvent.details || sanitizedEvent.metadata || null;
    const severity = sanitizedEvent.severity || determineSeverity(sanitizedEvent.action, sanitizedEvent.status);

    // SAFE: Create audit log with sanitized data
    const auditLog = await prisma.systemAuditLog.create({
      data: {
        actorType: sanitizedEvent.actorType,
        actorId: sanitizedEvent.actorId || null,
        actorEmail: sanitizedEvent.actorEmail || null,
        ipAddress: sanitizedEvent.ipAddress || null,
        action: sanitizedEvent.action,
        resourceType: sanitizedEvent.resourceType,
        resourceId: sanitizedEvent.resourceId || null,
        status: sanitizedEvent.status,
        severity,
        userAgent: sanitizedEvent.userAgent || null,
        requestId: sanitizedEvent.requestId || null,
        sessionId: sanitizedEvent.sessionId || null,
        oldValue: sanitizedEvent.oldValue || null,
        newValue: sanitizedEvent.newValue || null,
        errorMessage: sanitizedEvent.errorMessage || null,
        durationMs: sanitizedEvent.durationMs || null,
        metadata: finalDetails ? finalDetails as any : null,
        createdAt: new Date(),
      },
    });

    const durationMs = Date.now() - startTime;
    
    // Performance warning (development only)
    if (durationMs > 1000 && isDevelopment()) {
      console.warn(`[AUDIT_PERF_WARNING] Audit logging took ${durationMs}ms`);
    }

    return auditLog;
  } catch (error) {
    // SAFE: Comprehensive error handling without exposing sensitive data
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = isDevelopment() && error instanceof Error ? error.stack : undefined;
    
    // Critical error logging (safe for production)
    console.error("[AUDIT_CRITICAL_FAILURE] Failed to persist institutional log:", {
      timestamp: new Date().toISOString(),
      actorType: sanitizedEvent.actorType,
      action: sanitizedEvent.action,
      resourceType: sanitizedEvent.resourceType,
      status: sanitizedEvent.status,
      error: isProduction() ? 'Database persistence failed' : errorMessage,
    });
    
    // Fallback console log (always works, safe for production)
    const fallbackLog = {
      timestamp: new Date().toISOString(),
      ...sanitizedEvent,
      severity: sanitizedEvent.severity || determineSeverity(sanitizedEvent.action, sanitizedEvent.status),
      _fallback: true,
      _error: isProduction() ? undefined : errorMessage,
      _stack: isDevelopment() ? errorStack : undefined
    };
    
    console.log("[AUDIT_FALLBACK]", JSON.stringify(fallbackLog));
    
    return { 
      success: false, 
      error: 'Audit logging failed', 
      fallback: true,
      fallbackLog
    };
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

// SAFE: Helper functions with input validation
export async function logAuthEvent(data: any) {
  // Validate input data
  if (!data || typeof data !== 'object') {
    console.error('[AUDIT_INVALID_INPUT] logAuthEvent received invalid data:', data);
    return null;
  }

  const safeData = { ...data };
  
  return logAuditEvent({
    actorType: safeData.actorType || 'member',
    actorId: safeData.actorId,
    actorEmail: safeData.actorEmail,
    ipAddress: safeData.ipAddress,
    action: AUDIT_ACTIONS[safeData.action as keyof typeof AUDIT_ACTIONS] || safeData.action || 'unknown',
    resourceType: AUDIT_CATEGORIES.AUTHENTICATION,
    resourceId: safeData.actorId,
    status: safeData.status || 'success',
    userAgent: safeData.userAgent,
    requestId: safeData.requestId,
    details: safeData.details,
    errorMessage: safeData.errorMessage,
  });
}

export async function logDataAccessEvent(data: any) {
  if (!data || typeof data !== 'object') {
    console.error('[AUDIT_INVALID_INPUT] logDataAccessEvent received invalid data:', data);
    return null;
  }

  const safeData = { ...data };
  
  return logAuditEvent({
    actorType: safeData.actorType || 'member',
    actorId: safeData.actorId,
    actorEmail: safeData.actorEmail,
    ipAddress: safeData.ipAddress,
    action: AUDIT_ACTIONS[safeData.action as keyof typeof AUDIT_ACTIONS] || safeData.action || 'read',
    resourceType: safeData.resourceType || 'unknown',
    resourceId: safeData.resourceId,
    status: safeData.status || 'success',
    userAgent: safeData.userAgent,
    requestId: safeData.requestId,
    oldValue: safeData.oldValue,
    newValue: safeData.newValue,
    details: safeData.details,
  });
}

export async function logSecurityEvent(data: any) {
  if (!data || typeof data !== 'object') {
    console.error('[AUDIT_INVALID_INPUT] logSecurityEvent received invalid data:', data);
    return null;
  }

  const safeData = { ...data };
  
  return logAuditEvent({
    actorType: safeData.actorType || 'system',
    actorId: safeData.actorId,
    actorEmail: safeData.actorEmail,
    ipAddress: safeData.ipAddress,
    action: AUDIT_ACTIONS[safeData.action as keyof typeof AUDIT_ACTIONS] || safeData.action || 'security_event',
    resourceType: safeData.resourceType || AUDIT_CATEGORIES.SECURITY,
    resourceId: safeData.resourceId,
    status: safeData.status || 'success',
    severity: safeData.severity || 'high',
    userAgent: safeData.userAgent,
    requestId: safeData.requestId,
    details: safeData.details,
    errorMessage: safeData.errorMessage,
  });
}

export async function logPerformanceMetrics(metrics: PerformanceMetrics) {
  if (!metrics || typeof metrics !== 'object') {
    console.error('[AUDIT_INVALID_INPUT] logPerformanceMetrics received invalid data:', metrics);
    return null;
  }

  const safeMetrics = { ...metrics };
  
  return logAuditEvent({
    actorType: "system",
    action: AUDIT_ACTIONS.API_CALL,
    resourceType: AUDIT_CATEGORIES.PERFORMANCE,
    resourceId: safeMetrics.resourceId,
    status: "success",
    severity: "low",
    durationMs: safeMetrics.durationMs,
    details: {
      operation: safeMetrics.operation || 'unknown',
      durationMs: safeMetrics.durationMs || 0,
      ...(typeof safeMetrics.metadata === 'object' ? safeMetrics.metadata : {}),
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
          action: `${req.method?.toLowerCase() || 'unknown'}_request`,
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
            ...(options?.extraDetails || {}),
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
          action: `${req.method?.toLowerCase() || 'unknown'}_request`,
          resourceType: options?.resourceType || 'api_endpoint',
          resourceId: req.url?.split('?')[0],
          status: 'failed',
          severity: 'high',
          userAgent: context.getContext().userAgent,
          requestId: context.getContext().requestId,
          errorMessage: isProduction() ? 'Internal server error' : errorMessage,
          durationMs: Date.now() - startTime,
          details: {
            method: req.method,
            path: req.url,
            error: isProduction() ? undefined : errorMessage,
          },
        });
      }

      throw error;
    }
  };
}

export async function queryAuditLogs(filters?: any) {
  // Edge Guard with safe response
  if (isEdgeRuntime()) return { 
    success: false, 
    error: 'Not supported in Edge runtime',
    data: [],
    pagination: { total: 0, limit: 0, offset: 0, pageCount: 0 }
  };

  try {
    const { default: prisma } = await import("@/lib/prisma");
    
    // SAFE: Build where clause with validation
    const where: any = {};
    
    // Validate and sanitize all filter inputs
    const validActorTypes = ['system', 'api', 'member', 'admin', 'cron', 'webhook'];
    if (filters?.actorType && typeof filters.actorType === 'string' && validActorTypes.includes(filters.actorType)) {
      where.actorType = filters.actorType;
    }
    
    if (filters?.actorId && typeof filters.actorId === 'string' && filters.actorId.length <= 255) {
      where.actorId = filters.actorId;
    }
    
    if (filters?.action && typeof filters.action === 'string' && filters.action.length <= 100) {
      where.action = { contains: filters.action, mode: 'insensitive' };
    }
    
    if (filters?.resourceType && typeof filters.resourceType === 'string' && filters.resourceType.length <= 100) {
      where.resourceType = filters.resourceType;
    }
    
    if (filters?.resourceId && typeof filters.resourceId === 'string' && filters.resourceId.length <= 255) {
      where.resourceId = filters.resourceId;
    }
    
    const validStatuses = ['success', 'failed', 'warning', 'pending'];
    if (filters?.status && typeof filters.status === 'string' && validStatuses.includes(filters.status)) {
      where.status = filters.status;
    }
    
    const validSeverities = ['low', 'medium', 'high', 'critical'];
    if (filters?.severity && typeof filters.severity === 'string' && validSeverities.includes(filters.severity)) {
      where.severity = filters.severity;
    }
    
    // Date range validation
    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      
      if (filters?.startDate) {
        const startDate = new Date(filters.startDate);
        if (!isNaN(startDate.getTime())) {
          where.createdAt.gte = startDate;
        }
      }
      
      if (filters?.endDate) {
        const endDate = new Date(filters.endDate);
        if (!isNaN(endDate.getTime())) {
          where.createdAt.lte = endDate;
        }
      }
    }

    // SAFE: Pagination limits
    const limit = Math.max(1, Math.min(1000, parseInt(filters?.limit) || 100));
    const offset = Math.max(0, parseInt(filters?.offset) || 0);

    const [logs, total] = await Promise.all([
      prisma.systemAuditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.systemAuditLog.count({ where }),
    ]);

    return {
      success: true,
      data: logs,
      pagination: {
        total,
        limit,
        offset,
        pageCount: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error('[AUDIT_QUERY_ERROR]', error instanceof Error ? error.message : 'Unknown error');
    return {
      success: false,
      error: 'Failed to query audit logs',
      data: [],
      pagination: { total: 0, limit: 0, offset: 0, pageCount: 0 }
    };
  }
}

export async function cleanupOldAuditLogs(retentionDays: number = 90) {
  // Edge Guard
  if (isEdgeRuntime()) return { 
    success: false, 
    error: 'Not supported in Edge runtime',
    deletedCount: 0 
  };

  try {
    const { default: prisma } = await import("@/lib/prisma");

    // SAFE: Validate retention days
    const safeRetentionDays = Math.max(1, Math.min(365 * 10, retentionDays));
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - safeRetentionDays);

    const result = await prisma.systemAuditLog.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
        severity: { in: ['low', 'medium'] },
      },
    });

    console.log(`[AUDIT_CLEANUP] Deleted ${result.count} audit logs older than ${safeRetentionDays} days`);
    return { success: true, deletedCount: result.count };
  } catch (error) {
    console.error('[AUDIT_CLEANUP_ERROR]', error instanceof Error ? error.message : 'Unknown error');
    return { success: false, error: 'Cleanup failed', deletedCount: 0 };
  }
}

// SAFE: Default export for backward compatibility
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
