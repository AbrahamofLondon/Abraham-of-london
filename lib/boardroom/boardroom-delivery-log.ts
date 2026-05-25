/**
 * lib/boardroom/boardroom-delivery-log.ts
 *
 * Records and queries delivery events for Boardroom Dossier access tokens.
 *
 * Event types:
 *   GENERATED  — token created by admin
 *   SENT       — email dispatched to client
 *   VIEWED     — client opened dossier using token
 *   EXPIRED    — token reached expiresAt (recorded lazily on validation)
 *   REVOKED    — admin revoked the token
 *   RESENT     — admin resent link (old token revoked, new token generated)
 *   SEND_FAILED — email dispatch failed (token still valid)
 */

import "server-only";

import { prisma } from "@/lib/prisma.server";

// ─── Types ────────────────────────────────────────────────────────────────────

export type DeliveryEventType =
  | "GENERATED"
  | "SENT"
  | "VIEWED"
  | "EXPIRED"
  | "REVOKED"
  | "RESENT"
  | "SEND_FAILED";

export type DeliveryEvent = {
  id: string;
  tokenId: string;
  dossierId: string;
  eventType: DeliveryEventType;
  clientEmail: string | null;
  performedBy: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
};

type RecordEventInput = {
  tokenId: string;
  dossierId: string;
  eventType: DeliveryEventType;
  clientEmail?: string | null;
  performedBy?: string | null;
  metadata?: Record<string, unknown>;
};

// ─── Service ──────────────────────────────────────────────────────────────────

export const BoardroomDeliveryLog = {
  /** Record a single delivery event. Fire-and-forget safe — does not throw. */
  async record(input: RecordEventInput): Promise<void> {
    try {
      await prisma.boardroomDeliveryEvent.create({
        data: {
          tokenId: input.tokenId,
          dossierId: input.dossierId,
          eventType: input.eventType,
          clientEmail: input.clientEmail ?? null,
          performedBy: input.performedBy ?? null,
          metadata: (input.metadata ?? null) as any,
        },
      });
    } catch (err) {
      // Log but do not surface — delivery log failure must not block delivery
      console.error("[BOARDROOM_DELIVERY_LOG_ERROR]", {
        eventType: input.eventType,
        dossierId: input.dossierId,
        tokenId: input.tokenId,
        error: err instanceof Error ? err.message : "Unknown",
      });
    }
  },

  /** Get full delivery log for a dossier, ordered newest-first. */
  async forDossier(dossierId: string): Promise<DeliveryEvent[]> {
    const rows = await prisma.boardroomDeliveryEvent.findMany({
      where: { dossierId },
      orderBy: { createdAt: "desc" },
    });
    return rows.map((r) => ({
      id: r.id,
      tokenId: r.tokenId,
      dossierId: r.dossierId,
      eventType: r.eventType as DeliveryEventType,
      clientEmail: r.clientEmail,
      performedBy: r.performedBy,
      metadata: r.metadata as Record<string, unknown> | null,
      createdAt: r.createdAt,
    }));
  },

  /** Get delivery log for a specific token. */
  async forToken(tokenId: string): Promise<DeliveryEvent[]> {
    const rows = await prisma.boardroomDeliveryEvent.findMany({
      where: { tokenId },
      orderBy: { createdAt: "desc" },
    });
    return rows.map((r) => ({
      id: r.id,
      tokenId: r.tokenId,
      dossierId: r.dossierId,
      eventType: r.eventType as DeliveryEventType,
      clientEmail: r.clientEmail,
      performedBy: r.performedBy,
      metadata: r.metadata as Record<string, unknown> | null,
      createdAt: r.createdAt,
    }));
  },

  /** Summary counts for a dossier: how many sent, viewed, revoked. */
  async summary(dossierId: string): Promise<{
    generated: number;
    sent: number;
    viewed: number;
    revoked: number;
    sendFailed: number;
  }> {
    const events = await prisma.boardroomDeliveryEvent.groupBy({
      by: ["eventType"],
      where: { dossierId },
      _count: { eventType: true },
    });

    const counts: Record<string, number> = {};
    for (const e of events) {
      counts[e.eventType] = e._count.eventType;
    }

    return {
      generated: counts["GENERATED"] ?? 0,
      sent: counts["SENT"] ?? 0,
      viewed: counts["VIEWED"] ?? 0,
      revoked: counts["REVOKED"] ?? 0,
      sendFailed: counts["SEND_FAILED"] ?? 0,
    };
  },
};
