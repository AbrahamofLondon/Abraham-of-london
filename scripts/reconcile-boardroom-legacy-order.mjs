#!/usr/bin/env node
/**
 * scripts/reconcile-boardroom-legacy-order.mjs
 *
 * CLI tool to reconcile legacy Boardroom orders into the governed delivery pipeline.
 *
 * Usage:
 *   node scripts/reconcile-boardroom-legacy-order.mjs <orderId> [actorEmail]
 *
 * If no actorEmail is provided, defaults to "system@reconciliation.script".
 *
 * Example:
 *   node scripts/reconcile-boardroom-legacy-order.mjs cmqa10fcl0000l8093s0jucwr admin@example.com
 */

import { createClient } from "@prisma/client";

const prisma = new createClient();

// ─── Audit Event Map ──────────────────────────────────────────────────────────

const AUDIT_EVENT_MAP = {
  paid: "boardroom_order_paid",
  case_stubs_created: "boardroom_case_stubs_created",
  draft_generated: "boardroom_draft_generated",
  awaiting_operator_review: "boardroom_operator_review_started",
  approved_for_delivery: "boardroom_draft_approved",
  customer_access_ready: "boardroom_customer_access_created",
  delivered: "boardroom_delivered",
  failed: "boardroom_delivery_failed",
  blocked: "boardroom_delivery_blocked",
};

// ─── Detection ────────────────────────────────────────────────────────────────

async function detectContradictions(orderId) {
  const contradictions = [];

  const order = await prisma.boardroomBriefOrder.findUnique({ where: { id: orderId } });
  if (!order) return { contradictions: ["ORDER_NOT_FOUND"], order: null, artifact: null, caseStudy: null, caseStudyId: null };

  const artifactId = `pa_boardroom_${orderId}`;
  const artifact = await prisma.productArtifact.findUnique({ where: { artifactId } });

  const caseStudyEvidence = await prisma.caseStudyEvidence.findFirst({
    where: { sourceType: "boardroom_brief_order", sourceId: orderId },
    select: { caseStudyId: true },
  });

  let caseStudy = null;
  let caseStudyId = null;
  if (caseStudyEvidence) {
    caseStudyId = caseStudyEvidence.caseStudyId;
    caseStudy = await prisma.caseStudy.findUnique({
      where: { id: caseStudyEvidence.caseStudyId },
      select: { id: true, title: true, status: true },
    });
  }

  if (order.deliveryStatus === "dossier_generated" && artifact?.status === "PENDING") {
    contradictions.push("dossier_generated_artifact_pending");
  }
  if (order.deliveryStatus === "dossier_generated" && !caseStudy) {
    contradictions.push("dossier_generated_no_case_study");
  }
  if (order.deliveryStatus === "in_review" && artifact?.status === "PENDING") {
    contradictions.push("in_review_artifact_pending");
  }
  if ((order.deliveryStatus === "draft_generated" || order.deliveryStatus === "dossier_generated") && artifact && !artifact.downloadUrl) {
    contradictions.push("draft_generated_no_admin_preview");
  }
  if (caseStudy && artifact?.status === "PENDING") {
    contradictions.push("case_study_exists_no_artifact_update");
  }

  if (contradictions.length === 0) contradictions.push("none");

  return { contradictions, order, artifact, caseStudy, caseStudyId };
}

// ─── Reconciliation ───────────────────────────────────────────────────────────

async function reconcile(orderId, actorEmail) {
  console.log(`\n═══ Reconcile Legacy Boardroom Order: ${orderId} ═══\n`);

  const { contradictions, order, artifact, caseStudy, caseStudyId } = await detectContradictions(orderId);

  if (!order) {
    console.log("✗ Order not found.");
    return { reconciled: false, errors: ["Order not found"] };
  }

  console.log(`  Current deliveryStatus: ${order.deliveryStatus}`);
  console.log(`  Artifact status: ${artifact?.status ?? "N/A"} / ${artifact?.deliveryStatus ?? "N/A"}`);
  console.log(`  Case study: ${caseStudy ? `${caseStudy.id} (${caseStudy.status})` : "None"}`);
  console.log(`  Contradictions: ${contradictions.join(", ")}`);

  if (contradictions.length === 1 && contradictions[0] === "none") {
    console.log("\n  ✓ No contradictions detected. Order is already in a governed state.\n");
    return { reconciled: false, errors: [] };
  }

  const errors = [];
  const actions = [];

  // Determine new delivery status
  let newDeliveryStatus = order.deliveryStatus;
  if (order.deliveryStatus === "dossier_generated") {
    newDeliveryStatus = caseStudy
      ? (caseStudy.status === "DRAFT" ? "draft_generated" : "awaiting_operator_review")
      : "paid";
    actions.push(`Map status: ${order.deliveryStatus} → ${newDeliveryStatus}`);
  } else if (order.deliveryStatus === "in_review") {
    newDeliveryStatus = "awaiting_operator_review";
    actions.push(`Map status: ${order.deliveryStatus} → ${newDeliveryStatus}`);
  }

  // Build admin preview URL
  let adminPreviewUrl = artifact?.downloadUrl ?? null;
  if (!adminPreviewUrl && caseStudyId) {
    adminPreviewUrl = `/admin/case-studies/${caseStudyId}`;
    actions.push(`Set adminPreviewUrl: ${adminPreviewUrl}`);
  }

  // Update ProductArtifact
  if (artifact) {
    const updates = {};
    if (artifact.status === "PENDING" && caseStudy) {
      updates.status = "DRAFT";
      actions.push("Set artifact status: PENDING → DRAFT");
    }
    if (artifact.deliveryStatus === "PENDING" && caseStudy) {
      updates.deliveryStatus = "AWAITING_REVIEW";
      actions.push("Set artifact deliveryStatus: PENDING → AWAITING_REVIEW");
    }
    if (adminPreviewUrl && adminPreviewUrl !== artifact.downloadUrl) {
      updates.downloadUrl = adminPreviewUrl;
      actions.push(`Set artifact downloadUrl: ${adminPreviewUrl}`);
    }
    if (Object.keys(updates).length > 0) {
      await prisma.productArtifact.update({ where: { artifactId: `pa_boardroom_${orderId}` }, data: updates });
      console.log(`  ✓ ProductArtifact updated: ${JSON.stringify(updates)}`);
    }
  }

  // Update order
  await prisma.boardroomBriefOrder.update({
    where: { id: orderId },
    data: {
      deliveryStatus: newDeliveryStatus,
      metadata: {
        ...((order.metadata ?? {})),
        reconciledAt: new Date().toISOString(),
        reconciledBy: actorEmail,
        previousDeliveryStatus: order.deliveryStatus,
        reconciliationNote: "Legacy order reconciled into governed delivery pipeline",
      },
    },
  });
  console.log(`  ✓ Order status updated to: ${newDeliveryStatus}`);

  // Write audit event (directly to accessAuditLog since we can't import server-only in script)
  try {
    await prisma.accessAuditLog.create({
      data: {
        action: "BOARDROOM_LEGACY_ORDER_RECONCILED",
        actorEmail: actorEmail,
        targetKey: orderId,
        targetType: "BoardroomBriefOrder",
        metadata: JSON.stringify({
          previousStatus: order.deliveryStatus,
          newStatus: newDeliveryStatus,
          contradictions: contradictions.filter(c => c !== "none"),
          actions,
          caseStudyId,
        }),
      },
    });
    console.log("  ✓ Audit event written: BOARDROOM_LEGACY_ORDER_RECONCILED");
  } catch (err) {
    errors.push(`Audit write failed: ${err.message}`);
    console.log(`  ✗ Audit write failed: ${err.message}`);
  }

  // Summary
  console.log("\n  ─── Result ───");
  console.log(`  Reconciled: ${errors.length === 0 ? "Yes" : "Partial"}`);
  console.log(`  New deliveryStatus: ${newDeliveryStatus}`);
  console.log(`  Artifact: ${caseStudy ? "DRAFT / AWAITING_REVIEW" : "Unchanged"}`);
  console.log(`  Admin preview: ${adminPreviewUrl ?? "Not set"}`);
  console.log(`  Customer access: Not generated (blocked until approval)`);
  console.log(`  Mark Delivered: Blocked until all evidence exists`);
  console.log(`  Errors: ${errors.length > 0 ? errors.join("; ") : "None"}`);
  console.log("");

  return { reconciled: errors.length === 0, errors };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const orderId = process.argv[2];
  const actorEmail = process.argv[3] || "system@reconciliation.script";

  if (!orderId) {
    console.log("Usage: node scripts/reconcile-boardroom-legacy-order.mjs <orderId> [actorEmail]");
    console.log("");
    console.log("Examples:");
    console.log("  node scripts/reconcile-boardroom-legacy-order.mjs cmqa10fcl0000l8093s0jucwr");
    console.log("  node scripts/reconcile-boardroom-legacy-order.mjs cmqa10fcl0000l8093s0jucwr admin@example.com");
    process.exitCode = 1;
    return;
  }

  const result = await reconcile(orderId, actorEmail);
  if (!result.reconciled && result.errors.length > 0) {
    process.exitCode = 1;
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exitCode = 1;
});
