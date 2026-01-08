// lib/audit.ts - Simplified version for rate-limit.ts import
// This file bridges to the server audit module

/**
 * Simplified audit event interface for basic logging
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
 * Simplified logAuditEvent function for client-side/edge usage
 * This is a stub that will defer to the server module when needed
 */
export async function logAuditEvent(event: AuditEvent): Promise<any> {
  // Handle different runtime environments
  if (typeof window === 'undefined') {
    // Server-side: Use the full audit implementation
    try {
      // Dynamically import the server module to prevent Edge runtime issues
      const { logAuditEvent: serverLogAuditEvent } = await import('./server/audit');
      return await serverLogAuditEvent(event);
    } catch (error) {
      // Fallback for build time or if server module fails
      console.log('[AUDIT_FALLBACK]', {
        timestamp: new Date().toISOString(),
        ...event,
        severity: event.severity || 'low',
        _fallback: true
      });
      return { success: false, fallback: true };
    }
  } else {
    // Client-side: Log to console (in development) or send to API
    if (process.env.NODE_ENV === 'development') {
      console.log('[AUDIT_CLIENT]', event);
    }
    
    // In production, you might want to send to an API endpoint
    // For now, just return a mock response
    return { 
      success: true, 
      clientSide: true,
      message: 'Audit logged client-side'
    };
  }
}

/**
 * Simplified helper for rate limiting specifically
 */
export async function logRateLimitEvent(data: {
  ipAddress?: string;
  action: string;
  resourceId?: string;
  status: "success" | "failed" | "warning";
  details?: Record<string, any>;
  errorMessage?: string;
}): Promise<void> {
  await logAuditEvent({
    actorType: "api",
    ipAddress: data.ipAddress,
    action: data.action,
    resourceType: "rate_limit",
    resourceId: data.resourceId || "api_endpoint",
    status: data.status,
    severity: data.status === 'failed' ? 'high' : 'medium',
    details: data.details,
    errorMessage: data.errorMessage,
  });
}

/**
 * Quick audit helper for common cases
 */
export const audit = {
  log: logAuditEvent,
  rateLimit: logRateLimitEvent,
  
  // Simple sync version for critical paths where async isn't feasible
  logSync(event: AuditEvent) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[AUDIT_SYNC]', event);
    }
    // Fire and forget async version
    logAuditEvent(event).catch(err => {
      console.error('[AUDIT_ASYNC_ERROR]', err);
    });
  }
};

export default audit;