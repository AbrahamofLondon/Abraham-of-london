/**
 * lib/boardroom/reconcile-boardroom-legacy-order.ts
 *
 * Legacy Boardroom order reconciliation.
 *
 * Inspects a Boardroom order created before the governed delivery pipeline
 * upgrade and repairs/migrates it to the new state machine where safe.
 *
 * Legacy failure pattern detected:
 *   - deliveryStatus = "dossier_generated"
 *   - ProductArtifact.status = "PENDING"
 *   - ProductArtifact.deliveryStatus = "PENDING"
 *   - case study draft exists
 *   - adminPreviewUrl missing
 *
 * Expected repair:
 *   - Map delivery status to draft_generated or awaiting_operator_review
 *   - Set ProductArtifact.status = DRAFT
 *   - Set ProductArtifact.deliveryStatus = AWAITING_REVIEW
 *   - Populate adminPreviewUrl with valid admin draft route
 *   - Preserve deliveredAt = null
 *   - Keep customerAccessUrl = null
 *   - Write audit event: BOARDROOM_LEGACY_ORDER_RECONCILED
 *
 * Safety guarantees:
 *   - Does NOT generate customer access automatically
 *   - Does NOT mark delivered automatically
 *   - Idempotent — already-reconciled orders are detected and skipped
 */

import { prisma } from "@/lib/prisma";
import { recordBoardroomDeliveryEvent } from "@/lib/boardroom/boardroom-delivery-events.server";
import { routeGovernanceEvent } from "@/lib/platform/governance-event-bus";

// ─── Types ────────────────────────────────────────────────────────────────────

export type LegacyContradiction =
  | "dossier_generated_artifact_pending"
  | "dossier_generated_no_case_study"
  | "in_review_artifact_pending"
  | "draft_generated_no_admin_preview"
  | "case_study_exists_no_artifact_update"
  | "none";

export type ReconciliationAction =
  | "map_status_to_draft_generated"
  | "map_status_to_awaiting_review"
  | "set_artifact_draft"
  | "set_artifact_awaiting_review"
  | "populate_admin_preview_url"
  | "no_action_needed";

export type ReconciliationResult = {
  reconciled: boolean;
  orderId: string;
  contradictions: LegacyContradiction[];
  actions: ReconciliationAction[];
  previousState: {
    deliveryStatus: string;
    artifactStatus: string | null;
    artifactDeliveryStatus: string | null;
    adminPreviewUrl: string | null;
  };
  newState: {
    deliveryStatus: string;
    artifactStatus: string | null;
    artifactDeliveryStatus: string | null;
    adminPreviewUrl: string | null;
  };
  auditEventWritten: boolean;
  governanceEventWritten: boolean;
  errors: string[];
};

// ─── Detection ────────────────────────────────────────────────────────────────

export async function detectLegacyContradictions(
  orderId: string,
): Promise<{
  contradictions: LegacyContradiction[];
  order: any;
  artifact: any;
  caseStudy: any;
  caseStudyId: string | null;
}> {
  const contradictions: LegacyContradiction[] = [];

  const order = await prisma.boardroomBriefOrder.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    return { contradictions: ["none"], order: null, artifact: null, caseStudy: null, caseStudyId: null };
  }

  const artifactId = `pa_boardroom_${orderId}`;
  const artifact = await prisma.productArtifact.findUnique({
    where: { artifactId },
  });

  // Find case study linked via CaseStudyEvidence
  const caseStudyEvidence = await prisma.caseStudyEvidence.findFirst({
    where: { sourceType: "boardroom_brief_order", sourceId: orderId },
    select: { caseStudyId: true },
  });

  let caseStudy = null;
  let caseStudyId: string | null = null;

  if (caseStudyEvidence) {
    caseStudyId = caseStudyEvidence.caseStudyId;
    caseStudy = await prisma.caseStudy.findUnique({
      where: { id: caseStudyEvidence.caseStudyId },
      select: { id: true, title: true, status: true },
    });
  }

  // Check: dossier_generated but artifact is PENDING
  if (order.deliveryStatus === "dossier_generated" && artifact?.status === "PENDING") {
    contradictions.push("dossier_generated_artifact_pending");
  }

  // Check: dossier_generated but no case study
  if (order.deliveryStatus === "dossier_generated" && !caseStudy) {
    contradictions.push("dossier_generated_no_case_study");
  }

  // Check: in_review but artifact is PENDING
  if (order.deliveryStatus === "in_review" && artifact?.status === "PENDING") {
    contradictions.push("in_review_artifact_pending");
  }

  // Check: draft_generated but no admin preview URL
  if (
    (order.deliveryStatus === "draft_generated" || order.deliveryStatus === "dossier_generated") &&
    artifact &&
    !artifact.downloadUrl
  ) {
    contradictions.push("draft_generated_no_admin_preview");
  }

  // Check: case study exists but artifact not updated to DRAFT
  if (caseStudy && artifact?.status === "PENDING") {
    contradictions.push("case_study_exists_no_artifact_update");
  }

  if (contradictions.length === 0) {
    contradictions.push("none");
  }

  return { contradictions, order, artifact, caseStudy, caseStudyId };
}

// ─── Reconciliation ───────────────────────────────────────────────────────────

export async function reconcileLegacyOrder(
  orderId: string,
  actorEmail: string,
): Promise<ReconciliationResult> {
  const errors: string[] = [];
  const actions: ReconciliationAction[] = [];

  const { contradictions, order, artifact, caseStudy, caseStudyId } =
    await detectLegacyContradictions(orderId);

  if (!order) {
    return {
      reconciled: false,
      orderId,
      contradictions,
      actions: [],
      previousState: { deliveryStatus: "unknown", artifactStatus: null, artifactDeliveryStatus: null, adminPreviewUrl: null },
      newState: { deliveryStatus: "unknown", artifactStatus: null, artifactDeliveryStatus: null, adminPreviewUrl: null },
      auditEventWritten: false,
      governanceEventWritten: false,
      errors: ["Order not found"],
    };
  }

  const previousState = {
    deliveryStatus: order.deliveryStatus,
    artifactStatus: artifact?.status ?? null,
    artifactDeliveryStatus: artifact?.deliveryStatus ?? null,
    adminPreviewUrl: artifact?.downloadUrl ?? null,
  };

  // If no contradictions, skip
  if (contradictions.length === 1 && contradictions[0] === "none") {
    return {
      reconciled: false,
      orderId,
      contradictions,
      actions: ["no_action_needed"],
      previousState,
      newState: previousState,
      auditEventWritten: false,
      governanceEventWritten: false,
      errors: [],
    };
  }

  // Determine new delivery status
  let newDeliveryStatus = order.deliveryStatus;

  if (order.deliveryStatus === "dossier_generated") {
    // Map to draft_generated (case study exists) or awaiting_operator_review
    if (caseStudy) {
      newDeliveryStatus = caseStudy.status === "DRAFT"
        ? "draft_generated"
        : "awaiting_operator_review";
      actions.push("map_status_to_draft_generated");
    } else {
      // No case study — map to paid (pre-draft) so operator can regenerate
      newDeliveryStatus = "paid";
      actions.push("map_status_to_draft_generated");
    }
  } else if (order.deliveryStatus === "in_review") {
    newDeliveryStatus = "awaiting_operator_review";
    actions.push("map_status_to_awaiting_review");
  }

  // Build admin preview URL
  let adminPreviewUrl: string | null = artifact?.downloadUrl ?? null;

  if (!adminPreviewUrl && caseStudyId) {
    adminPreviewUrl = `/admin/case-studies/${caseStudyId}`;
    actions.push("populate_admin_preview_url");
  }

  // Update ProductArtifact
  if (artifact) {
    const artifactUpdates: Record<string, unknown> = {};

    if (artifact.status === "PENDING" && caseStudy) {
      artifactUpdates.status = "DRAFT";
      actions.push("set_artifact_draft");
    }

    if (artifact.deliveryStatus === "PENDING" && caseStudy) {
      artifactUpdates.deliveryStatus = "AWAITING_REVIEW";
      actions.push("set_artifact_awaiting_review");
    }

    if (adminPreviewUrl && adminPreviewUrl !== artifact.downloadUrl) {
      artifactUpdates.downloadUrl = adminPreviewUrl;
    }

    if (Object.keys(artifactUpdates).length > 0) {
      try {
        await prisma.productArtifact.update({
          where: { artifactId: `pa_boardroom_${orderId}` },
          data: artifactUpdates,
        });
      } catch (err) {
        errors.push(`Failed to update ProductArtifact: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  }

  // Update order status
  try {
    await prisma.boardroomBriefOrder.update({
      where: { id: orderId },
      data: {
        deliveryStatus: newDeliveryStatus,
        metadata: {
          ...((order.metadata as Record<string, unknown>) ?? {}),
          reconciledAt: new Date().toISOString(),
          reconciledBy: actorEmail,
          previousDeliveryStatus: order.deliveryStatus,
          reconciliationNote: "Legacy order reconciled into governed delivery pipeline",
        },
      },
    });
  } catch (err) {
    errors.push(`Failed to update order: ${err instanceof Error ? err.message : String(err)}`);
  }

  // Write audit event
  let auditEventWritten = false;
  let governanceEventWritten = false;

  try {
    await recordBoardroomDeliveryEvent({
      orderId,
      fromStatus: order.deliveryStatus,
      toStatus: newDeliveryStatus,
      actorEmail,
      note: `Legacy order reconciled: ${contradictions.join(", ")}. Actions: ${actions.join(", ")}`,
    });
    auditEventWritten = true;
  } catch (err) {
    errors.push(`Failed to write audit event: ${err instanceof Error ? err.message : String(err)}`);
  }

  // Emit governance event
  try {
    await routeGovernanceEvent({
      eventType: "BOARDROOM_LEGACY_ORDER_RECONCILED",
      sourceSurface: "boardroom-mode",
      canonicalRecordType: "BoardroomBriefOrder",
      canonicalRecordId: orderId,
      actorEmail,
      severity: "MEDIUM",
      payload: {
        previousStatus: order.deliveryStatus,
        newStatus: newDeliveryStatus,
        contradictions: contradictions.filter((c) => c !== "none"),
        actions,
        caseStudyId,
      },
      shouldWriteAudit: true,
      shouldWriteLineage: true,
    });
    governanceEventWritten = true;
  } catch (err) {
    errors.push(`Failed to write governance event: ${err instanceof Error ? err.message : String(err)}`);
  }

  const newState = {
    deliveryStatus: newDeliveryStatus,
    artifactStatus: caseStudy ? "DRAFT" : previousState.artifactStatus,
    artifactDeliveryStatus: caseStudy ? "AWAITING_REVIEW" : previousState.artifactDeliveryStatus,
    adminPreviewUrl,
  };

  return {
    reconciled: errors.length === 0,
    orderId,
    contradictions: contradictions.filter((c) => c !== "none"),
    actions,
    previousState,
    newState,
    auditEventWritten,
    governanceEventWritten,
    errors,
  };
}
