/* lib/server/audit.ts */
import prisma from "@/lib/prisma";

/**
 * AUDIT EVENT INTERFACE
 * Principled Analysis: Aligns with the SystemAuditLog database schema.
 */
export interface AuditEvent {
  actorType: "system" | "api" | "member" | "admin";
  actorId?: string | null;
  actorEmail?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  status: "success" | "failed" | "warning";
  ipAddress?: string | null;
  userAgent?: string | null;
  requestId?: string | null;
  oldValue?: string | null;
  newValue?: string | null;
  details?: Record<string, any> | null;
}

/**
 * INSTITUTIONAL AUDIT LOGGER
 * Outcome: Persists high-gravity system events to the database.
 * Logic: Safely handles JSON stringification and provides a fail-soft boundary.
 */
export async function logAuditEvent(event: AuditEvent) {
  try {
    // Principled Normalization: 
    // If 'details' object is provided, stringify it into 'newValue' for database storage.
    const finalNewValue = event.details 
      ? JSON.stringify(event.details) 
      : event.newValue;

    return await prisma.systemAuditLog.create({
      data: {
        actorType: event.actorType,
        actorId: event.actorId || null,
        actorEmail: event.actorEmail || null,
        action: event.action,
        resourceType: event.resourceType,
        resourceId: event.resourceId || null,
        status: event.status,
        ipAddress: event.ipAddress || null,
        userAgent: event.userAgent || null,
        requestId: event.requestId || null,
        oldValue: event.oldValue || null,
        newValue: finalNewValue || null,
      },
    });
  } catch (error) {
    /**
     * FAIL-SOFT POLICY:
     * In an institutional environment, logging should be secondary to the action.
     * We log the failure to the console but do not throw, preventing a 'crash' 
     * of the calling function (e.g., a login or a content unlock).
     */
    console.error("[AUDIT_CRITICAL_FAILURE] Failed to persist institutional log:", error);
    return null;
  }
}
