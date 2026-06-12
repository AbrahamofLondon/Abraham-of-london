/**
 * pages/api/admin/boardroom/orders/[id]/generate-dossier.ts
 *
 * Generate a Boardroom dossier draft from a paid order.
 * Moves the order from paid/case_stubs_created → draft_generated.
 *
 * Creates:
 * - BoardroomDossier record
 * - Case study draft linked to the order
 * - Updates ProductArtifact from PENDING → DRAFT
 * - Records audit trail
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { requireAdminServer } from "@/lib/auth/requireAdminServer";
import { BoardroomDossierService } from "@/lib/boardroom/boardroom-dossier-service";
import { createCaseStudyFromBoardroomOrder } from "@/lib/evidence/case-study-boardroom-bridge";
import { assertValidTransition } from "@/lib/boardroom/boardroom-delivery-state-machine.shared";
import { recordBoardroomDeliveryEvent } from "@/lib/boardroom/boardroom-delivery-events.server";
import { routeGovernanceEvent } from "@/lib/platform/governance-event-bus";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  const session = await requireAdminServer(req, res, { routeKey: "admin-boardroom-generate-dossier" });
  if (!session) return;

  const { id } = req.query;
  if (typeof id !== "string") return res.status(400).json({ ok: false, error: "INVALID_ID" });

  try {
    const order = await prisma.boardroomBriefOrder.findUnique({
      where: { id },
      select: {
        id: true, deliveryStatus: true, email: true, userId: true,
        spineId: true, metadata: true, riskLevel: true, score: true,
      },
    });

    if (!order) return res.status(404).json({ ok: false, error: "NOT_FOUND" });

    // Validate transition: paid or case_stubs_created → draft_generated
    assertValidTransition(order.deliveryStatus, "draft_generated", id);

    // 1. Create case study draft from the order
    const caseStudyResult = await createCaseStudyFromBoardroomOrder(
      id,
      session.user?.email ?? undefined,
    );

    if (!caseStudyResult.ok) {
      return res.status(422).json({ ok: false, error: `CASE_STUDY_FAILED: ${caseStudyResult.reason}` });
    }

    // 2. Update ProductArtifact from PENDING → DRAFT
    const artifactId = `pa_boardroom_${id}`;
    await prisma.productArtifact.upsert({
      where: { artifactId },
      create: {
        artifactId,
        productCode: "boardroom-brief",
        sourceEntityType: "boardroom_brief_order",
        sourceEntityId: id,
        userId: order.userId,
        userEmail: order.email,
        status: "DRAFT",
        deliveryStatus: "AWAITING_REVIEW",
        downloadUrl: `/admin/case-studies/${caseStudyResult.record.id}`,
      },
      update: {
        status: "DRAFT",
        deliveryStatus: "AWAITING_REVIEW",
        downloadUrl: `/admin/case-studies/${caseStudyResult.record.id}`,
      },
    });

    // 3. Update order status
    const updated = await prisma.boardroomBriefOrder.update({
      where: { id },
      data: {
        deliveryStatus: "draft_generated",
        metadata: {
          ...(order.metadata as Record<string, unknown> ?? {}),
          caseStudyId: caseStudyResult.record.id,
          dossierGeneratedAt: new Date().toISOString(),
          generatedBy: session.user?.email ?? "admin",
        },
      },
      select: { id: true, deliveryStatus: true, deliveredAt: true, updatedAt: true },
    });

    // 4. Record audit event
    await recordBoardroomDeliveryEvent({
      orderId: id,
      fromStatus: order.deliveryStatus,
      toStatus: "draft_generated",
      actorEmail: session.user?.email ?? "admin",
      note: `Dossier draft generated. Case study: ${caseStudyResult.record.id}`,
    });

    // 5. Emit governance event
    await routeGovernanceEvent({
      eventType: "BOARDROOM_DOSSIER_GENERATED",
      sourceSurface: "boardroom-mode",
      canonicalRecordType: "BoardroomBriefOrder",
      canonicalRecordId: id,
      actorEmail: session.user?.email ?? "admin",
      severity: "HIGH",
      payload: {
        caseStudyId: caseStudyResult.record.id,
        alreadyExists: caseStudyResult.alreadyExists,
      },
      shouldWriteAudit: true,
      shouldWriteLineage: true,
    });

    return res.status(200).json({
      ok: true,
      order: {
        ...updated,
        deliveredAt: updated.deliveredAt?.toISOString() ?? null,
        updatedAt: updated.updatedAt.toISOString(),
      },
      caseStudy: caseStudyResult.record,
      alreadyExists: caseStudyResult.alreadyExists,
    });
  } catch (error) {
    console.error("[admin-boardroom-generate-dossier]", error);
    const message = error instanceof Error ? error.message : "GENERATION_FAILED";
    return res.status(422).json({ ok: false, error: message });
  }
}
