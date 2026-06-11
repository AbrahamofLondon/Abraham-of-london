/**
 * lib/evidence/case-study-boardroom-bridge.ts
 *
 * Creates a governed case study draft from a paid Boardroom Brief order.
 * Prefills all available artefact links. Never publishes automatically.
 */

import { prisma } from "@/lib/prisma.server";
import { createCaseStudy, getCaseStudyById } from "./case-study-service";
import type { CaseStudyRecord } from "./case-study-service";

export type BoardroomCaseDraftResult =
  | { ok: true; record: CaseStudyRecord; alreadyExists: false }
  | { ok: true; record: CaseStudyRecord; alreadyExists: true }
  | { ok: false; reason: string };

export async function createCaseStudyFromBoardroomOrder(
  orderId: string,
  adminRef?: string,
): Promise<BoardroomCaseDraftResult> {
  const order = await prisma.boardroomBriefOrder.findUnique({
    where: { id: orderId },
    select: { id: true, email: true, paymentStatus: true, source: true, riskLevel: true, metadata: true },
  });

  if (!order) return { ok: false, reason: "ORDER_NOT_FOUND" };
  if (order.paymentStatus !== "paid") return { ok: false, reason: "ORDER_NOT_PAID" };

  // Check for existing draft already linked to this order
  const existingLink = await prisma.caseStudyEvidence.findFirst({
    where: { sourceType: "boardroom_brief_order", sourceId: orderId },
    select: { caseStudyId: true },
  });
  if (existingLink) {
    const existing = await prisma.caseStudy.findUnique({
      where: { id: existingLink.caseStudyId },
      include: { evidence: true },
    });
    if (existing) {
      const loaded = await getCaseStudyById(existingLink.caseStudyId);
      if (loaded) return { ok: true, record: loaded, alreadyExists: true };
    }
  }

  // Discover linked artefacts
  const artifactId = `pa_boardroom_${orderId}`;
  const hypothesisId = `oh_boardroom_${orderId}`;

  const [artifact, hypothesis, falsification] = await Promise.all([
    prisma.productArtifact.findUnique({ where: { artifactId }, select: { id: true } }),
    prisma.outcomeHypothesis.findUnique({ where: { hypothesisId }, select: { id: true } }),
    prisma.falsificationEntry.findFirst({
      where: { sourceEntityType: "boardroom_brief_order", sourceEntityId: orderId },
      select: { id: true },
    }),
  ]);

  const evidenceLinks = [
    { sourceType: "boardroom_brief_order", sourceId: orderId, notes: "Source paid order" },
    ...(artifact ? [{ sourceType: "product_artifact", sourceId: artifact.id, notes: "ProductArtifact stub from checkout" }] : []),
    ...(hypothesis ? [{ sourceType: "outcome_hypothesis", sourceId: hypothesis.id, notes: "OutcomeHypothesis stub from checkout" }] : []),
    ...(falsification ? [{ sourceType: "falsification_entry", sourceId: falsification.id, notes: "FalsificationEntry stub from checkout" }] : []),
  ];

  const meta = (order.metadata ?? {}) as Record<string, unknown>;
  const title = `Boardroom Brief — Draft Case Study (${new Date().toISOString().slice(0, 10)})`;

  const record = await createCaseStudy({
    title,
    productCode: "boardroom-brief",
    caseType: "boardroom_brief",
    evidenceStatus: "FOUNDER_VERIFIED",
    outcomeStatus: "HYPOTHESIS_SET",
    visibilityStatus: "DRAFT",
    adminRef,
    narrative: {
      sector: typeof meta.sector === "string" ? meta.sector : undefined,
      riskClass: order.riskLevel ?? undefined,
      adminNotes: `Created from BoardroomBriefOrder ${orderId}`,
    },
    evidenceLinks,
  });

  return { ok: true, record, alreadyExists: false };
}
