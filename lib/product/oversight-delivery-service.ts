/**
 * lib/product/oversight-delivery-service.ts — Delivery queue backed by AuditEvent table.
 *
 * Uses the existing AuditEvent model with objectType "OVERSIGHT_DELIVERY" and
 * stores DeliveryRecord fields in the metadata JSON column.
 */

import { prisma } from "@/lib/prisma.server";
import type {
  DeliveryChannel,
  DeliveryRecord,
  DeliveryStatus,
} from "@/lib/product/delivery-audit-contract";

// ─────────────────────────────────────────────────────────────────────────────
// Queue a new delivery
// ─────────────────────────────────────────────────────────────────────────────

export async function queueDelivery(input: {
  artifactType: "OVERSIGHT_BRIEF" | "PROOF_PACK";
  artifactId: string;
  recipientEmail: string;
  recipientRole: string;
  deliveryMethod: DeliveryChannel;
  suppressionSummary: string;
  clientSafe: boolean;
  actorId?: string | null;
}): Promise<DeliveryRecord> {
  const event = await prisma.auditEvent.create({
    data: {
      actorType: input.actorId ? "ADMIN" : "SYSTEM",
      actorId: input.actorId ?? null,
      objectType: "OVERSIGHT_DELIVERY",
      objectId: input.artifactId,
      actionType: "CREATED",
      summary: `Delivery queued: ${input.artifactType} for ${input.recipientEmail}`,
      metadata: {
        artifactType: input.artifactType,
        artifactId: input.artifactId,
        recipientEmail: input.recipientEmail,
        recipientRole: input.recipientRole,
        approvedBy: null,
        deliveredBy: null,
        deliveredAt: null,
        deliveryMethod: input.deliveryMethod,
        status: "QUEUED" as DeliveryStatus,
        suppressionSummary: input.suppressionSummary,
        clientSafe: input.clientSafe,
      },
    },
  });

  return auditEventToDeliveryRecord(event);
}

// ─────────────────────────────────────────────────────────────────────────────
// Approve a delivery
// ─────────────────────────────────────────────────────────────────────────────

export async function approveDelivery(
  deliveryId: string,
  operatorId: string,
): Promise<DeliveryRecord | null> {
  const existing = await prisma.auditEvent.findUnique({
    where: { id: deliveryId },
  });

  if (!existing || existing.objectType !== "OVERSIGHT_DELIVERY") return null;

  const meta = (existing.metadata ?? {}) as Record<string, unknown>;

  const updated = await prisma.auditEvent.update({
    where: { id: deliveryId },
    data: {
      actionType: "UPDATED",
      summary: `Delivery approved by ${operatorId}`,
      metadata: {
        ...meta,
        status: "APPROVED" as DeliveryStatus,
        approvedBy: operatorId,
      },
    },
  });

  return auditEventToDeliveryRecord(updated);
}

// ─────────────────────────────────────────────────────────────────────────────
// List pending deliveries
// ─────────────────────────────────────────────────────────────────────────────

export async function listPendingDeliveries(): Promise<DeliveryRecord[]> {
  const events = await prisma.auditEvent.findMany({
    where: {
      objectType: "OVERSIGHT_DELIVERY",
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return events
    .map(auditEventToDeliveryRecord)
    .filter(
      (r) =>
        r.status === "QUEUED" ||
        r.status === "APPROVED" ||
        r.status === "TRANSPORT_PENDING",
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// List all deliveries (including completed)
// ─────────────────────────────────────────────────────────────────────────────

export async function listAllDeliveries(): Promise<DeliveryRecord[]> {
  const events = await prisma.auditEvent.findMany({
    where: {
      objectType: "OVERSIGHT_DELIVERY",
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return events.map(auditEventToDeliveryRecord);
}

// ─────────────────────────────────────────────────────────────────────────────
// Record delivery outcome
// ─────────────────────────────────────────────────────────────────────────────

export async function recordDeliveryOutcome(
  deliveryId: string,
  outcome: {
    status: DeliveryStatus;
    deliveredBy?: string | null;
  },
): Promise<DeliveryRecord | null> {
  const existing = await prisma.auditEvent.findUnique({
    where: { id: deliveryId },
  });

  if (!existing || existing.objectType !== "OVERSIGHT_DELIVERY") return null;

  const meta = (existing.metadata ?? {}) as Record<string, unknown>;

  const updated = await prisma.auditEvent.update({
    where: { id: deliveryId },
    data: {
      actionType: "UPDATED",
      summary: `Delivery ${outcome.status.toLowerCase()}: ${meta.artifactType ?? "UNKNOWN"}`,
      metadata: {
        ...meta,
        status: outcome.status,
        deliveredBy: outcome.deliveredBy ?? meta.deliveredBy ?? null,
        deliveredAt:
          outcome.status === "DELIVERED"
            ? new Date().toISOString()
            : (meta.deliveredAt ?? null),
      },
    },
  });

  return auditEventToDeliveryRecord(updated);
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal: convert AuditEvent row to DeliveryRecord
// ─────────────────────────────────────────────────────────────────────────────

function auditEventToDeliveryRecord(event: {
  id: string;
  metadata: unknown;
  createdAt: Date;
}): DeliveryRecord {
  const meta = (event.metadata ?? {}) as Record<string, unknown>;

  return {
    id: event.id,
    artifactType: (meta.artifactType as DeliveryRecord["artifactType"]) ?? "OVERSIGHT_BRIEF",
    artifactId: (meta.artifactId as string) ?? "",
    recipientEmail: (meta.recipientEmail as string) ?? "",
    recipientRole: (meta.recipientRole as string) ?? "",
    approvedBy: (meta.approvedBy as string) ?? null,
    deliveredBy: (meta.deliveredBy as string) ?? null,
    deliveredAt: (meta.deliveredAt as string) ?? null,
    deliveryMethod: (meta.deliveryMethod as DeliveryChannel) ?? "TRANSPORT_PENDING",
    status: (meta.status as DeliveryStatus) ?? "TRANSPORT_PENDING",
    suppressionSummary: (meta.suppressionSummary as string) ?? "",
    clientSafe: (meta.clientSafe as boolean) ?? false,
    createdAt: event.createdAt.toISOString(),
  };
}
