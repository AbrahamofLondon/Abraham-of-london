// lib/server/audit.ts
import prisma from "@/lib/prisma";

export type AuditEvent = {
  actorType: "user" | "system" | "admin" | "api";
  actorId?: string;
  actorEmail?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  status?: "success" | "failed";
  details?: unknown;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
};

export async function logAuditEvent(event: AuditEvent): Promise<void> {
  try {
    const {
      actorType,
      actorId,
      actorEmail,
      action,
      resourceType,
      resourceId,
      status = "success",
      details,
      ipAddress,
      userAgent,
      requestId,
    } = event;

    await prisma.systemAuditLog.create({
      data: {
        actorType,
        actorId,
        actorEmail,
        action,
        resourceType,
        resourceId,
        status,
        // store details safely as JSON string (SQLite friendly)
        newValue: details ? JSON.stringify(details) : null,
        ipAddress: ipAddress ?? null,
        userAgent: userAgent ?? null,
        requestId: requestId ?? null,
      },
    });
  } catch (err) {
    // Never block the request because audit logging had a bad day.
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.warn("Audit logging failed:", err);
    }
  }
}