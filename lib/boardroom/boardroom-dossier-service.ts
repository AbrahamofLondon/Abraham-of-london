/**
 * lib/boardroom/boardroom-dossier-service.ts
 *
 * Boardroom Dossier delivery service.
 * Generates, stores, delivers, and manages client-facing Boardroom Dossiers.
 *
 * This is the commercial delivery pipeline — not a simulation.
 * Every dossier is restricted, access-gated, and lineage-tracked.
 */

import "server-only";

import { prisma } from "@/lib/prisma.server";
import { qualifiesForBoardroom, generateBoardroomDossier } from "@/lib/constitution/boardroom-mode";
import type { IntelligenceSpine } from "@/lib/decision/intelligence-spine";
import type { BoardroomDossier as BoardroomDossierType } from "@/lib/constitution/boardroom-mode";
import { routeGovernanceEvent } from "@/lib/platform/governance-event-bus";

// ─── Types ───────────────────────────────────────────────────────────────────

export type DossierDeliveryRecord = {
  id: string;
  spineId: string;
  title: string;
  classification: string;
  qualifiedForBoard: boolean;
  gateMessage: string | null;
  sections: Array<{ id: string; label: string; tone: string }>;
  objectionCount: number;
  decisionPathCount: number;
  status: "DRAFT" | "APPROVED" | "DELIVERED" | "REVOKED";
  clientEmail?: string;
  clientName?: string;
  accessGrantedAt?: string;
  accessRevokedAt?: string;
  lastViewedAt?: string;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
};

export type GenerateDossierInput = {
  spine: IntelligenceSpine;
  generatedBy: string;
  clientEmail?: string;
  clientName?: string;
};

export type GrantAccessInput = {
  dossierId: string;
  clientEmail: string;
  clientName?: string;
  grantedBy: string;
};

// ─── Service ─────────────────────────────────────────────────────────────────

export const BoardroomDossierService = {

  /**
   * Generate a Boardroom Dossier from an IntelligenceSpine.
   * Stores the dossier record and returns it.
   */
  async generate(input: GenerateDossierInput): Promise<DossierDeliveryRecord> {
    const gate = qualifiesForBoardroom(input.spine);
    const dossier = generateBoardroomDossier(input.spine, []);

    const record = await prisma.boardroomDossier.create({
      data: {
        spineId: input.spine.id,
        title: dossier.title,
        classification: dossier.classification,
        qualifiedForBoard: dossier.qualifiedForBoard,
        gateMessage: dossier.gateMessage,
        sections: dossier.sections as any,
        objectionHandling: dossier.objectionHandling as any,
        decisionPath: dossier.decisionPath as any,
        status: "DRAFT",
        generatedById: input.generatedBy,
        clientEmail: input.clientEmail ?? null,
        clientName: input.clientName ?? null,
      },
    });

    // Emit governance event
    await routeGovernanceEvent({
      eventType: "BOARDROOM_DOSSIER_GENERATED",
      sourceSurface: "boardroom-mode",
      canonicalRecordType: "BoardroomDossier",
      canonicalRecordId: record.id,
      actorId: input.generatedBy,
      severity: "HIGH",
      payload: {
        qualified: dossier.qualifiedForBoard,
        sectionCount: dossier.sections.length,
        spineId: input.spine.id,
      },
      shouldWriteAudit: true,
      shouldWriteLineage: true,
    });

    return this.mapRecord(record);
  },

  /**
   * Approve a dossier for delivery.
   */
  async approve(dossierId: string, approvedBy: string): Promise<DossierDeliveryRecord> {
    const record = await prisma.boardroomDossier.update({
      where: { id: dossierId },
      data: { status: "APPROVED" },
    });

    await routeGovernanceEvent({
      eventType: "BOARDROOM_DOSSIER_APPROVED",
      sourceSurface: "boardroom-mode",
      canonicalRecordType: "BoardroomDossier",
      canonicalRecordId: dossierId,
      actorId: approvedBy,
      severity: "MEDIUM",
      payload: {},
      shouldWriteAudit: true,
      shouldWriteLineage: true,
    });

    return this.mapRecord(record);
  },

  /**
   * Grant access to a client and mark as delivered.
   */
  async grantAccess(input: GrantAccessInput): Promise<DossierDeliveryRecord> {
    const record = await prisma.boardroomDossier.update({
      where: { id: input.dossierId },
      data: {
        status: "DELIVERED",
        clientEmail: input.clientEmail,
        clientName: input.clientName ?? null,
        accessGrantedAt: new Date(),
      },
    });

    await routeGovernanceEvent({
      eventType: "BOARDROOM_DOSSIER_DELIVERED",
      sourceSurface: "boardroom-mode",
      canonicalRecordType: "BoardroomDossier",
      canonicalRecordId: input.dossierId,
      actorId: input.grantedBy,
      severity: "HIGH",
      payload: { clientEmail: input.clientEmail },
      shouldWriteAudit: true,
      shouldWriteLineage: true,
    });

    return this.mapRecord(record);
  },

  /**
   * Revoke access to a dossier.
   */
  async revokeAccess(dossierId: string, revokedBy: string): Promise<DossierDeliveryRecord> {
    const record = await prisma.boardroomDossier.update({
      where: { id: dossierId },
      data: {
        status: "REVOKED",
        accessRevokedAt: new Date(),
      },
    });

    await routeGovernanceEvent({
      eventType: "BOARDROOM_ACCESS_REVOKED",
      sourceSurface: "boardroom-mode",
      canonicalRecordType: "BoardroomDossier",
      canonicalRecordId: dossierId,
      actorId: revokedBy,
      severity: "HIGH",
      payload: {},
      shouldWriteAudit: true,
      shouldWriteLineage: true,
    });

    return this.mapRecord(record);
  },

  /**
   * Record a view of a dossier.
   */
  async recordView(dossierId: string): Promise<void> {
    await prisma.boardroomDossier.update({
      where: { id: dossierId },
      data: {
        lastViewedAt: new Date(),
        viewCount: { increment: 1 },
      },
    });

    await routeGovernanceEvent({
      eventType: "BOARDROOM_DOSSIER_VIEWED",
      sourceSurface: "boardroom-mode",
      canonicalRecordType: "BoardroomDossier",
      canonicalRecordId: dossierId,
      severity: "LOW",
      payload: {},
      shouldWriteAudit: false,
      shouldWriteLineage: true,
    });
  },

  /**
   * Get a dossier by ID.
   */
  async getById(dossierId: string): Promise<DossierDeliveryRecord | null> {
    const record = await prisma.boardroomDossier.findUnique({
      where: { id: dossierId },
    });
    if (!record) return null;
    return this.mapRecord(record);
  },

  /**
   * List all dossiers (admin).
   */
  async list(): Promise<DossierDeliveryRecord[]> {
    const records = await prisma.boardroomDossier.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return records.map((r) => this.mapRecord(r));
  },

  /**
   * Check if a client has access to a dossier.
   */
  async checkAccess(dossierId: string, clientEmail: string): Promise<boolean> {
    const record = await prisma.boardroomDossier.findUnique({
      where: { id: dossierId },
    });
    if (!record) return false;
    if (record.status === "REVOKED") return false;
    if (record.status !== "DELIVERED") return false;
    if (record.clientEmail !== clientEmail) return false;
    return true;
  },

  /**
   * Map Prisma record to DossierDeliveryRecord.
   */
  mapRecord(record: any): DossierDeliveryRecord {
    return {
      id: record.id,
      spineId: record.spineId,
      title: record.title,
      classification: record.classification,
      qualifiedForBoard: record.qualifiedForBoard,
      gateMessage: record.gateMessage,
      sections: Array.isArray(record.sections) ? record.sections : JSON.parse(record.sections ?? "[]"),
      objectionCount: Array.isArray(record.objectionHandling) ? record.objectionHandling.length : 0,
      decisionPathCount: Array.isArray(record.decisionPath) ? record.decisionPath.length : 0,
      status: record.status,
      clientEmail: record.clientEmail ?? undefined,
      clientName: record.clientName ?? undefined,
      accessGrantedAt: record.accessGrantedAt?.toISOString(),
      accessRevokedAt: record.accessRevokedAt?.toISOString(),
      lastViewedAt: record.lastViewedAt?.toISOString(),
      viewCount: record.viewCount ?? 0,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  },
};
